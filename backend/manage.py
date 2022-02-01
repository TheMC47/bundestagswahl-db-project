import sys
import os
from dataclasses import dataclass
from os import listdir
from os.path import isfile, join, splitext

import click

from connection import Transaction
from seed_candidates import (
    seed_candidates_2017,
    seed_candidates_2021,
    seed_ergebnisse,
    seed_landeslisten_2017,
    seed_landeslisten_2021,
    seed_minority_parties,
    seed_wahldaten,
)
from seed_parties import seed_parties

from seed_structure_data import seed_unemployment


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
        db.insert_bulk(
            "erststimmen",
            ["direktkandidat", "wahlkreis"],
            (tup[1], wkdaten.pk),
            tup[2],
        )

    db.insert_bulk(
        "erststimmen",
        ["direktkandidat", "wahlkreis"],
        (None, wkdaten.pk),
        wkdaten.ungueltig_erste_stimme,
    )


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
        db.insert_bulk(
            "zweitstimmen",
            ["landesliste", "wahlkreis"],
            (tup[1], tup[3]),
            tup[2],
        )

    db.insert_bulk(
        "zweitstimmen",
        ["landesliste", "wahlkreis"],
        (None, wkdaten.pk),
        wkdaten.ungueltig_zweite_stimme,
    )


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
    voters: bool = False,
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
    generate_first_votes(db, wkdaten)
    generate_second_votes(db, wkdaten)
    if voters:
        generate_voters(db, wkdaten)


@manage.command()
@click.option("-w", "--wahlkreis", type=int, help="ID of the polling station")
@click.option("-y", "--year", type=int, required=True)
def generate_votes(wahlkreis, year):
    """
    Generate votes based on aggregated results
    """
    # Get first vote results
    db = Transaction()

    db.disable_constraints("erststimmen")
    db.disable_constraints("zweitstimmen")
    db.disable_constraints("wahlkreise")

    if wahlkreis is not None:
        generate_wahlkreis(db, wahlkreis, year, True)
        db.enable_constraints("erststimmen")
        db.enable_constraints("zweitstimmen")
        db.enable_constraints("wahlkreise")
        db.commit()
        return

    for w in db.select_all("wahlkreise"):
        generate_wahlkreis(db, w[0], year)

    db.enable_constraints("erststimmen")
    db.enable_constraints("zweitstimmen")
    db.enable_constraints("wahlkreise")

    db.commit()


@manage.command()
@click.option(
    "-w",
    "--wahlkreis",
    type=int,
    required=True,
    help="ID of the polling station",
)
@click.option("-y", "--year", type=int, required=True)
def deaggregate(year, wahlkreis):
    """
    Create votes and voter keys from aggregated data
    """
    db = Transaction()

    db.disable_constraints("erststimmen")
    db.disable_constraints("zweitstimmen")
    db.disable_constraints("wahlkreise")
    db.disable_constraints("waehler")

    generate_wahlkreis(db, wahlkreis, year, panic=True, voters=True)

    db.enable_constraints("erststimmen")
    db.enable_constraints("zweitstimmen")
    db.enable_constraints("wahlkreise")
    db.enable_constraints("waehler")

    db.commit()


@manage.command()
@click.option(
    "-w",
    "--wahlkreis",
    type=int,
    required=True,
    help="ID of the polling station",
)
def demo(wahlkreis: int):
    deaggregate.callback(2021, wahlkreis)

    print("Helper ", end="")
    add_helper.callback(wahlkreis, "Max", "Mustermann")

    print("Activation keys:")
    create_activation_keys.callback(wahlkreis, 5)

    print("Voter keys:")
    create_voter_keys.callback(wahlkreis, 5)


@manage.command()
@click.option(
    "-w",
    "--wahlkreis",
    type=int,
    required=True,
    help="ID of the polling station",
)
def aggregate(wahlkreis):
    """
    Refresh polling-station aggregates
    """
    db = Transaction()

    db.do(f"refresh_aggregates({wahlkreis})")

    db.commit()


