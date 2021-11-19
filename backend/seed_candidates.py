import pandas as pd

from connection import Transaction
import csv


def seed_landeslisten(parties: dict[str, int], bundeslaender: dict[str, int]) -> dict[(str, str), int]:
    db = Transaction()
    df_candidates = pd.read_csv("kandidaturen.csv", sep=";")

    print(df_candidates.columns)

    # Landeslisten

    df_landeslisten = df_candidates[(df_candidates["Kennzeichen"] == "Landesliste")][
        ["Gruppenname", "Gebietsnummer"]].drop_duplicates()
    df_landeslisten["Gruppenname"] = df_landeslisten["Gruppenname"].apply(
        lambda party_name: parties.get(party_name, 2))
    df_landeslisten["Gebietsnummer"] = df_landeslisten["Gebietsnummer"].apply(
        lambda bund_name: bundeslaender.get(bund_name, 3))

    landeslisten = df_landeslisten.apply(tuple, axis=1)

    print(landeslisten)

    landeslisten_db = db.insert_into(
        "landeslisten",
        landeslisten,
        [
            "partei",
            "bundesland"
        ],
    )

    landeslisten_dict = {
        (landeslist[1], landeslist[2]): landeslist[0] for landeslist in landeslisten_db
    }

    return landeslisten_dict


def seed_candidates(parties: dict[str, int], bundeslaender: dict[str, int], landeslisten_dict: dict[(str, str), int]) -> \
        dict[(str, str), int]:
    db = Transaction()
    df_candidates = pd.read_csv("kandidaturen.csv", sep=";")

    print(df_candidates.columns)

    # Candidates
    candidates_attr = [
        "Nachname",
        "Vornamen",
        "Titel",
        "Namenszusatz",
        "Beruf",
        "Geburtsjahr",
        "Geschlecht"]

    directcandidate_attr = ["kandidat", "wahlkreis", "partei"]
    listenkandidat_attr = ["kandidat", "landesliste", "listennummer"]

    candidates_groups = df_candidates.groupby(candidates_attr)
    for id, (name, group) in enumerate(candidates_groups):
        for row_index, row in group.iterrows():
            candidate = tuple(x for x in ([id] + [row[i] for i in candidates_attr]))
            db.insert_into("kandidaten", candidate, ["id"] + candidates_attr)
            if row["Kennzeichen"] == "Landesliste":
                listen_candidate = (
                    id, landeslisten_dict.get((parties.get(row["Gruppenname"], 2), 3)),
                    row["VerknListenplatz"])
                db.insert_into("listenkandidaten", listen_candidate, listenkandidat_attr)

            else:
                direct_candidate = (id, row["Gebietsnummer"], parties.get(row["Gruppenname"], 2))
                db.insert_into("direktkandidaten", direct_candidate, directcandidate_attr)

    db.commit()
    db.close()


def seed_wahldaten(wahlkreise: dict[(str, int):int]):
    db = Transaction()
    df = pd.read_csv('kerg1.csv',
                     sep=";")
    df = df[(df["gehoertZu"] != 99)]

    df["wahlkreis"] = df.apply(
        lambda row: wahlkreise.get((row.Gebiet, row.gehoertZu)), axis=1)

    wahldaten_attr = [
        "wahlberechtigte",
        "waehlende",
        "wahlkreis",
        "wahl",
        "ungueltig_erste_stimme",
        "ungueltig_zweite_stimme",
    ]

    df_2021 = df[["Wahlberechtigte2021", "Waehlende2021", "wahlkreis", "UngultigErst2021", "UngultigZwei2021"]]
    df_2021["wahl"] = 2
    df_2017 = df[["Wahlberechtigte2017", "Waehlende2017", "wahlkreis", "UngultigErst2017", "UngultigZwei2017"]]
    df_2017["wahl"] = 1

    tuples_2021 = df_2021.apply(tuple, axis=1)
    tuples_2017 = df_2017.apply(tuple, axis=1)

    db.insert_into("wahlkreiswahldaten", tuples_2021, wahldaten_attr)
    db.insert_into("wahlkreiswahldaten", tuples_2017, wahldaten_attr)

    db.commit()
    db.close()


def seed_parteiKandidaturen():
    pass


def seed_erststimmenErgebnisse(direct_candidates: dict[(str, str, str)]):
    db = Transaction()

    df_results = pd.read_csv('kerg.csv', sep=";")
    df_results["Anzahl"] = df_results["Anzahl"].fillna(0.0).astype(int)

    df_results["VorpAnzahl"] = df_results["VorpAnzahl"].fillna(0.0).astype(int)

    df_results_wahlkreise = df_results[
        ((df_results["Gebietsart"] == "Wahlkreis") & (df_results["Gruppenart"] == "Partei"))]

    df_results_erststimmeErgebnis = df_results_wahlkreise[(df_results_wahlkreise["Stimme"] == 1)]

    df_results_erststimmeErgebnis2021 = df_results_erststimmeErgebnis[["Gebietsnummer", "Gruppenname", "Anzahl"]]


seed_candidates({}, {})
