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

-- Q6
CREATE VIEW knappste_sieger(wahl, direktkandidat, wahlkreis, partei, rank, sieger) AS
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
           rk.anzahl_stimmen - COALESCE(LAG(rk.anzahl_stimmen)
                                        OVER ( PARTITION BY rk.wahl, rk.wahlkreis ORDER BY rk.anzahl_stimmen DESC ),
                                        0) AS vorsprung
    FROM rank_pro_wahlkreis rk
    WHERE rk.Rank <= 2
)
   , top_knappste_Siege(wahl, direktkandidat, wahlkreis, partei, rank) AS (
    SELECT rp.wahl, rp.direktkandidat, rp.wahlkreis, rp.partei, rp.rank_vorsprung
    FROM (
             SELECT vk.wahl,
                    vk.direktkandidat,
                    vk.wahlkreis,
                    vk.partei,
                    RANK() OVER (PARTITION BY vk.wahl, vk.partei ORDER BY vk.vorsprung) AS rank_vorsprung
             FROM vorsprung_sieger_kandidaten vk
             WHERE vk.rank = 1) rp
    WHERE rp.rank_vorsprung <= 10
)
   , vorsprung_besiegte_kandidaten (wahl, direktKandidat, wahlkreis, partei, vorsprung) AS (
    SELECT rk.wahl,
           rk.direktKandidat,
           rk.wahlkreis,
           rk.partei,
           (MAX(rk.anzahl_stimmen) OVER ( PARTITION BY rk.wahl, rk.wahlkreis ORDER BY rk.anzahl_stimmen DESC )) - rk.anzahl_stimmen AS vorsprung
    FROM rank_pro_wahlkreis rk
)
   , knappste_besiegte_kandidaten (wahl, direktKandidat, wahlkreis, partei, rank) AS (
    SELECT rk.wahl,
           rk.direktKandidat,
           rk.wahlkreis,
           rk.partei,
           rk.rank
    FROM (
             SELECT  vk.*,   RANK () OVER ( PARTITION BY vk.wahl, vk.partei ORDER BY vk.vorsprung) AS rank
             FROM vorsprung_besiegte_kandidaten vk LEFT OUTER JOIN top_knappste_Siege ts ON vk.partei = ts.partei and vk.wahl = ts.wahl ) rk
    WHERE rk.rank <= 10
)
SELECT ts.wahl,
       ts.direktkandidat,
       ts.wahlkreis,
       ts.partei,
       ts.rank, true
FROM top_knappste_Siege ts
UNION
SELECT kb.wahl, kb.direktkandidat, kb.wahlkreis, kb.partei, kb.rank, false
FROM knappste_besiegte_kandidaten kb

    );
GRANT SELECT ON knappste_sieger TO web_anon;













