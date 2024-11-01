CREATE MATERIALIZED VIEW stimmzettel_zweitstimme(bundesland, liste_id, partei, partei_abk, partei_name, rank) AS
(
WITH parteien_bereits_teilgenommen (bundesland, liste_id, partei, partei_abk, partei_name, rank) AS (
    SELECT l.bundesland,
           l.id,
           p.id,
           p.kurzbezeichnung,
           p.name,
           RANK() OVER (PARTITION BY l.bundesland ORDER BY zl.zweitstimmen DESC)
    FROM landeslisten l
             JOIN parteiKandidaturen pk1 ON l.partei = pk1.id
             JOIN parteiKandidaturen pk2 ON pk2.partei = pk1.partei
             JOIN zweitstimmen_pro_partei_pro_land zl
                  ON pk2.id = zl.partei AND pk2.wahl = zl.wahl AND zl.land = l.bundesland
             JOIN parteien p ON pk1.partei = p.id
    WHERE pk1.wahl = 1
      AND pk2.wahl = 2
),
     max_rank (bundesland, max_rank) AS (
         SELECT bundesland, MAX(rank)
         FROM parteien_bereits_teilgenommen
         GROUP BY bundesland
     ),
     parteien_erstmal (bundesland, liste_id, partei, partei_abk, partei_name, rank) AS (
         SELECT l.bundesland,
                l.id,
                p.id,
                p.kurzbezeichnung,
                p.name,
                mr.max_rank + RANK() OVER (PARTITION BY l.bundesland ORDER BY p.name)
         FROM landeslisten l
                  JOIN parteiKandidaturen pk1 ON l.partei = pk1.id
                  JOIN parteien p ON pk1.partei = p.id
                  JOIN max_rank mr ON l.bundesland = mr.bundesland
         where pk1.wahl = 1
           AND NOT EXISTS(
                 SELECT pk2.*
                 FROM parteiKandidaturen pk2
                 WHERE pk2.wahl = 2
                   AND pk2.partei = pk1.partei
             )
     )

SELECT *
FROM parteien_bereits_teilgenommen
UNION ALL
SELECT *
FROM parteien_erstmal
    );

GRANT SELECT ON stimmzettel_zweitstimme TO web_anon;

CREATE VIEW reihenfolge_parteien_bundesland(bundesland, partei, rank) AS
SELECT bundesland, partei, rank
FROM stimmzettel_zweitstimme
ORDER BY rank;

CREATE VIEW reihenfolge_parteien_wahlkreis(wahlkreis, partei, rank) AS
SELECT w.id, rb.partei, rb.rank
FROM reihenfolge_parteien_bundesland rb
     JOIN bundeslaender b ON b.id = rb.bundesland
     JOIN wahlkreise w ON w.bundesland = b.id
ORDER BY rank;

-- Q1
CREATE VIEW sitze_pro_partei_full(kurzbezeichnung, sitze, wahl) AS
SELECT p.kurzbezeichnung, sp.sitze, sp.wahl
FROM sitze_pro_partei sp
         JOIN parteikandidaturen pk ON pk.id = sp.partei
         JOIN parteien p ON p.id = pk.partei;

GRANT SELECT ON sitze_pro_partei_full TO web_anon;

-- Q2

CREATE FUNCTION null_or_space(TEXT) RETURNS TEXT AS
$$
SELECT (
           CASE
               WHEN $1 IS NOT NULL
                   THEN $1 || ' '
               ELSE ''
               END
           )
$$ LANGUAGE SQL;

CREATE FUNCTION full_name(kandidaten) RETURNS TEXT AS
$$
SELECT null_or_space($1.titel)
           || null_or_space($1.namenszusatz)
           || $1.nachname
           || ', '
           || $1.vornamen
$$ LANGUAGE SQL;

CREATE VIEW abgeordnete
            (
             name,
             partei_kurzbezeichnung
                )
AS
SELECT full_name(k),
       p.kurzbezeichnung
FROM bundestagsmandaten bm
         JOIN parteikandidaturen pk ON pk.id = bm.partei
         JOIN parteien p ON p.id = pk.partei
         JOIN kandidaten k ON k.id = bm.kandidat;

GRANT SELECT ON abgeordnete TO web_anon;

-- Q3

GRANT SELECT ON wahlkreise TO web_anon;
GRANT SELECT ON bundeslaender TO web_anon;

CREATE VIEW summe_erststimmen
            (
             wahlkreis,
             wahl,
             anzahl
                )
AS
SELECT dk.wahlkreis, pk.wahl, SUM(ee.anzahl_stimmen)
FROM erststimmeergebnisse ee
         JOIN direktkandidaten dk ON dk.id = ee.direktkandidat
         JOIN parteikandidaturen pk ON dk.partei = pk.id
GROUP BY dk.wahlkreis, pk.wahl;

CREATE VIEW summe_zweitstimmen
            (
             wahlkreis,
             wahl,
             anzahl
                )
AS
SELECT ze.wahlkreis, pk.wahl, SUM(ze.anzahl_stimmen)
FROM zweitstimmeergebnisse ze
         JOIN landeslisten ll ON ll.id = ze.landesliste
         JOIN parteikandidaturen pk ON ll.partei = pk.id
GROUP BY ze.wahlkreis, pk.wahl;

