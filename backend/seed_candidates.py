import pandas as pd

from connection import Transaction


def seed_partei_kandidaturen(parties: dict[str, int]) -> dict[(str, int), int]:
    db = Transaction()
    df_candidates = pd.read_csv("kerg.csv", sep=";")

    df_candidates = df_candidates[(df_candidates["Gruppenart"] == "Partei")]

    df_parties_2021 = df_candidates[df_candidates["Anzahl"].notna()]["Gruppenname"]

    df_parties_2021["partei"] = df_parties_2021.apply(lambda row: parties.get(row.Gruppenname, 1))
    df_parties_2021["wahl"] = 2
    df_parties_2021 = df_parties_2021[["partei", "wahl"]]
    df_parties_2021.drop_duplicates()

    parties_2021_tuples = df_parties_2021.apply(tuple, axis=1)
    db_parties_2021 = db.insert_into("parteiKandidaturen", parties_2021_tuples, ["partei", "wahl"])

    df_parties_2017 = df_candidates[df_candidates["VorpAnzahl"].notna()]["Gruppenname"]

    df_parties_2017["partei"] = df_parties_2017.apply(lambda row: parties.get(row.Gruppenname, 1))
    df_parties_2017["wahl"] = 1
    df_parties_2017 = df_parties_2017[["partei", "wahl"]]
    df_parties_2017.drop_duplicates()
    parties_2017_tuples = df_parties_2017.apply(tuple, axis=1)
    db_parties_2017 = db.insert_into("parteiKandidaturen", parties_2017_tuples, ["partei", "wahl"])

    db_parties_candidates = db_parties_2017 + db_parties_2021
    party_candidates_dict = {
        (p[1], p[2]): p[0] for p in db_parties_candidates
    }

    db.commit()
    db.close()

    return party_candidates_dict


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


def seed_landeslisten_2021(parties_candidates: dict[(str, int), int], bundeslaender: dict[str, int]) -> dict[
    (str, str), int]:
    db = Transaction()
    df_candidates = pd.read_csv("kandidaturen.csv", sep=";")
    wahl_2021_nr = 2

    print(df_candidates.columns)

    # Landeslisten

    df_landeslisten = df_candidates[(df_candidates["Kennzeichen"] == "Landesliste")][
        ["Gruppenname", "Gebietsnummer"]].drop_duplicates()
    df_landeslisten["Gruppenname"] = df_landeslisten["Gruppenname"].apply(
        lambda party_name: parties_candidates.get((party_name, wahl_2021_nr), 2))
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


def seed_landeslisten_2017(parties_candidates: dict[(str, int), int], bundeslaender: dict[str, int]) -> dict[
    (str, str), int]:
    db = Transaction()
    df_candidates = pd.read_csv("kerg.csv", sep=";")

    landes_listen_attr = ["partei",
                          "bundesland"]

    df_direct_candidates = df_candidates[(df_candidates["VorpAnzahl"].notna)][df_candidates["UegGebietsnummer"] == 99][
        "Stimme" == 2]

    wahl_2017_nr = 1
    df_direct_candidates["partei"] = df_direct_candidates.apply(
        lambda row: parties_candidates.get((row.Gruppenname, wahl_2017_nr), 1), axis=1)

    df_direct_candidates = df_direct_candidates[["partei", "Gebietsnummer"]]

    df_direct_candidates.drop_duplicates()

    landes_listen_2017 = df_direct_candidates.apply(tuple, axis=1)

    db_landeslisten_2017 = db.insert_into("landeslisten", landes_listen_2017, ["partei", "bundesland"])

    landeslisten_2017_dict = {
        (l[1], l[2], 1): l[0] for l in db_landeslisten_2017
    }

    db.commit()
    db.close()

    return landeslisten_2017_dict


def seed_candidates_2021(parties: dict[str, int], bundeslaender: dict[str, int],
                         landeslisten_dict: dict[(str, str), int]) -> \
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


def seed_candidates_2017(candidate_parties: dict[(str, int), int], bundeslaender: dict[str, int],
                         landeslisten_dict: dict[(str, str), int]):
    db = Transaction()
    df_candidates = pd.read_csv("kerg.csv", sep=";")

    direct_candidates_attr = ["kandidat",
                              "wahlkreis",
                              "partei"]

    df_direct_candidates = \
        df_candidates[(df_candidates["VorpAnzahl"].notna)][df_candidates["Gebietsart"] == "Wahlkreis"]["Stimme" == 1]

    wahl_2017_nr = 1
    df_direct_candidates["partei"] = df_direct_candidates.apply(
        lambda row: candidate_parties.get((row.Gruppenname, wahl_2017_nr), 1), axis=1)

    df_direct_candidates = df_direct_candidates[["Gebietsnummer", "partei"]]

    df_direct_candidates.drop_duplicates()
    direct_candidates_2017 = df_direct_candidates.apply(tuple, axis=1)

    db_direct_candidates_2017 = db.insert_into("direktkandidaten", direct_candidates_2017, ["wahlkreis", "partei"])

    direct_candidates_2017_dict = {
        (d[2], d[3]): d[0] for d in db_direct_candidates_2017
    }

    db.commit()
    db.close()

    return direct_candidates_2017_dict


