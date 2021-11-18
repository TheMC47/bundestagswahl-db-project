import pandas as pd

from connection import Transaction

pd.options.mode.chained_assignment = None  # default='warn'


def seed_candidates():
    db = Transaction()
    df_candidates = pd.read_csv("kandidaturen.csv")

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