CREATE VIEW wahlkreis_uebersicht
            (
             wahlkreis,
             wahlbeteiligung,
             gewinner,
             sieger_partei
                )
AS
SELECT wk.id,
       ROUND(100.00 * wd.waehlende / wd.wahlberechtigte, 2),
       full_name(k),
       p.kurzbezeichnung
FROM wahlkreise wk
         JOIN wahlkreiswahldaten wd ON wd.wahlkreis = wk.id
         JOIN direktkandidaten dk ON dk.wahlkreis = wk.id
         JOIN kandidaten k ON k.id = dk.kandidat
         JOIN bundestagsmandaten bm ON bm.kandidat = k.id
         JOIN parteikandidaturen pk ON dk.partei = pk.id
         JOIN parteien p ON p.id = pk.partei
WHERE bm.direktmandat = TRUE
  AND wd.wahl = 1;

GRANT SELECT ON wahlkreis_uebersicht TO web_anon;

CREATE VIEW alle_ergebnisse
            (
             wahlkreis,
             kurzbezeichnung,
             erststimmen_anzahl_2017,
             erststimmen_prozent_2017,
             erststimmen_anzahl_2021,
             erststimmen_prozent_2021,
             unterschied_erststimmen,
             zweitstimmen_anzahl_2017,
             zweitstimmen_prozent_2017,
             zweitstimmen_anzahl_2021,
             zweitstimmen_prozent_2021,
             unterschied_zweitstimmen
                )
AS
WITH erststimmen_vgl
         (
          partei_kandidatur,
          wahlkreis,
          anz_2021,
          prozent_2021,
          anz_2017,
          prozent_2017
             )
         AS
         (
             SELECT pk2021.partei,
                    wk.id,
                    e2021.anzahl_stimmen,
                    ROUND(100.00 * e2021.anzahl_stimmen / se2021.anzahl, 1),
                    e2017.anzahl_stimmen,
                    ROUND(100.00 * e2017.anzahl_stimmen / se2017.anzahl, 1)
             FROM wahlkreise wk
                      JOIN summe_erststimmen se2021 ON se2021.wahl = 1 AND se2021.wahlkreis = wk.id
                      JOIN summe_erststimmen se2017 ON se2017.wahl = 2 AND se2017.wahlkreis = wk.id
                      JOIN direktkandidaten dk2021 ON dk2021.wahlkreis = wk.id
                      JOIN parteikandidaturen pk2021 ON pk2021.id = dk2021.partei AND pk2021.wahl = 1
                      JOIN erststimmeergebnisse e2021 ON e2021.direktkandidat = dk2021.id
                      LEFT OUTER JOIN (
                 direktkandidaten dk2017
                     JOIN parteikandidaturen pk2017 ON pk2017.id = dk2017.partei AND pk2017.wahl = 2
                     JOIN erststimmeergebnisse e2017 ON e2017.direktkandidat = dk2017.id
                 ) ON dk2017.wahlkreis = wk.id AND pk2017.partei = pk2021.partei
         ),
     zweitstimmen_vgl
         (
          partei_kandidatur,
          wahlkreis,
          anz_2021,
          prozent_2021,
          anz_2017,
          prozent_2017
             )
         AS
         (
             SELECT pk2021.partei,
                    wk.id,
                    ze2021.anzahl_stimmen,
                    ROUND(100.00 * ze2021.anzahl_stimmen / sz2021.anzahl, 1),
                    ze2017.anzahl_stimmen,
                    ROUND(100.00 * ze2017.anzahl_stimmen / sz2017.anzahl, 1)
             FROM wahlkreise wk
                      JOIN summe_zweitstimmen sz2021 ON sz2021.wahl = 1 AND sz2021.wahlkreis = wk.id
                      JOIN summe_zweitstimmen sz2017 ON sz2017.wahl = 2 AND sz2017.wahlkreis = wk.id
                      JOIN zweitstimmeergebnisse ze2021 ON ze2021.wahlkreis = wk.id
                      JOIN landeslisten ll2021 ON ll2021.id = ze2021.landesliste
                      JOIN parteikandidaturen pk2021 ON pk2021.id = ll2021.partei AND pk2021.wahl = 1
                      LEFT OUTER JOIN (
                 zweitstimmeergebnisse ze2017
                     JOIN landeslisten ll2017 ON ll2017.id = ze2017.landesliste
                     JOIN parteikandidaturen pk2017 ON pk2017.id = ll2017.partei AND pk2017.wahl = 2
                 ) ON ze2017.wahlkreis = wk.id AND pk2017.partei = pk2021.partei
         )
SELECT COALESCE(e.wahlkreis, z.wahlkreis) AS wahlkreis,
       p.kurzbezeichnung,
       e.anz_2017                         AS erststimmen_anzahl_2017,
       e.prozent_2017                     AS erststimmen_prozent_2017,
       e.anz_2021                         AS erststimmen_anzahl_2021,
       e.prozent_2021                     AS erststimmen_prozent_2021,
       e.prozent_2021 - e.prozent_2017    AS unterschied_erststimmen,
       z.anz_2017                         AS zweitstimmen_anzahl_2017,
       z.prozent_2017                     AS zweitstimmen_prozent_2017,
       z.anz_2021                         AS zweitstimmen_anzahl_2021,
       z.prozent_2021                     AS zweitstimmen_prozent_2021,
       z.prozent_2021 - z.prozent_2017    AS unterschied_zweitstimmen
