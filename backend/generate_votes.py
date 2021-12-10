import click
import sys
import pprint
import uuid

from dataclasses import dataclass

from connection import Transaction


@dataclass
class Wahlkreisdaten:
    pk: int
    wahlberechtigte: int
    waehlende: int
    wahlkreis: int
    wahl: int
    ungueltig_erste_stimme: int
    ungueltig_zweite_stimme: int


def random_waehlerid():
    return uuid.uuid4().hex + uuid.uuid4().hex


def generate_voter_ids(wkdata: Wahlkreisdaten):
    return [
        (random_waehlerid(), wkdata.wahlkreis, wkdata.wahl, True)
        for _ in range(wkdata.waehlende)
    ] + [
        (random_waehlerid(), wkdata.wahlkreis, wkdata.wahl, False)
        for _ in range(wkdata.wahlberechtigte - wkdata.waehlende)
    ]

def with_logging(generating):
    # TODO timing?
    def wrapper(f):
        def wrapped(db: Transaction, wkdaten: Wahlkreisdaten):
            print(f"Generating {generating}...")
            f(db, wkdaten)
            print("Done!")
        return wrapped
    return wrapper

@with_logging("voters")
def generate_voters(db: Transaction, wkdaten: Wahlkreisdaten):
    # 2. Generate voters
    waehler = generate_voter_ids(wkdaten)

    voters = db.insert_into(
        "waehler", waehler, ["id", "wahlkreis", "wahl", "hat_abgestimmt"]
    )

    print(f"Inserted: Waehler -> {len(voters)}:{len([v for v in voters if v[3]])}:{len([v for v in voters if not v[3]])}")


@with_logging("first votes")
def generate_first_votes(db: Transaction, wkdaten: Wahlkreisdaten):
    query = f"""SELECT es.*
    FROM erststimmeergebnisse es
      JOIN direktkandidaten d ON es.direktkandidat = d.id
      JOIN parteikandidaturen pk ON pk.id = d.partei
    WHERE d.wahlkreis={wkdaten.wahlkreis} AND pk.wahl={wkdaten.wahl}
    """
    first_vote_res = db.run_query(query)

    for tup in first_vote_res:
        first_votesq = f"""
        INSERT INTO erststimmen(direktkandidat) (
            SELECT {tup[1]}
            FROM generate_series(1, {tup[2]})
        ) RETURNING *
        """
        res = db.run_query(first_votesq)
        print("Inserted: Erststimmen -> ", end="")
        print(f"x{len(res)} for {tup[1]}")


@with_logging("second votes")
def generate_second_votes(db: Transaction, wkdaten: Wahlkreisdaten):
    query = f"""SELECT zs.*
    FROM zweitstimmeergebnisse zs
      JOIN landeslisten ll ON ll.id = zs.landesliste
      JOIN parteikandidaturen pk ON pk.id = ll.partei
    WHERE zs.wahlkreis={wkdaten.wahlkreis} AND  pk.wahl={wkdaten.wahl}
    """
    second_vote_res = db.run_query(query)

    for tup in second_vote_res:
        second_votesq = f"""
        INSERT INTO zweitstimmen(landesliste, wahlkreis) (        
            SELECT {tup[1]}, {tup[3]}
            FROM generate_series(1, {tup[2]})
        ) RETURNING *
        """
        res = db.run_query(second_votesq)
        print("Inserted: Zweitstimmen -> ", end="")
        print(f"x{len(res)} for {tup[1]}, {tup[3]}")


def generate_wahlkreis(db: Transaction, wk: int, year: int, panic=False):

    wahlid = 1 if year == 2021 else 2

    query = f"""SELECT *
        FROM wahlkreiswahldaten
        WHERE wahlkreis={wk} AND wahl={wahlid}"""
    data = db.run_query(query)

    if not data:
        print(f"Not data found for Wahlkreis {wk} for year {year}")
        if panic:
            sys.exit(1)
        else:
            return
    if len(data) > 1:
        print(f"Found more than one result ({len(data)}). Aborting...")
        if panic:
            sys.exit(1)
        else:
            return

    wkdaten = Wahlkreisdaten(*data[0])
    generate_voters(db, wkdaten)
    generate_first_votes(db, wkdaten)
    generate_second_votes(db, wkdaten)


@click.command()
@click.option("-w", "--wahlkreis", type=int)
@click.option("-y", "--year", type=int, required=True)
def main(wahlkreis, year):
    # Get first vote results
    db = Transaction()

    if wahlkreis is not None:
        generate_wahlkreis(db, wahlkreis, year, True)
        return

    for w in db.select_all("wahlkreise"):
        generate_wahlkreis(db, w[0], year)



if __name__ == "__main__":
    main()  # pylint: disable=no-value-for-parameter
