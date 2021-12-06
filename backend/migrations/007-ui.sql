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