FROM zweitstimmen_vgl z
         FULL OUTER JOIN erststimmen_vgl e
                         ON e.partei_kandidatur = z.partei_kandidatur AND z.wahlkreis = e.wahlkreis
         JOIN parteien p ON p.id = COALESCE(COALESCE(e.partei_kandidatur, z.partei_kandidatur))
         LEFT OUTER JOIN reihenfolge_parteien_wahlkreis rw
              ON rw.wahlkreis = COALESCE(e.wahlkreis, z.wahlkreis) AND p.id = rw.partei
ORDER BY rw.rank;
GRANT SELECT ON alle_ergebnisse TO web_anon;
-- Bundesland Uebersicht
CREATE VIEW alle_ergebnisse_pro_bundesland
            (
             bundesland,
             kurzbezeichnung,
             erststimmen_anzahl_2017,
             erststimmen_prozent_2017,
             erststimmen_anzahl_2021,
             erststimmen_prozent_2021,
             unterschied_erststimmen,
             zweitstimmen_anzahl_2017,
             zweitstimmen_prozent_2017,
             zweitstimmen_anzahl_2021,
             zweitstimmen_prozent_2021,
             unterschied_zweitstimmen
                )
AS
WITH erststimmen_vgl
         (
          partei_kandidatur,
          bundesland,
          anz_2021,
          prozent_2021,
          anz_2017,
          prozent_2017
             )
         AS
         (
             SELECT pk2021.partei,
                    wk.bundesland,
                    SUM(e2021.anzahl_stimmen),
                    ROUND(100.00 * SUM(e2021.anzahl_stimmen) / SUM(se2021.anzahl), 1),
                    SUM(e2017.anzahl_stimmen),
                    ROUND(100.00 * SUM(e2017.anzahl_stimmen) / SUM(se2017.anzahl), 1)
             FROM wahlkreise wk
                      JOIN summe_erststimmen se2021 ON se2021.wahl = 1 AND se2021.wahlkreis = wk.id
                      JOIN summe_erststimmen se2017 ON se2017.wahl = 2 AND se2017.wahlkreis = wk.id
                      JOIN direktkandidaten dk2021 ON dk2021.wahlkreis = wk.id
                      JOIN parteikandidaturen pk2021 ON pk2021.id = dk2021.partei AND pk2021.wahl = 1
                      JOIN erststimmeergebnisse e2021 ON e2021.direktkandidat = dk2021.id
                      LEFT OUTER JOIN (
                 direktkandidaten dk2017
                     JOIN parteikandidaturen pk2017 ON pk2017.id = dk2017.partei AND pk2017.wahl = 2
                     JOIN erststimmeergebnisse e2017 ON e2017.direktkandidat = dk2017.id
                 ) ON dk2017.wahlkreis = wk.id AND pk2017.partei = pk2021.partei
             GROUP BY pk2021.partei, wk.bundesland
         ),
     zweitstimmen_vgl
         (
          partei_kandidatur,
          bundesland,
          anz_2021,
          prozent_2021,
          anz_2017,
          prozent_2017
             )
         AS
         (
             SELECT pk2021.partei,
                    wk.bundesland,
                    SUM(ze2021.anzahl_stimmen),
                    ROUND(100.00 * SUM(ze2021.anzahl_stimmen) / SUM(sz2021.anzahl), 1),
                    SUM(ze2017.anzahl_stimmen),
                    ROUND(100.00 * SUM(ze2017.anzahl_stimmen) / SUM(sz2017.anzahl), 1)
             FROM wahlkreise wk
                      JOIN summe_zweitstimmen sz2021 ON sz2021.wahl = 1 AND sz2021.wahlkreis = wk.id
                      JOIN summe_zweitstimmen sz2017 ON sz2017.wahl = 2 AND sz2017.wahlkreis = wk.id
                      JOIN zweitstimmeergebnisse ze2021 ON ze2021.wahlkreis = wk.id
                      JOIN landeslisten ll2021 ON ll2021.id = ze2021.landesliste
                      JOIN parteikandidaturen pk2021 ON pk2021.id = ll2021.partei AND pk2021.wahl = 1
                      LEFT OUTER JOIN (
                 zweitstimmeergebnisse ze2017
                     JOIN landeslisten ll2017 ON ll2017.id = ze2017.landesliste
                     JOIN parteikandidaturen pk2017 ON pk2017.id = ll2017.partei AND pk2017.wahl = 2
                 ) ON ze2017.wahlkreis = wk.id AND pk2017.partei = pk2021.partei
             GROUP BY pk2021.partei, wk.bundesland
         ),
     egebnisse(bundesland,
               kurzbezeichnung,
               erststimmen_anzahl_2017,
               erststimmen_prozent_2017,
               erststimmen_anzahl_2021,
               erststimmen_prozent_2021,
               unterschied_erststimmen,
               zweitstimmen_anzahl_2017,
               zweitstimmen_prozent_2017,
               zweitstimmen_anzahl_2021,
               zweitstimmen_prozent_2021,
               unterschied_zweitstimmen) AS (
         SELECT COALESCE(e.bundesland, z.bundesland) AS bundesland,
                p.kurzbezeichnung,
                e.anz_2017                           AS erststimmen_anzahl_2017,
                e.prozent_2017                       AS erststimmen_prozent_2017,
                e.anz_2021                           AS erststimmen_anzahl_2021,
                e.prozent_2021                       AS erststimmen_prozent_2021,
                e.prozent_2021 - e.prozent_2017      AS unterschied_erststimmen,
                z.anz_2017                           AS zweitstimmen_anzahl_2017,
                z.prozent_2017                       AS zweitstimmen_prozent_2017,
                z.anz_2021                           AS zweitstimmen_anzahl_2021,
                z.prozent_2021                       AS zweitstimmen_prozent_2021,
                z.prozent_2021 - z.prozent_2017      AS unterschied_zweitstimmen
         FROM zweitstimmen_vgl z
                  FULL OUTER JOIN erststimmen_vgl e
                                  ON e.partei_kandidatur = z.partei_kandidatur AND z.bundesland = e.bundesland
                  JOIN parteien p ON p.id = COALESCE(COALESCE(e.partei_kandidatur, z.partei_kandidatur)))

