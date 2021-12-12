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
  SELECT
    (
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

CREATE VIEW abgeordnete(
       name,
       partei_kurzbezeichnung
) AS
SELECT
  full_name(k),
  p.kurzbezeichnung
FROM bundestagsmandaten bm
  JOIN parteikandidaturen pk ON pk.id = bm.partei
  JOIN parteien p ON p.id = pk.partei
  JOIN kandidaten k ON k.id = bm.kandidat;

GRANT SELECT ON abgeordnete TO web_anon;

-- Q3

GRANT SELECT ON wahlkreise TO web_anon;

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
) AS
SELECT
  wk.id,
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
WHERE bm.direktmandat = TRUE AND wd.wahl = 1;

GRANT SELECT ON wahlkreis_uebersicht TO web_anon;

CREATE VIEW alle_ergebnisse(
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
) AS
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
         ROUND(100.00 * e2021.anzahl_stimmen  / se2021.anzahl, 1),
         e2017.anzahl_stimmen,
         ROUND(100.00 * e2017.anzahl_stimmen  / se2017.anzahl, 1)
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
         ROUND(100.00 * ze2021.anzahl_stimmen  / sz2021.anzahl, 1),
         ze2017.anzahl_stimmen,
         ROUND(100.00 * ze2017.anzahl_stimmen  / sz2017.anzahl, 1)
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
       e.anz_2017 AS erststimmen_anzahl_2017,
       e.prozent_2017 AS erststimmen_prozent_2017,
       e.anz_2021 AS erststimmen_anzahl_2021,
       e.prozent_2021 AS erststimmen_prozent_2021,
       e.prozent_2021 - e.prozent_2017 AS unterschied_erststimmen,
       z.anz_2017 AS zweitstimmen_anzahl_2017,
       z.prozent_2017 AS zweitstimmen_prozent_2017,
       z.anz_2021 AS zweitstimmen_anzahl_2021,
       z.prozent_2021 AS zweitstimmen_prozent_2021,
       z.prozent_2021 - z.prozent_2017 AS unterschied_zweitstimmen
FROM zweitstimmen_vgl z
     FULL OUTER JOIN erststimmen_vgl e
     ON e.partei_kandidatur = z.partei_kandidatur AND z.wahlkreis = e.wahlkreis
     JOIN parteien p ON p.id = COALESCE(COALESCE(e.partei_kandidatur, z.partei_kandidatur));


GRANT SELECT ON alle_ergebnisse TO web_anon;


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

