import pandas as pd

from connection import Transaction
from data_classes import Direktcandidate, Landesliste


def year_to_wahlid(year: int) -> int:
    return 1 if year == 2021 else 2


def seed_wahldaten(year: int, kerg_df=None, db: Transaction = None):
    if kerg_df is None:
        kerg_df = pd.read_csv("kerg1.csv", sep=",")

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


def seed_landeslisten_2017(
    db: Transaction, parties_candidates: dict[(str, int), int]
) -> dict[(str, str), int]:
    df_kerg = pd.read_csv("kerg.csv", sep=";")

    df_lists = df_kerg.dropna(subset=["VorpAnzahl"])
    df_lists = df_lists[
        (df_lists["UegGebietsnummer"] == 99)
        & (df_lists["Stimme"] == 2)
        & (df_lists["Gruppenart"] == "Partei")
    ]

    wahl_2017_nr = 2
    df_lists["partei"] = df_lists.apply(
        lambda row: parties_candidates[(row.Gruppenname, wahl_2017_nr)],
        axis=1,
    )

    df_lists = df_lists[["partei", "Gebietsnummer"]].dropna()

    db_landeslisten_2017 = db.insert_into(
        "landeslisten",
        df_lists.apply(tuple, axis=1),
        ["partei", "bundesland"],
        Landesliste,
    )

    landeslisten_dict = {
        (
            landesliste.party_candidacy_pk,
            landesliste.bundesland_pk,
        ): landesliste.pk
        for landesliste in db_landeslisten_2017
    }

    return landeslisten_dict


def seed_candidates_2021(
    db: Transaction,
    parties: dict[str, int],
    landeslisten_dict: dict[(int, int), int],
) -> dict[(str, str), int]:
    df_candidates = pd.read_csv("kandidaturen.csv", sep=";").fillna("")

    # Candidates
    candidates_attr = [
        "Nachname",
        "Vornamen",
        "Titel",
        "Namenszusatz",
        "Beruf",
        "Geburtsjahr",
        "Geschlecht",
    ]

    wahlkreis_party_candidacy_to_direct_candidacy = {}

    independent_candidates = {}

    candidates_groups = df_candidates.groupby(candidates_attr)
    for name, group in candidates_groups:
        candidate_db = db.insert_into("kandidaten", name, candidates_attr)
        candidate_id = candidate_db[0][0]

        for _, row_series in group.iterrows():
            row = row_series.to_dict()
            party_candidacy = ""

            if row["Kennzeichen"] == "anderer Kreiswahlvorschlag":

                key = None
                short_name = ""

                if row["Gruppenname"].startswith("EB:"):
                    key = row["GruppennameLang"]
                    short_name = f"""EB: {row["Nachname"]}, {row["Vornamen"]}"""
                else:
                    key = row["Gruppenname"]
                    short_name = row["Gruppenname"]

                party = db.insert_into(
                    "parteien",
                    (
                        row["GruppennameLang"],
                        short_name,
                        False,
                    ),
                    ["name", "kurzbezeichnung", "is_echte_partei"],
                )[0][0]

                party_candidacy = db.insert_into(
                    "parteiKandidaturen",
                    (party, 1),
                    ["partei", "wahl"],
                )[0][0]

                independent_candidates[
                    (key, row["Gebietsnummer"])
                ] = party_candidacy

            else:
                party_candidacy = parties[(row["Gruppenname"], 1)]

            region_pk = row["Gebietsnummer"]

            if row["Gebietsart"] == "Land":
                landesliste = landeslisten_dict[(party_candidacy, region_pk)]
                listenplatz = row["Listenplatz"]

                db.insert_into(
                    "listenkandidaten",
                    (candidate_id, landesliste, listenplatz),
                    ["kandidat", "landesliste", "listennummer"],
                )

            else:
                dk = db.insert_into(
                    "direktkandidaten",
                    (candidate_id, region_pk, party_candidacy),
                    ["kandidat", "wahlkreis", "partei"],
                    Direktcandidate,
                )[0]
                wahlkreis_party_candidacy_to_direct_candidacy[
                    (dk.wahlkreis_pk, dk.party_candidacy_pk)
                ] = dk.pk
    return (
        wahlkreis_party_candidacy_to_direct_candidacy,
        independent_candidates,
    )