SELECT bd.name,
       eg.kurzbezeichnung,
       eg.erststimmen_anzahl_2017,
       eg.erststimmen_prozent_2017,
       eg.erststimmen_anzahl_2021,
       eg.erststimmen_prozent_2021,
       eg.unterschied_erststimmen,
       eg.zweitstimmen_anzahl_2017,
       eg.zweitstimmen_prozent_2017,
       eg.zweitstimmen_anzahl_2021,
       eg.zweitstimmen_prozent_2021,
       eg.unterschied_zweitstimmen
FROM bundeslaender bd
         JOIN egebnisse eg ON bd.id = eg.bundesland;

GRANT SELECT ON alle_ergebnisse_pro_bundesland TO web_anon;


-- Q6
CREATE VIEW knappste_sieger(wahl, partei_id, partei, wkr_id, wahlkreis, siege, rank, vorsprung) AS
(
with rank_pro_wahlkreis(wahl, direktkandidat, wahlkreis, partei, anzahl_stimmen, rank) AS (
    SELECT pk.wahl,
           es.direktKandidat,
           dk.wahlkreis,
           dk.partei,
           es.anzahl_stimmen,
           RANK() OVER (PARTITION BY pk.wahl, dk.wahlkreis ORDER BY es.anzahl_stimmen DESC) AS rank
    FROM erststimmeErgebnisse es
             JOIN direktkandidaten dk ON es.direktkandidat = dk.id
             JOIN parteiKandidaturen pk ON dk.partei = pk.id
)
   , vorsprung_sieger_kandidaten(wahl, direktkandidat, wahlkreis, partei, rank, vorsprung) AS (
    SELECT rk.wahl,
           rk.direktKandidat,
           rk.wahlkreis,
           rk.partei,
           rk.rank,
           rk.anzahl_stimmen - COALESCE(LEAD(rk.anzahl_stimmen)
                                        OVER ( PARTITION BY rk.wahl, rk.wahlkreis ORDER BY rk.anzahl_stimmen DESC ),
                                        0) AS vorsprung
    FROM rank_pro_wahlkreis rk
    WHERE rk.Rank <= 2
)
   , top_knappste_Siege(wahl, direktkandidat, wahlkreis, partei, rank, vorsprung) AS (
    SELECT rp.wahl, rp.direktkandidat, rp.wahlkreis, rp.partei, rp.rank_vorsprung, rp.vorsprung
    FROM (
             SELECT vk.wahl,
                    vk.direktkandidat,
                    vk.wahlkreis,
                    vk.partei,
                    RANK() OVER (PARTITION BY vk.wahl, vk.partei ORDER BY vk.vorsprung ) AS rank_vorsprung,
                    vk.vorsprung
             FROM vorsprung_sieger_kandidaten vk
             WHERE vk.rank = 1) rp
    WHERE rp.rank_vorsprung <= 10
)
   , vorsprung_besiegte_kandidaten (wahl, direktKandidat, wahlkreis, partei, vorsprung) AS (
    SELECT rk.wahl,
           rk.direktKandidat,
           rk.wahlkreis,
           rk.partei,
           (MAX(rk.anzahl_stimmen) OVER ( PARTITION BY rk.wahl, rk.wahlkreis ORDER BY rk.anzahl_stimmen DESC )) -
           rk.anzahl_stimmen AS vorsprung
    FROM rank_pro_wahlkreis rk
)
   , knappste_besiegte_kandidaten(wahl, direktKandidat, wahlkreis, partei, rank, vorsprung) AS (
    SELECT rk.wahl,
           rk.direktKandidat,
           rk.wahlkreis,
           rk.partei,
           rk.rank,
           rk.vorsprung
    FROM (
             SELECT vk.*, RANK() OVER ( PARTITION BY vk.wahl, vk.partei ORDER BY vk.vorsprung ) AS rank
             FROM vorsprung_besiegte_kandidaten vk
             WHERE NOT EXISTS(
                     SELECT
                     FROM top_knappste_Siege ts
                     WHERE vk.partei = ts.partei
                       AND vk.wahl = ts.wahl)) rk
    WHERE rk.rank <= 10
)
   , alle_knappste_sieger(wahl, direktkandidat, wahlkreis, partei, rank, siege, vorsprung) AS (
    SELECT ts.wahl,
           ts.direktkandidat,
           ts.wahlkreis,
           ts.partei,
           ts.rank,
           true,
           ts.vorsprung
    FROM top_knappste_Siege ts
    UNION
    SELECT kb.wahl,
           kb.direktkandidat,
           kb.wahlkreis,
           kb.partei,
           kb.rank,
           false,
           kb.vorsprung
    FROM knappste_besiegte_kandidaten kb
)
SELECT ks.wahl,
       p.id,
       p.kurzbezeichnung,
       wd.id,
       wd.name,
       ks.siege,
       Rank() OVER ( Partition BY ks.wahl, p.id, p.kurzbezeichnung ORDER BY ks.rank ),
       ks.vorsprung
FROM alle_knappste_sieger ks
         JOIN wahlkreise wd ON ks.wahlkreis = wd.id
         JOIN parteiKandidaturen pk ON ks.partei = pk.id
         JOIN parteien p ON pk.partei = p.id
    );

