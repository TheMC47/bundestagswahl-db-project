import click

from connection import Transaction

from seed_parties import seed_parties
from seed_candidates import (
    seed_wahldaten,
    seed_landeslisten_2021,
    seed_landeslisten_2017,
    seed_candidates_2021,
    seed_candidates_2017,
    seed_ergebnisse,
)


@click.group()
def manage():
    pass


@manage.command()
def seed():
    """Load data from csv files into the database"""
    db = Transaction()
    seed_parties_res = seed_parties(db)
    seed_wahldaten(2021, db=db)
    seed_wahldaten(2017, db=db)
    landeslisten_2021 = seed_landeslisten_2021(db, seed_parties_res)
    landeslisten_2017 = seed_landeslisten_2017(db, seed_parties_res)
    direct_candidates_2021 = seed_candidates_2021(
        db, seed_parties_res, landeslisten_2021
    )
    direct_candidates_2017 = seed_candidates_2017(db, seed_parties_res)
    seed_ergebnisse(
        db,
        direct_candidates_2017,
        direct_candidates_2021,
        seed_parties_res,
        landeslisten_2017,
        landeslisten_2021,
    )
    db.commit()


if __name__ == "__main__":
    manage()  # pylint: disable=no-value-for-parameter
