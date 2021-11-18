import pandas as pd

from connection import Transaction


def seed_candidates() -> dict[(str, str), int]:
    db = Transaction()
    df_candidates = pd.read_csv("kandidaturen.csv", sep=";")

    candidates = df_candidates[
        [
            "Nachname",
            "Vornamen",
            "Titel",
            "Namenszusatz",
            "Beruf",
            "Geburtsjahr",
            "Geschlecht",
        ]
    ]

    candidates["Titel"] = candidates["Titel"].fillna("")

    candidates["Namenszusatz"] = candidates["Namenszusatz"].fillna("")

    candidates["Geschlecht"] = candidates["Geschlecht"].apply(lambda x: x[0])

    candidates_tuples = candidates.apply(tuple, axis=1)

    db.insert_into(
        "kandidaten",
        candidates_tuples,
        [
            "name",
            "vorname",
            "titel",
            "namenzusatz",
            "beruf",
            "geburtsjahr",
            "geschlecht",
        ],
    )

    db.commit()
    db.close()

'''
def seed_direct_candidates(candidates: dict[(str, str), int], parties: dict[str:int]):
    db = Transaction()

    df_candidates = pd.read_csv("kandidaturen.csv")

    df_direct_candidates = df_candidates[(df_candidates["KandidaturWahlkreisNr"].notnull())][["Nachname",
                                                                                              "Vornamen",
                                                                                              "KandidaturWahlkreisNr",
                                                                                              "WahlkreisKandidaturGruppenname"]]

    df_direct_candidates["kandidat"] = df_direct_candidates.apply(
        lambda row: candidates.get((row.Nachname, row.Vornamen)), axis=1)

    df_direct_candidates["WahlkreisKandidaturGruppenname"] = df_direct_candidates[
        "WahlkreisKandidaturGruppenname"].fillna("")

    df_direct_candidates["Partei"] = df_direct_candidates.apply(
        lambda row: parties.get(row.WahlkreisKandidaturGruppenname), axis=1)

    df_direct_candidates["kandidat"] = df_direct_candidates.apply(
        lambda row: candidates.get((row.Nachname, row.Vornamen)), axis=1)

    df_direct_candidates["Wahl"] = 2

    df_direct_candidates = df_direct_candidates[
        "kandidat", "KandidaturWahlkreisNr", "Wahl", "WahlkreisKandidaturGruppenname"]

    candidates_tuples = df_direct_candidates.apply(tuple, axis=1)

    db.insert_into(
        "direktkandidaten",
        candidates_tuples,
        [
            "kandidat",
            "wahlkreis",
            "wahl",
            "partei",
        ],
    )

    db.commit()
    db.close()

'''


seed_candidates()
