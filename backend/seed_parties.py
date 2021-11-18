from connection import Transaction
import csv


def seed_parties() -> dict[str, int]:
    db = Transaction()
    with open("parteien.csv", newline="") as f:
        parties_csv = csv.reader(f, delimiter=",")
        data = list(parties_csv)
        # Parties
        parties = list({(p[1], p[0]) for p in data})
        parties_db = db.insert_into(
            "parteien",
            parties,
            ["name", "kurzbezeichnung"],
        )
        party_dict = {
            p[2] if p[2] is not None else p[1]: p[0] for p in parties_db
        }
        # Candidacies
        candidacies = [
            (
                party_dict[p[0]]if p[0] in party_dict else party_dict[p[1]],
                p[3],
                p[2],
            ) for p in data]
        db.insert_into(
            "parteikandidaturen",
            candidacies,
            ["partei", "wahl", "zusatzbezeichnung"],
        )
        db.commit()
        db.close()
        return party_dict