GRANT SELECT ON knappste_sieger TO web_anon;


CREATE VIEW parties(id, name, kurzbezeichnung) AS
SELECT p.id, p.name, p.kurzbezeichnung
FROM parteien p
WHERE p.is_echte_partei
  and EXISTS(SELECT *
             FROM direktkandidaten dk
                      JOIN parteiKandidaturen pk ON dk.partei = pk.id
             WHERE pk.partei = p.id);


GRANT SELECT ON parties TO web_anon;

-- Q5
CREATE VIEW ueberhangsmandate (wahl, partei, land, ueberhange) AS
SELECT ml.wahl, p.kurzbezeichnung, bl.name, ml.ueberhang
FROM mindestsitzzahl_pro_partei_pro_land ml
         JOIN bundeslaender bl ON ml.land = bl.id
         JOIN parteiKandidaturen pk ON ml.partei = pk.id
         JOIN parteien p ON pk.partei = p.id
WHERE ml.ueberhang > 0;

GRANT SELECT ON ueberhangsmandate TO web_anon;



-- Q7
CREATE VIEW erststimmenergebenisse_einzelstimmen
            (
             direktkandidat,
             anzahl_stimmen
                )
AS
SELECT direktkandidat, COUNT(*)
FROM erststimmen
WHERE direktkandidat IS NOT NULL
GROUP BY direktkandidat;

CREATE VIEW zweitstimmenergebnisse_einzelstimmen
            (
             landesliste,
             anzahl_stimmen,
             wahlkreis
                )
AS
SELECT landesliste, COUNT(*), wahlkreis
FROM zweitstimmen
WHERE landesliste IS NOT NULL
GROUP BY landesliste, wahlkreis;

CREATE VIEW summe_erststimmen_einzelstimmen
            (
             wahlkreis,
             wahl,
             anzahl
                )
AS
SELECT dk.wahlkreis, pk.wahl, SUM(ee.anzahl_stimmen)
FROM erststimmenergebenisse_einzelstimmen ee
         JOIN direktkandidaten dk ON dk.id = ee.direktkandidat
         JOIN parteikandidaturen pk ON dk.partei = pk.id
GROUP BY dk.wahlkreis, pk.wahl;

CREATE VIEW summe_zweitstimmen_einzelstimmen
            (
             wahlkreis,
             wahl,
             anzahl
                )
AS
SELECT ze.wahlkreis, pk.wahl, SUM(ze.anzahl_stimmen)
FROM zweitstimmenergebnisse_einzelstimmen ze
         JOIN landeslisten ll ON ll.id = ze.landesliste
         JOIN parteikandidaturen pk ON ll.partei = pk.id
GROUP BY ze.wahlkreis, pk.wahl;

CREATE VIEW wahlkreis_uebersicht_einzelstimmen
            (
             wahlkreis,
             wahlbeteiligung,
             gewinner,
             sieger_partei
                )
AS
SELECT wk.id,
       ROUND(100.00 * wd.waehlende / wd.wahlberechtigte, 2),
       full_name(k),
       p.kurzbezeichnung
FROM wahlkreise wk
         JOIN wahlkreiswahldaten wd ON wd.wahlkreis = wk.id
         JOIN direktkandidaten dk ON dk.wahlkreis = wk.id
         JOIN kandidaten k ON k.id = dk.kandidat
         JOIN bundestagsmandaten bm ON bm.kandidat = k.id
         JOIN parteikandidaturen pk ON dk.partei = pk.id
         JOIN parteien p ON p.id = pk.partei
WHERE bm.direktmandat = TRUE
  AND wd.wahl = 1;

GRANT SELECT ON wahlkreis_uebersicht_einzelstimmen TO web_anon;

CREATE VIEW alle_ergebnisse_einzelstimmen
            (
             wahlkreis,
             kurzbezeichnung,
             erststimmen_anzahl_2017,
             erststimmen_prozent_2017,
             erststimmen_anzahl_2021,
             erststimmen_prozent_2021,
             unterschied_erststimmen,
             zweitstimmen_anzahl_2017,
             zweitstimmen_prozent_2017,
             zweitstimmen_anzahl_2021,
             zweitstimmen_prozent_2021,
             unterschied_zweitstimmen
                )
