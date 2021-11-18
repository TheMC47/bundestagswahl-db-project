import csv
import pandas as pd
import numpy as np
import pandas as pd
from connection import Transaction
#pd.options.mode.chained_assignment = None  # default='warn'


def seed_candidates():
    db = Transaction()
    df_candidates = pd.read_csv('kandidaturen.csv')

    candidates = df_candidates[["Nachname", "Vornamen", "Titel", "Beruf", "Geburtsjahr", "Geschlecht"]]

    candidates["Geschlecht"] = candidates["Geschlecht"].str[0]

    candidates_tuples = candidates.apply(tuple, axis = 1)

    candidates_db = db.insert_into(
        "kandidaten",
        candidates_tuples,
        ["name", "vorname", "titel", "namenzusatz", "beruf","geburtsjahr", "geschlecht" ],
    )

    db.commit()
    db.close()




def seed_elections_results():
    db = Transaction()

    df_results = pd.read_csv('kerg.csv')
    df_results["Anzahl"] =  df_results["Anzahl"].fillna(0.0).astype(int)
    df_results["VorpAnzahl"] =  df_results["VorpAnzahl"].fillna(0.0).astype(int)







    df_results_wahlkreise = df_results [( (df_results["Gebietsart"] == "Wahlkreis" )& (df_results["Gruppenart"] == "Partei"))] 


    df_results_erststimmeErgebnis = df_results_wahlkreise[(df_results_wahlkreise["Stimme"] == 1)] 


    df_results_erststimmeErgebnis2021 = df_erststimmeErgebnis [["Gebietsnummer", "Gruppenname", "Anzahl" ]]
    df_erststimmeErgebnis2021["wahl"] = 2021
    erststimmeErgebnis2021 = df_erststimmeErgebnis2021.apply(tuple, axis = 1)


    results_db = db.insert_into(
        "erststimmeErgebnisse",
        erststimmeErgebnisse,
        ["direktkandidat", "wahlkreis", "wahl", "anzahl_stimmen" ],
    )

        df_erststimmeErgebnis2017 = df_erststimmeErgebnis [["Gebietsnummer", "Gruppenname", "VorpAnzahl" ]]
    df_erststimmeErgebnis2021["wahl"] = 2017
    erststimmeErgebnis2017 = df_erststimmeErgebnis2017 .apply(tuple, axis = 1)
    print(f"erststimmeErgebnis2017 = {erststimmeErgebnis2017}")


    df_zweitstimmeErgebnis = df_wahlkreise[(df_wahlkreise["Stimme"] == 2)] 


    df_zweitstimmeErgebnis2021 = df_zweitstimmeErgebnis  [["Gebietsnummer", "Gruppenname", "Anzahl" ]]
    df_zweitstimmeErgebnis2021["wahl"] = 2021
    zweitstimmeErgebnis2021 = df_zweitstimmeErgebnis2021.apply(tuple, axis = 1)
    print (f"zweitstimmeErgebnis2021= {zweitstimmeErgebnis2021}")


    df_zweitstimmeErgebnis2017 = df_zweitstimmeErgebnis  [["Gebietsnummer", "Gruppenname", "VorpAnzahl" ]]
    df_zweitstimmeErgebnis2017["wahl"] = 2017
    zweitstimmeErgebnis2017 = df_zweitstimmeErgebnis2017.apply(tuple, axis = 1)
    print (f"zweitstimmeErgebnis2017= {zweitstimmeErgebnis2017}")


    return erststimmeErgebnis2021, erststimmeErgebnis2017, zweitstimmeErgebnis2021, zweitstimmeErgebnis2017
