import pandas as pd

from connection import Transaction

from seed_parties import seed_parties







def year_to_wahlid(year: int) -> int:
    return 1 if year == 2021 else 2


def seed_wahldaten(year: int, kerg_df=None, db: Transaction = None):
    if kerg_df is None:
        kerg_df = pd.read_csv("kerg1.csv", sep=",")

    if db is None:
        db = Transaction()

    only_wahlkreise = kerg_df[
        (kerg_df["GehoertZu"] != 99) & (~kerg_df["GehoertZu"].isna())
    ]

    tuples_year = only_wahlkreise[
        [
            f"Wahlberechtigte{year}",
            f"Waehlende{year}",
            "Nr",
            f"UngultigErst{year}",
            f"UngultigZwei{year}",
        ]
    ].assign(wahl=year_to_wahlid(year))

    return db.insert_into(
        "wahlkreiswahldaten",
        tuples_year.apply(tuple, axis=1),
        [
            "wahlberechtigte",
            "waehlende",
            "wahlkreis",
            "ungueltig_erste_stimme",
            "ungueltig_zweite_stimme",
            "wahl",
        ],
    )


def seed_landeslisten_2021(
    db: Transaction,
    party_name_to_candidacy_pk: dict[(str, int), int],
) -> dict[(int, int), int]:
    df_candidates = pd.read_csv("kandidaturen.csv", sep=";")
    wahl_2021_nr = 1

    # Landeslisten

    df_landeslisten = df_candidates[
        (df_candidates["Kennzeichen"] == "Landesliste")
    ][["Gruppenname", "Gebietsnummer"]].drop_duplicates()

    df_landeslisten["Gruppenname"] = df_landeslisten["Gruppenname"].apply(
        lambda party_name: party_name_to_candidacy_pk[
            (party_name, wahl_2021_nr)
        ]
    )

    landeslisten = df_landeslisten.apply(tuple, axis=1)

    print(landeslisten)

    landeslisten_db = db.insert_into(
        "landeslisten",
        landeslisten,
        ["partei", "bundesland"],
        Landesliste,
    )

    landeslisten_dict = {
        (
            landesliste.party_candidacy_pk,
            landesliste.bundesland_pk,
        ): landesliste.pk
        for landesliste in landeslisten_db
    }

    return landeslisten_dict


def seed_landeslisten_2017(db: Transaction, parties_candidates: dict[(str, int), int]) -> dict[
    (str, str), int]:
    df_candidates = pd.read_csv("kerg.csv", sep=";")
    # df_candidates.columns = [c.replace(" ", '\s') for c in df_candidates.columns]

    landes_listen_attr = ["partei",
                          "bundesland"]
    print(f"candidates_columns= {df_candidates.columns}")
    df_direct_candidates = \
        df_candidates[(df_candidates["VorpAnzahl"].notna())][df_candidates["UegGebietsnummer"] == 99][
            df_candidates["Stimme"] == 2]

    wahl_2017_nr = 2
    df_direct_candidates["partei"] = df_direct_candidates.apply(
        lambda row: parties_candidates.get((row.Gruppenname, wahl_2017_nr)), axis=1)

    df_direct_candidates = df_direct_candidates[["partei", "Gebietsnummer"]]

    df_direct_candidates.drop_duplicates()
    df_direct_candidates = df_direct_candidates[df_direct_candidates["partei"].notna()][
        df_direct_candidates["Gebietsnummer"].notna()]

    landes_listen_2017 = df_direct_candidates.apply(tuple, axis=1)

    db_landeslisten_2017 = db.insert_into("landeslisten", landes_listen_2017, ["partei", "bundesland"])

    landeslisten_2017_dict = {
        (l[1], l[2], 1): l[0] for l in db_landeslisten_2017
    }

    return landeslisten_2017_dict


def seed_candidates_2021(db: Transaction, parties: dict[str, int],
                         landeslisten_dict: dict[(int, int), int], bundeslaender) -> \
        dict[(str, str), int]:
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
        print(f"name = {name}")
        print(f"group = {group}")
        #       candidate = tuple(x for x in ([id + 1] + [row[i] for i in candidates_attr]))
        candidate_db = db.insert_into("kandidaten", name, candidates_attr)
        candidate_id = candidate_db[0][0]
        for row_index, row_serie in group.iterrows():
            row = row_serie.to_dict()
            print(f"row = {row}")
            print(f"type = {type(row)}")

            if row["Gebietsart"] == "Land":
                landesliste = landeslisten_dict.get(
                    (parties.get((row.get("Gruppenname"), 1)), row.get("Gebietsnummer")))
                listenplatz = row.get("Listenplatz")

                listen_candidate = (
                    candidate_id, landesliste, listenplatz)
                if landesliste != None:
                    db.insert_into("listenkandidaten", listen_candidate, listenkandidat_attr)

            else:
                direct_candidate = (candidate_id, row.get("Gebietsnummer"), parties.get((row.get("Gruppenname"), 1)))
                db.insert_into("direktkandidaten", direct_candidate, directcandidate_attr)