AS
WITH erststimmen_vgl
         (
          partei_kandidatur,
          wahlkreis,
          anz_2021,
          prozent_2021,
          anz_2017,
          prozent_2017
             )
         AS
         (
             SELECT pk2021.partei,
                    wk.id,
                    e2021.anzahl_stimmen,
                    ROUND(100.00 * e2021.anzahl_stimmen / se2021.anzahl, 1),
                    e2017.anzahl_stimmen,
                    ROUND(100.00 * e2017.anzahl_stimmen / se2017.anzahl, 1)
             FROM wahlkreise wk
                      JOIN summe_erststimmen_einzelstimmen se2021 ON se2021.wahl = 1 AND se2021.wahlkreis = wk.id
                      JOIN summe_erststimmen_einzelstimmen se2017 ON se2017.wahl = 2 AND se2017.wahlkreis = wk.id
                      JOIN direktkandidaten dk2021 ON dk2021.wahlkreis = wk.id
                      JOIN parteikandidaturen pk2021 ON pk2021.id = dk2021.partei AND pk2021.wahl = 1
                      JOIN erststimmenergebenisse_einzelstimmen e2021 ON e2021.direktkandidat = dk2021.id
                      LEFT OUTER JOIN (
                 direktkandidaten dk2017
                     JOIN parteikandidaturen pk2017 ON pk2017.id = dk2017.partei AND pk2017.wahl = 2
                     JOIN erststimmenergebenisse_einzelstimmen e2017 ON e2017.direktkandidat = dk2017.id
                 ) ON dk2017.wahlkreis = wk.id AND pk2017.partei = pk2021.partei
         ),
     zweitstimmen_vgl
         (
          partei_kandidatur,
          wahlkreis,
          anz_2021,
          prozent_2021,
          anz_2017,
          prozent_2017
             )
         AS
         (
             SELECT pk2021.partei,
                    wk.id,
                    ze2021.anzahl_stimmen,
                    ROUND(100.00 * ze2021.anzahl_stimmen / sz2021.anzahl, 1),
                    ze2017.anzahl_stimmen,
                    ROUND(100.00 * ze2017.anzahl_stimmen / sz2017.anzahl, 1)
             FROM wahlkreise wk
                      JOIN summe_zweitstimmen_einzelstimmen sz2021 ON sz2021.wahl = 1 AND sz2021.wahlkreis = wk.id
                      JOIN summe_zweitstimmen_einzelstimmen sz2017 ON sz2017.wahl = 2 AND sz2017.wahlkreis = wk.id
                      JOIN zweitstimmenergebnisse_einzelstimmen ze2021 ON ze2021.wahlkreis = wk.id
                      JOIN landeslisten ll2021 ON ll2021.id = ze2021.landesliste
                      JOIN parteikandidaturen pk2021 ON pk2021.id = ll2021.partei AND pk2021.wahl = 1
                      LEFT OUTER JOIN (
                 zweitstimmenergebnisse_einzelstimmen ze2017
                     JOIN landeslisten ll2017 ON ll2017.id = ze2017.landesliste
                     JOIN parteikandidaturen pk2017 ON pk2017.id = ll2017.partei AND pk2017.wahl = 2
                 ) ON ze2017.wahlkreis = wk.id AND pk2017.partei = pk2021.partei
         )
SELECT COALESCE(e.wahlkreis, z.wahlkreis) AS wahlkreis,
       p.kurzbezeichnung,
       e.anz_2017                         AS erststimmen_anzahl_2017,
       e.prozent_2017                     AS erststimmen_prozent_2017,
       e.anz_2021                         AS erststimmen_anzahl_2021,
       e.prozent_2021                     AS erststimmen_prozent_2021,
       e.prozent_2021 - e.prozent_2017    AS unterschied_erststimmen,
       z.anz_2017                         AS zweitstimmen_anzahl_2017,
       z.prozent_2017                     AS zweitstimmen_prozent_2017,
       z.anz_2021                         AS zweitstimmen_anzahl_2021,
       z.prozent_2021                     AS zweitstimmen_prozent_2021,
       z.prozent_2021 - z.prozent_2017    AS unterschied_zweitstimmen
FROM zweitstimmen_vgl z
         FULL OUTER JOIN erststimmen_vgl e
                         ON e.partei_kandidatur = z.partei_kandidatur AND z.wahlkreis = e.wahlkreis
         JOIN parteien p ON p.id = COALESCE(COALESCE(e.partei_kandidatur, z.partei_kandidatur))
         LEFT OUTER JOIN reihenfolge_parteien_wahlkreis rw
              ON rw.wahlkreis = COALESCE(e.wahlkreis, z.wahlkreis) AND p.id = rw.partei
ORDER BY rw.rank;

GRANT SELECT ON alle_ergebnisse_einzelstimmen TO web_anon;

-- Q4

CREATE VIEW gewinner_parteien_bundesland(bundesland, partei, kandidat, listennummer)
AS
SELECT bl.id, pk.id, full_name(k), lk.listennummer
FROM bundestagsmandaten bm
         JOIN parteikandidaturen pk ON pk.id = bm.partei
         JOIN bundeslaender bl on bm.bundesland = bl.id
         JOIN kandidaten k ON k.id = bm.kandidat
         JOIN listenkandidaten lk ON lk.kandidat = k.id
WHERE bm.wahl = 1
  AND bm.direktmandat = FALSE;

