from seed_candidates import seed_partei_kandidaturen_2017, seed_landeslisten_2021, seed_candidates_2021, \
    seed_candidates_2017, seed_Ergebnisse
from connection import Transaction
from seed_parties import seed_parties


def seed_db():
    db = Transaction()
    parties, parties_candidates_dict = seed_parties(db)

    wahlkreis_db = db.select_all("wahlkreise")  # (name,BNR):WKNR
    bundeslaender_db = db.select_all("bundeslaender")

    wahlkreis_dict = {
        (w[1], w[2]): w[0] for w in wahlkreis_db
    }
    bundeslaender_dict = {
        b[2]: b[0] for b in bundeslaender_db
    }

    parties_candidates_dict_2017 = seed_partei_kandidaturen_2017(db, parties)

    landeslisten2021_dict = seed_landeslisten_2021(db, parties_candidates_dict, bundeslaender_dict)

    print(parties_candidates_dict)

    direct_candidates_2021 = seed_candidates_2021(db, parties_candidates_dict, landeslisten2021_dict,
                                                  bundeslaender_dict)


#  direct_candidates_2017 = seed_candidates_2017(db, parties_candidates_dict)

#    seed_Ergebnisse(db, direct_candidates_2017, direct_candidates_2021, parties_candidates_dict, landeslisten2017_dict,
#               landeslisten2021_dict)

seed_db()
