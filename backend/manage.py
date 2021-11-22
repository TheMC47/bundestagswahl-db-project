import sys
from dataclasses import dataclass

import click

from connection import Transaction
from seed_candidates import (
    seed_candidates_2017,
    seed_candidates_2021,
    seed_ergebnisse,
    seed_landeslisten_2017,
    seed_landeslisten_2021,
    seed_wahldaten,
)
from seed_parties import seed_parties


@click.group()
def manage():
    pass


@dataclass
class Wahlkreisdaten:
    pk: int
    wahlberechtigte: int
    waehlende: int
    wahlkreis: int
    wahl: int
    ungueltig_erste_stimme: int
    ungueltig_zweite_stimme: int


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

    voted = f"""
        INSERT INTO waehler(wahl, wahlkreis,hat_abgestimmt) (
            SELECT 1, {wkdaten.pk}, true
            FROM generate_series(1, {wkdaten.waehlende})
        )
    """

    didnt_vote = f"""
        INSERT INTO waehler(wahl, wahlkreis,hat_abgestimmt) (
            SELECT 1, {wkdaten.pk}, false
            FROM generate_series(1, {wkdaten.wahlberechtigte - wkdaten.waehlende})
        )
    """

    db.run_query(voted, fetch=False)
    db.run_query(didnt_vote, fetch=False)


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
        )
        """

        db.run_query(first_votesq, fetch=False)


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
        )
        """
        db.run_query(second_votesq, fetch=False)


def error(msg: str, panic: bool = False):
    print(msg)
    if panic:
        sys.exit(1)
    else:
        return


def generate_wahlkreis(
    db: Transaction,
    wk: int,
    year: int,
    panic: bool = False,
):
    print(f"Processing: {wk}")
    wahlid = 1 if year == 2021 else 2

    query = f"""SELECT *
        FROM wahlkreiswahldaten
        WHERE wahlkreis={wk} AND wahl={wahlid}"""
    data = db.run_query(query)

    if not data:
        return error(
            f"Not data found for Wahlkreis {wk} for year {year}", panic
        )
    if len(data) > 1:
        return error(
            f"Found more than one result ({len(data)}). Aborting...", panic
        )

    wkdaten = Wahlkreisdaten(*data[0])
    generate_voters(db, wkdaten)
    generate_first_votes(db, wkdaten)
    generate_second_votes(db, wkdaten)


@manage.command()
@click.option("-w", "--wahlkreis", type=int)
@click.option("-y", "--year", type=int, required=True)
def generate_votes(wahlkreis, year):
    # Get first vote results
    db = Transaction()

    if wahlkreis is not None:
        generate_wahlkreis(db, wahlkreis, year, True)
        db.commit()
        return

    for w in db.select_all("wahlkreise"):
        generate_wahlkreis(db, w[0], year)

    db.commit()


@manage.command()
def seed():
    """Load data from csv files into the database"""
    db = Transaction()
    seed_parties_res = seed_parties(db)
    seed_wahldaten(2021, db=db)
    seed_wahldaten(2017, db=db)
    landeslisten_2021 = seed_landeslisten_2021(db, seed_parties_res)
    landeslisten_2017 = seed_landeslisten_2017(db, seed_parties_res)
    direct_candidates_2021, independent_candidates = seed_candidates_2021(
        db, seed_parties_res, landeslisten_2021
    )
    direct_candidates_2017 = seed_candidates_2017(db, seed_parties_res)
    seed_ergebnisse(
        db,
        direct_candidates_2017,
        direct_candidates_2021,
        independent_candidates,
        seed_parties_res,
        landeslisten_2017,
        landeslisten_2021,
    )
    db.commit()


if __name__ == "__main__":
    manage()  # pylint: disable=no-value-for-parameter