CREATE VIEW gewinner_parteien_wahlkreis(bundesland, partei, kandidat, wahlkreis)
AS
SELECT bl.id, pk.id, full_name(k), wk.id
FROM bundestagsmandaten bm
         JOIN parteikandidaturen pk ON pk.id = bm.partei
         JOIN bundeslaender bl on bm.bundesland = bl.id
         JOIN kandidaten k ON k.id = bm.kandidat
         JOIN direktkandidaten dk ON dk.partei = pk.id AND dk.kandidat = k.id
         JOIN wahlkreise wk ON dk.wahlkreis = wk.id
WHERE bm.wahl = 1
  AND bm.direktmandat = TRUE
ORDER BY wk.id;

CREATE VIEW gewinner_parteien (bundesland, partei, gewinner) AS
WITH grouped_bundesland_gewinner(bundesland, partei, listenplaetze) AS
         (
             SELECT bundesland,
                    partei,
                    json_agg(json_build_object(
                            'kandidat', kandidat,
                            'listennummer', listennummer
                        ))
             FROM gewinner_parteien_bundesland
             GROUP BY bundesland, partei
         ),
     grouped_wahlkreis_gewinner(bundesland, partei, wahlkreise) AS
         (
             SELECT bundesland,
                    partei,
                    json_agg(json_build_object(
                            'kandidat', kandidat,
                            'wahlkreis', wahlkreis
                        ))
             FROM gewinner_parteien_wahlkreis
             GROUP BY bundesland, partei
         ),
     gewinner(partei, bundesland, gewinner) AS
         (
             SELECT COALESCE(b.partei, w.partei),
                    COALESCE(b.bundesland, w.bundesland),
                    json_build_object(
                            'wahlkreise', w.wahlkreise,
                            'listenplaetze', b.listenplaetze
                        )
             FROM grouped_wahlkreis_gewinner w
                      FULL OUTER JOIN grouped_bundesland_gewinner b
                                      ON b.partei = w.partei AND b.bundesland = w.bundesland
         )
SELECT g.bundesland, p.kurzbezeichnung, g.gewinner
FROM gewinner g
         JOIN parteikandidaturen pk ON g.partei = pk.id
         JOIN parteien p ON p.id = pk.partei;

GRANT SELECT ON gewinner_parteien TO web_anon;


CREATE VIEW rank_arbeitslosigkeit (land_id, land, rank) AS
(
WITH arbeitslosigkeit_pro_land(land_id, land, arbeitslosenquote) AS (
    SELECT bl.id, bl.name, AVG(ak.arbeitslosenquote)
    FROM arbeitslosigkeit ak
             JOIN wahlkreise wk ON ak.wahlkreis = wk.id
             JOIN bundeslaender bl ON wk.bundesland = bl.id
    GROUP BY wk.bundesland, bl.id
)
SELECT rk.*
FROM (
         SELECT al.land_id, al.land, RANK() OVER (ORDER BY al.arbeitslosenquote DESC) as rank
         FROM arbeitslosigkeit_pro_land al) rk
ORDER BY rank
    );
GRANT SELECT ON rank_arbeitslosigkeit TO web_anon;


CREATE VIEW arbeitslosigkeit_uebersicht(ideologie, bundesland, anzahlstimmen) AS
(
WITH summe_zweitstimmen_pro_land(land_id, anzahlstimmen) AS (
    SELECT wk.bundesland, SUM(sz.anzahl)
    FROM summe_zweitstimmen sz
             JOIN wahlkreise wk ON sz.wahlkreis = wk.id
    WHERE sz.wahl = 1
    GROUP BY wk.bundesland
),
     anteil_pro_bundesland(ideologie, bundesland, anzahlstimmen, rank) AS (
         SELECT p.ideologie, ra.land, 1.0 * SUM(zl.zweitstimmen) / sl.anzahlstimmen, ra.rank
         FROM zweitstimmen_pro_partei_pro_land zl
                  JOIN parteiKandidaturen pk ON zl.partei = pk.id
                  JOIN parteien p ON pk.partei = p.id
                  JOIN rank_arbeitslosigkeit ra ON zl.land = ra.land_id
                  JOIN summe_zweitstimmen_pro_land sl ON sl.land_id = ra.land_id
         WHERE zl.wahl = 1
           and p.ideologie in ('l', 'r')
         GROUP BY p.ideologie, ra.land_id, ra.land, sl.anzahlstimmen, ra.rank
     )
select ideologie, bundesland, anzahlstimmen
from anteil_pro_bundesland
ORDER BY rank
    );

GRANT SELECT ON arbeitslosigkeit_uebersicht TO web_anon;


CREATE VIEW koalitionen(koalition, sitze) AS
WITH RECURSIVE
    SUPERSET(combination, size, biggest) AS
        (
            SELECT ARRAY [partei], 1, partei
            FROM sitze_pro_partei
            WHERE wahl = 1

            UNION ALL

            SELECT s.partei || prev.combination, prev.size + 1, s.partei
            FROM SUPERSET prev,
                 sitze_pro_partei s
            WHERE s.wahl = 1
              AND prev.size < (SELECT COUNT(*) FROM sitze_pro_partei WHERE wahl = 1)
              AND NOT s.partei = ANY (prev.combination)
              AND prev.biggest < s.partei
        ),
    koaliation_sitze(koalition, sitze) AS
        (
            SELECT combination,
                   (
                       SELECT SUM(s.sitze)
                       FROM UNNEST(combination) AS pks(pk)
                                JOIN sitze_pro_partei s
                                     ON s.partei = pks.pk
                   )
            FROM SUPERSET
        ),
    moegliche_koalitionen AS (
        SELECT koalition, sitze
        FROM koaliation_sitze
        WHERE sitze >= (SELECT CEIL(1.0 * SUM(sitze) / 2) FROM sitze_pro_partei WHERE wahl = 1)
    ),
    kleinste_koalitionen AS (
        SELECT k1.koalition, k1.sitze
        FROM moegliche_koalitionen k1
        WHERE NOT EXISTS(
                SELECT *
                FROM moegliche_koalitionen k2
                WHERE k1.koalition @> k2.koalition
                  AND cardinality(k2.koalition) < cardinality(k1.koalition)
            ))

