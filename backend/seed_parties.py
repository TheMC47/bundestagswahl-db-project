import csv

from connection import Transaction


def seed_parties():
    db = Transaction()
    with open("parteien.csv", newline="") as f:
        parties_csv = csv.reader(f, delimiter=",")
        data = list(parties_csv)
        # Parties
        parties = list({(p[1], p[0]) for p in data})
        print(parties)

        parties_db = db.insert_into(
            "parteien",
            parties,
            ["name", "kurzbezeichnung"],
        )

        party_dict = {
            p[2] if p[2] is not None else p[1]: p[0] for p in parties_db
        }
        party1_dict = {
            p[0]: p[2] if p[2] is not None else p[1] for p in parties_db
        }
        # Candidacies
        candidacies = [
            (
                party_dict[p[0]] if p[0] in party_dict else party_dict[p[1]],
                p[3],
                p[2],
            )
            for p in data
        ]

        parties_candidates_db = db.insert_into(
            "parteikandidaturen",
            candidacies,
            ["partei", "wahl", "zusatzbezeichnung"],
        )

        party_candidacy_dict = {
            (party1_dict.get(p[1]), p[2]): p[0] for p in parties_candidates_db
        }

        # db.commit()
        # db.close()
        return party_dict, party_candidacy_dict