def seed_candidates_2017(
    db: Transaction, candidate_parties: dict[(str, int), int]
):
    df_candidates = pd.read_csv("kerg.csv", sep=";")

    df_direct_candidates = df_candidates.dropna(subset=["VorpAnzahl"])
    df_direct_candidates = df_direct_candidates[
        df_direct_candidates["Gebietsart"] == "Wahlkreis"
    ]
    df_direct_candidates = df_direct_candidates[
        df_direct_candidates["Stimme"] == 1
    ]
    df_direct_candidates = df_direct_candidates[
        df_direct_candidates["Gruppenart"] == "Partei"
    ]
    wahl_2017_nr = 2

    df_direct_candidates["partei"] = df_direct_candidates.apply(
        lambda row: candidate_parties.get((row.Gruppenname, wahl_2017_nr)),
        axis=1,
    )

    df_direct_candidates = df_direct_candidates[["Gebietsnummer", "partei"]]

    df_direct_candidates.drop_duplicates()
    direct_candidates_2017 = df_direct_candidates.apply(tuple, axis=1)

    db_direct_candidates_2017 = db.insert_into(
        "direktkandidaten", direct_candidates_2017, ["wahlkreis", "partei"]
    )

    direct_candidates_2017_dict = {
        (d[2], d[3]): d[0] for d in db_direct_candidates_2017
    }

    return direct_candidates_2017_dict


def seed_year_first_results(
    db: Transaction,
    kerg_firstvotes,
    direct_candidates,
    independent_candidates,
    year,
    parties_candidacy,
):
    wahlid = year_to_wahlid(year)
    selector = "Anzahl" if year == 2021 else "VorpAnzahl"

    # df_results["Gruppenart"] == "Einzelbewerber/Wählergruppe"

    first_vote_results = kerg_firstvotes.dropna(subset=[selector])

    def candidate_pk(row):
        party_key = None
        if row["Gruppenart"] == "Einzelbewerber/Wählergruppe":
            party_key = independent_candidates[
                (row.Gruppenname, row.Gebietsnummer)
            ]
        else:
            party_key = parties_candidacy[(row.Gruppenname, wahlid)]

        return direct_candidates[(row.Gebietsnummer, party_key)]

    pd.options.mode.chained_assignment = None  # false positive in this file
    first_vote_results["direct_candidate_pk"] = first_vote_results.apply(
        candidate_pk,
        axis=1,
    )

    db.insert_into(
        "erststimmeErgebnisse",
        first_vote_results[["direct_candidate_pk", selector]].apply(
            tuple, axis=1
        ),
        ["direktkandidat", "anzahl_stimmen"],
    )


def seed_second_year_results(
    db: Transaction,
    kerg_second,
    lists,
    year,
    parties_candidacy,
):

    wahlid = year_to_wahlid(year)
    selector = "Anzahl" if year == 2021 else "VorpAnzahl"

    df_second_votes_year = kerg_second.dropna(subset=[selector])

    df_second_votes_year = df_second_votes_year[
        ["Gebietsnummer", "UegGebietsnummer", "Gruppenname", selector]
    ]

    df_second_votes_year["landesliste"] = df_second_votes_year.apply(
        lambda row: lists[
            (
                parties_candidacy[(row.Gruppenname, wahlid)],
                row.UegGebietsnummer,
            )
        ],
        axis=1,
    )

    db.insert_into(
        "zweitstimmeErgebnisse",
        df_second_votes_year[["landesliste", selector, "Gebietsnummer"]].apply(
            tuple, axis=1
        ),
        ["landesliste", "anzahl_stimmen", "wahlkreis"],
    )


def seed_ergebnisse(
    db: Transaction,
    direct_candidates_2017: dict[(int, int), int],
    direct_candidates_2021: dict[(int, int), int],
    independent_candidates: dict[str, int],
    parties_candidacy: dict[(str, int):int],
    landeslisten_2017: dict[(int, int):int],
    landeslisten_2021: dict[(int, int):int],
):
    df_results = pd.read_csv("kerg.csv", sep=";")

    df_results_wahlkreise = df_results[
        (
            (df_results["Gebietsart"] == "Wahlkreis")
            & (
                (df_results["Gruppenart"] == "Partei")
                | (df_results["Gruppenart"] == "Einzelbewerber/Wählergruppe")
            )
        )
    ]

    df_results_firstvotes = df_results_wahlkreise[
        (df_results_wahlkreise["Stimme"] == 1)
    ]
    seed_year_first_results(
        db,
        df_results_firstvotes,
        direct_candidates_2021,
        independent_candidates,
        2021,
        parties_candidacy,
    )

    seed_year_first_results(
        db,
        df_results_firstvotes,
        direct_candidates_2017,
        independent_candidates,
        2017,
        parties_candidacy,
    )

    df_zweitstimmeErgebnis = df_results_wahlkreise[
        (df_results_wahlkreise["Stimme"] == 2)
    ]

    seed_second_year_results(
        db,
        df_zweitstimmeErgebnis,
        landeslisten_2021,
        2021,
        parties_candidacy,
    )

    seed_second_year_results(
        db,
        df_zweitstimmeErgebnis,
        landeslisten_2017,
        2017,
        parties_candidacy,
    )


def seed_minority_parties(db: Transaction):
    db.run_query(
        """INSERT INTO minderheitsparteien (
    SELECT id FROM parteien WHERE kurzbezeichnung = 'SSW');
    """,
        fetch=False,
    )