SELECT (
           SELECT json_agg(p.kurzbezeichnung)
           FROM UNNEST(kk.koalition) AS k(pk)
                    JOIN parteikandidaturen pk ON pk.id = k.pk
                    JOIN parteien p ON p.id = pk.partei
       ),
       kk.sitze
FROM kleinste_koalitionen kk;


GRANT SELECT ON koalitionen TO web_anon;


CREATE VIEW stimmzettel_erststimme
            (wahlkreis, kandidat_id, kandidat_nachname, kandidat_vorname, kandidat_beruf, partei_abk, partei_name,
             rank)
AS
(
WITH direktkandidaten_mit_partein_ranking(wahlkreis, kandidat_id, kandidat_nachname, kandidat_vorname, kandidat_beruf,
                                          partei_abk, partei_name, rank) AS (
    SELECT dk.wahlkreis,
           dk.id,
           k.nachname,
           k.vornamen,
           k.beruf,
           p.kurzbezeichnung,
           p.name,
           RANK() OVER (PARTITION BY dk.wahlkreis ORDER BY ze.anzahl_stimmen DESC)
    FROM direktkandidaten dk
             JOIN parteiKandidaturen pk1 ON dk.partei = pk1.id
             JOIN parteien p ON pk1.partei = p.id
             JOIN parteiKandidaturen pk2 ON pk2.partei = p.id
             JOIN landeslisten l2 ON l2.partei = pk2.id
             JOIN zweitstimmeErgebnisse ze ON ze.landesliste = l2.id AND ze.wahlkreis = dk.wahlkreis
             JOIN kandidaten k ON dk.kandidat = k.id
    WHERE pk1.wahl = 1
      AND pk2.wahl = 2
      AND p.is_echte_partei = 't'
      AND EXISTS(
            SELECT l1.*
            FROM landeslisten l1,
                 wahlkreise wk
            WHERE l1.partei = pk1.id
              AND dk.wahlkreis = wk.id
              AND wk.bundesland = l1.bundesland
        )
),
     max_rank(wahlkreis, max_rank) AS (
         SELECT d.wahlkreis, MAX(d.rank)
         FROM direktkandidaten_mit_partein_ranking d
         group by d.wahlkreis
     ),
     direktkandidaten_ohne_partein_ranking(wahlkreis, kandidat_id, kandidat_nachname, kandidat_vorname, kandidat_beruf,
                                           partei_abk, partei_name, rank) AS (
         SELECT dk.wahlkreis,
                dk.id,
                k.nachname,
                k.vornamen,
                k.beruf,
                p.kurzbezeichnung,
                p.name,
                mr.max_rank + RANK() OVER (PARTITION BY dk.wahlkreis ORDER BY k.nachname)
         FROM direktkandidaten dk
                  JOIN parteiKandidaturen pk ON dk.partei = pk.id
                  JOIN parteien p ON pk.partei = p.id
                  JOIN kandidaten k ON dk.kandidat = k.id
                  JOIN max_rank mr ON dk.wahlkreis = mr.wahlkreis
         WHERE pk.wahl = 1
             AND
               p.is_echte_partei = 'f'
            OR NOT EXISTS(
                 SELECT l.*
                 FROM landeslisten l,
                      wahlkreise wk
                 WHERE l.partei = pk.id
                   AND dk.wahlkreis = wk.id
                   AND wk.bundesland = l.bundesland
             )
     )
SELECT dpk.*
FROM direktkandidaten_mit_partein_ranking dpk
UNION ALL
SELECT dok.*
FROM direktkandidaten_ohne_partein_ranking dok

    );

GRANT SELECT ON stimmzettel_erststimme TO web_anon;


CREATE VIEW landeslisten_kandidaten (bundesland, liste_id, partei_abk, partei_name, rank, kandidaten) AS
(
SELECT sz.bundesland,
       sz.liste_id,
       sz.partei_abk,
       sz.partei_name,
       sz.rank,
       string_agg(CONCAT(k.nachname, ' ', k.vornamen), ', ' ORDER BY lk.listennummer)
FROM stimmzettel_zweitstimme sz
         JOIN parteien p ON sz.partei_abk = p.kurzbezeichnung
         JOIN parteiKandidaturen pk ON pk.partei = p.id
         JOIN landeslisten l ON l.partei = pk.id AND sz.bundesland = l.bundesland
         JOIN listenkandidaten lk ON lk.landesliste = l.id
         JOIN kandidaten k ON k.id = lk.kandidat
WHERE pk.wahl = 1
GROUP BY sz.bundesland, sz.liste_id, sz.partei_abk, sz.partei_name, sz.rank
    );

GRANT SELECT ON landeslisten_kandidaten TO web_anon;