@manage.command()
def calculate_results():
    """
    Calculates election results
    """
    run_script.callback("scripts/calculate-seats.sql")


@manage.command()
def seed():
    """
    Load data from csv files into the database
    """
    db = Transaction()
    seed_parties_res = seed_parties(db)
    seed_wahldaten(2021, db=db)
    seed_wahldaten(2017, db=db)
    seed_unemployment(db)
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
    seed_minority_parties(db)
    db.commit()


@manage.command()
@click.argument("script")
def run_script(script):
    """
    Run an SQL script
    """
    db = Transaction()
    db.run_script(script)
    db.commit()


@manage.command()
def migrate():
    """
    Load the database schema
    """

    MIGRATIONS_DIR = "migrations"
    migrations = sorted(
        [
            f
            for f in listdir(MIGRATIONS_DIR)
            if (isfile(join(MIGRATIONS_DIR, f)) and splitext(f)[1] == ".sql")
        ]
    )
    for migration in migrations:
        print(f"Migrating: {migration}")
        db = Transaction()
        db.run_script(join(MIGRATIONS_DIR, migration))
        db.commit()


@manage.command()
@click.option(
    "-w",
    "--wahlkreis",
    type=int,
    required=True,
    help="ID of the polling station",
)
@click.option(
    "-n",
    "--number",
    type=int,
    required=True,
    help="Number of keys to be created",
)
def create_voter_keys(wahlkreis, number):
    """
    Create voter keys
    """

    db = Transaction()

    query = f"""
        INSERT INTO waehler(wahl,wahlkreis,hat_abgestimmt) (
            SELECT 1, {wahlkreis}, false
            FROM generate_series(1, {number})
        ) RETURNING id;
    """
    data = db.run_query(query)
    print("\n".join([d[0] for d in data]))
    db.commit()


@manage.command()
@click.option(
    "-w",
    "--wahlkreis",
    type=int,
    required=True,
    help="ID of the polling station",
)
@click.option(
    "-n",
    "--number",
    type=int,
    required=True,
    help="Number of keys to be created",
)
def create_activation_keys(wahlkreis, number):
    """
    Create activation keys
    """

    db = Transaction()

    query = f"""
        INSERT INTO wahlkreis_keys(wahlkreis) (
            SELECT {wahlkreis}
            FROM generate_series(1, {number})
        ) RETURNING *;
    """
    data = db.run_query(query)
    print("\n".join([d[0] for d in data]))
    db.commit()


@manage.command()
@click.option(
    "-w",
    "--wahlkreis",
    type=int,
    required=True,
    help="ID of the polling station",
)
@click.option(
    "-f",
    "--first-name",
    type=str,
    required=True,
    help="Firstname of the helper",
)
@click.option(
    "-l", "--last-name", type=str, required=True, help="Lastname of the helper"
)
def add_helper(wahlkreis, first_name, last_name):
    """
    Add helpers for a polling station
    """
    db = Transaction()

    query = f"""
        INSERT INTO wahlkreishelfer(wahlkreis,nachname,vornamen)
        VALUES ({wahlkreis}, '{last_name}', '{first_name}')
        RETURNING kennung;
    """

    data = db.run_query(query)
    print(f"Key: {data[0][0]}")

    db.commit()


@manage.command()
def setup():
    """
    Prepare and populate the database
    """
    print("Migrating...")
    migrate.callback()
    print("Done!")
    print("Seeding...")
    seed.callback()
    print("Done!")
    print("Calculating seats...")
    calculate_results.callback()
    print("Done!")
    print("Refreshing schema...")
    os.system("docker-compose kill -s SIGUSR1 server > /dev/null 2>&1")
    print("Done")


@manage.command()
def count_votes():
    """
    Aggregate votes and compute results
    """
    print("Aggregating votes...")
    run_script.callback("scripts/aggregate-votes.sql")
    print("Done!")
    print("Calculating seats...")
    run_script.callback("scripts/calculate-seats.sql")
    print("Done!")


if __name__ == "__main__":
    manage()  # pylint: disable=no-value-for-parameter
