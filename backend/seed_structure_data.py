from dataclasses import dataclass

import pandas as pd

from connection import Transaction

def seed_unemployment(
        db: Transaction,
):
    df_structure = pd.read_csv("btw21_strukturdaten.csv", sep=";")

    only_wahlkreise = df_structure[
        (df_structure["Wahlkreis-Nr."] <= 299)
        ]
    only_wahlkreise["Arbeitslosenquote"] =only_wahlkreise["Arbeitslosenquote"].apply(lambda x: float(x.split()[0].replace(',', '.'))).astype(float)
    wkr_raw = ["wahlkreis", "arbeitslosenquote"]

    df_joblessness = only_wahlkreise[["Wahlkreis-Nr.", "Arbeitslosenquote"]].apply(tuple, axis=1)

    return db.insert_into("arbeitslosigkeit", df_joblessness, wkr_raw)