def seed_erststimmenErgebnisse(direct_candidates_2017: dict[(int, int), int],
                               direct_candidates_2021: dict[(int, int), int], parties_candidacy: dict[(str, int): int],
                               landeslisten: dict[(int, int):int]):
    db = Transaction()

    df_results = pd.read_csv('kerg.csv', sep=";")

    df_results_wahlkreise = df_results[
        ((df_results["Gebietsart"] == "Wahlkreis") & (df_results["Gruppenart"] == "Partei"))]

    df_erststimmeErgebnis = df_results_wahlkreise[(df_results_wahlkreise["Stimme"] == 1)]

    df_erststimmeErgebnis2021 = df_erststimmeErgebnis[df_results["Anzahl"].notna()]

    df_erststimmeErgebnis2021 = df_erststimmeErgebnis2021[["Gebietsnummer", "Gruppenname", "Anzahl"]]

    df_erststimmeErgebnis2021["direktkandidat"] = df_erststimmeErgebnis2021.apply(
        lambda row: direct_candidates_2021.get((row.Gebietsnummer, parties_candidacy.get(row.Gruppenname, 2))), axis=1)

    df_erststimmeErgebnis2021 = df_erststimmeErgebnis2021[["direktkandidat", "Anzahl"]]

    df_erststimmeErgebnis2021_tuples = df_erststimmeErgebnis2021.apply(tuple, axis=1)

    db.insert_into("erststimmeErgebnisse", df_erststimmeErgebnis2021_tuples, ["direktkandidat", "anzahl_stimmen"])

    df_erststimmeErgebnis2017 = df_erststimmeErgebnis[df_results["VorpAnzahl"].notna()]

    df_erststimmeErgebnis2017 = df_erststimmeErgebnis2017[["Gebietsnummer", "Gruppenname", "VorpAnzahl"]]

    df_erststimmeErgebnis2017["direktkandidat"] = df_erststimmeErgebnis2017.apply(
        lambda row: direct_candidates_2017.get((row.Gebietsnummer, parties_candidacy.get(row.Gruppenname, 1))), axis=1)

    df_erststimmeErgebnis2017_tuples = df_erststimmeErgebnis2017.apply(tuple, axis=1)

    db.insert_into("erststimmeErgebnisse", df_erststimmeErgebnis2017_tuples, ["direktkandidat", "anzahl_stimmen"])

    df_zweitstimmeErgebnis = df_results_wahlkreise[(df_results_wahlkreise["Stimme"] == 2)]

    df_zweitstimmeErgebnis2021 = df_zweitstimmeErgebnis[df_zweitstimmeErgebnis["Anzahl"].notna()]
    df_zweitstimmeErgebnis2021 = df_zweitstimmeErgebnis2021[
        ["Gebietsnummer", "UegGebietsnummer", "Gruppenname", "Anzahl"]]

    df_zweitstimmeErgebnis2021["landesliste"] = df_zweitstimmeErgebnis2021.apply(
        lambda row: landeslisten.get((parties_candidacy.get(row.Gruppenname, 2), row.UegGebietsnummer)), axis=1)

    df_zweitstimmeErgebnis2021 = df_zweitstimmeErgebnis2021[["landesliste", "Anzahl"]].drop_duplicates()

    zweitstimmeErgebnis2021 = df_zweitstimmeErgebnis2021.apply(tuple, axis=1)

    db.insert_into("zweitstimmeErgebnisse", zweitstimmeErgebnis2021, ["landesliste", "anzahl_stimmen"])

    df_zweitstimmeErgebnis2017 = df_zweitstimmeErgebnis[df_zweitstimmeErgebnis["VorpAnzahl"].notna()]
    df_zweitstimmeErgebnis2017 = df_zweitstimmeErgebnis2017[
        ["Gebietsnummer", "UegGebietsnummer", "Gruppenname", "VorpAnzahl"]]

    df_zweitstimmeErgebnis2017["landesliste"] = df_zweitstimmeErgebnis2017.apply(
        lambda row: landeslisten.get((parties_candidacy.get(row.Gruppenname, 1), row.UegGebietsnummer)), axis=1)

    df_zweitstimmeErgebnis2017 = df_zweitstimmeErgebnis2017[["landesliste", "VorpAnzahl"]].drop_duplicates()

    zweitstimmeErgebnis2017 = df_zweitstimmeErgebnis2017.apply(tuple, axis=1)

    db.insert_into("zweitstimmeErgebnisse", zweitstimmeErgebnis2017, ["landesliste", "anzahl_stimmen"])
