import csv
from dataclasses import dataclass

from connection import Transaction
from data_classes import Candidacy, Party


@dataclass
class PartyCSV2017:
    abbrv: str
    name: str
    additional_txt: str

    @property
    def abbrv_or_name(self):
        return self.abbrv if self.abbrv else self.name


@dataclass
class PartyCSV2021:
    group_name: str
    abbrv: str
    name: str
    additional_txt: str

    @property
    def abbrv_or_name(self):
        return self.abbrv if self.abbrv else self.name

    @property
    def is_real_party(self):
        return self.group_name == "Partei"


def seed_parties_2017(db: Transaction):
    with open("data/parteien2017.csv", newline="") as f:  # 2017
        parties_csv = csv.reader(f, delimiter=",")

        data = [PartyCSV2017(*x) for x in list(parties_csv)]
        # Parties
        parties_raw = list({(p.name, p.abbrv, True) for p in data})

        parties_db = db.insert_into(
            "parteien",
            parties_raw,
            ["name", "kurzbezeichnung", "is_echte_partei"],
            Party,
        )

        party_name_to_pk = {p.abbrv_or_name: p.pk for p in parties_db}

        pk_to_name = {p.pk: p.abbrv_or_name for p in parties_db}

        # Candidacies
        candidacies_raw = [
            (
                party_name_to_pk[p.abbrv_or_name],
                2,
                p.additional_txt,
            )
            for p in data
        ]

        parties_candidates_db = db.insert_into(
            "parteikandidaturen",
            candidacies_raw,
            ["partei", "wahl", "zusatzbezeichnung"],
            Candidacy,
        )

        party_name_to_candidacy_pk = {
            (pk_to_name[c.party_pk], c.vote_id): c.pk
            for c in parties_candidates_db
        }

        return party_name_to_pk, party_name_to_candidacy_pk, pk_to_name


def seed_parties_2021(
    db: Transaction,
    party_name_to_pk: dict[str, int],
    party_name_to_candidacy_pk: dict[(str, int), int],
    pk_to_name: dict[int, str],
):
    with open("data/btw21_parteien.csv", newline="") as f:  # 2017
        parties_csv = csv.reader(f, delimiter=";")

        data = [PartyCSV2021(*x) for x in list(parties_csv)]

        # Parties
        parties_raw = list(
            {
                (p.name, p.abbrv, p.is_real_party)
                for p in data
                if p.abbrv_or_name not in party_name_to_pk and p.is_real_party
            }
        )

        parties_db = db.insert_into(
            "parteien",
            parties_raw,
            ["name", "kurzbezeichnung", "is_echte_partei"],
            Party,
        )

        party_name_to_pk.update({p.abbrv_or_name: p.pk for p in parties_db})

        pk_to_name.update({p.pk: p.abbrv_or_name for p in parties_db})

        # Candidacies
        candidacies_raw = [
            (
                party_name_to_pk[p.abbrv_or_name],
                1,
                p.additional_txt,
            )
            for p in data
            if p.is_real_party
        ]

        parties_candidates_db = db.insert_into(
            "parteikandidaturen",
            candidacies_raw,
            ["partei", "wahl", "zusatzbezeichnung"],
            Candidacy,
        )

        party_name_to_candidacy_pk.update(
            {
                (pk_to_name[c.party_pk], c.vote_id): c.pk
                for c in parties_candidates_db
            }
        )

        return party_name_to_candidacy_pk


def seed_parties(db: Transaction = None):

    if db is None:
        db = Transaction()
    return seed_parties_2021(db, *seed_parties_2017(db))
