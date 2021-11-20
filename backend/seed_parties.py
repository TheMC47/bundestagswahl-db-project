import csv

from dataclasses import dataclass

from connection import Transaction

@dataclass
class PartyCSV:
    abbrv: str
    name: str
    additional_txt: str
    vote_id: int

    @property
    def abbrv_or_name(self):
        return self.abbrv if self.abbrv else self.name

def seed_parties(db: Transaction = None):

    if db is None:
        db = Transaction()

    with open("parteien.csv", newline="") as f:
        parties_csv = csv.reader(f, delimiter=",")

        data = [PartyCSV(*x) for x in list(parties_csv)]
        # Parties
        parties_raw = list({(p.name, p.abbrv) for p in data})

        parties_db = db.insert_into(
            "parteien",
            parties_raw,
            ["name", "kurzbezeichnung"],
            PartyDB,
        )

        party_name_to_pk = {p.abbrv_or_name: p.pk for p in parties_db}

        pk_to_name = {p.pk: p.abbrv_or_name for p in parties_db}

        # Candidacies
        candidacies_raw = [
            (
                party_name_to_pk[p.abbrv_or_name],
                p.vote_id,
                p.additional_txt,
            )
            for p in data
        ]

        parties_candidates_db = db.insert_into(
            "parteikandidaturen",
            candidacies_raw,
            ["partei", "wahl", "zusatzbezeichnung"],
            CandidacyDB,
        )

        party_name_to_candidacy_pk = {
            (pk_to_name[c.party_pk], c.vote_id): c.pk
            for c in parties_candidates_db
        }

        return party_name_to_pk, party_name_to_candidacy_pk