def seed_candidates_2017(db: Transaction, candidate_parties: dict[(str, int), int]):
    df_candidates = pd.read_csv("kerg.csv", sep=";")

    direct_candidates_attr = ["kandidat",
                              "wahlkreis",
                              "partei"]

    df_direct_candidates = \
        df_candidates[(df_candidates["VorpAnzahl"].notna())][df_candidates["Gebietsart"] == "Wahlkreis"][
            df_candidates["Stimme"] == 1]

    wahl_2017_nr = 2
    parteien = df_direct_candidates["Gruppenname"]
    print(f"parteien = {parteien}")
    df_direct_candidates["partei"] = df_direct_candidates.apply(
        lambda row: candidate_parties.get((row.Gruppenname, wahl_2017_nr)), axis=1)

    df_direct_candidates = df_direct_candidates[["Gebietsnummer", "partei"]]

    df_direct_candidates.drop_duplicates()
    direct_candidates_2017 = df_direct_candidates.apply(tuple, axis=1)

    db_direct_candidates_2017 = db.insert_into("direktkandidaten", direct_candidates_2017, ["wahlkreis", "partei"])

    direct_candidates_2017_dict = {
        (d[2], d[3]): d[0] for d in db_direct_candidates_2017
    }

    return direct_candidates_2017_dict


def seed_Ergebnisse(db: Transaction, direct_candidates_2017: dict[(int, int), int],
                    direct_candidates_2021: dict[(int, int), int], parties_candidacy: dict[(str, int): int],
                    landeslisten_2017: dict[(int, int):int], landeslisten_2021: dict[(int, int):int]):
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
        lambda row: landeslisten_2021.get((parties_candidacy.get(row.Gruppenname, 2), row.UegGebietsnummer)), axis=1)

    df_zweitstimmeErgebnis2021 = df_zweitstimmeErgebnis2021[["landesliste", "Anzahl"]].drop_duplicates()

    zweitstimmeErgebnis2021 = df_zweitstimmeErgebnis2021.apply(tuple, axis=1)

    db.insert_into("zweitstimmeErgebnisse", zweitstimmeErgebnis2021, ["landesliste", "anzahl_stimmen"])

    df_zweitstimmeErgebnis2017 = df_zweitstimmeErgebnis[df_zweitstimmeErgebnis["VorpAnzahl"].notna()]
    df_zweitstimmeErgebnis2017 = df_zweitstimmeErgebnis2017[
        ["Gebietsnummer", "UegGebietsnummer", "Gruppenname", "VorpAnzahl"]]

    df_zweitstimmeErgebnis2017["landesliste"] = df_zweitstimmeErgebnis2017.apply(
        lambda row: landeslisten_2017.get((parties_candidacy.get(row.Gruppenname, 1), row.UegGebietsnummer)), axis=1)

    df_zweitstimmeErgebnis2017 = df_zweitstimmeErgebnis2017[
        ["landesliste", "VorpAnzahl", "Gebietsnummer"]].drop_duplicates()

    zweitstimmeErgebnis2017 = df_zweitstimmeErgebnis2017.apply(tuple, axis=1)

    db.insert_into("zweitstimmeErgebnisse", zweitstimmeErgebnis2017, ["landesliste", "anzahl_stimmen", "wahlkreis"])


'''
db = Transaction()

parties, parties_candidates_dict = seed_parties()
# parties_candidates_dict, parties = {}, {}
wahlkreis_db = db.select_all("wahlkreise")  # (name,BNR):WKNR
bundeslaender_db = db.select_all("bundeslaender")

wahlkreis_dict = {
    (w[1], w[2]): w[0] for w in wahlkreis_db
}

# seed_wahldaten(wahlkreis_dict)

# name:PNR

bundeslaender_dict = {
    b[1]: b[0] for b in bundeslaender_db
}
parties_candidates_dict_2017 = seed_partei_kandidaturen_2017(parties)
landeslisten2017_dict = seed_landeslisten_2017(parties_candidates_dict)

landeslisten2021_dict = seed_landeslisten_2021(parties_candidates_dict, bundeslaender_dict)

direct_candidates_2021 = seed_candidates_2021(parties_candidates_dict, landeslisten2021_dict)

direct_candidates_2017 = seed_candidates_2017(parties_candidates_dict)

seed_Ergebnisse(direct_candidates_2017, direct_candidates_2021, parties_candidates_dict, landeslisten2017_dict,
                landeslisten2021_dict)
'''
