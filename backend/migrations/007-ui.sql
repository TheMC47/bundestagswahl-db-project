-- Q1
CREATE VIEW sitze_pro_partei_full(kurzbezeichnung, sitze, wahl) AS
SELECT p.kurzbezeichnung, sp.sitze, sp.wahl
FROM sitze_pro_partei sp
  JOIN parteikandidaturen pk ON pk.id = sp.partei
  JOIN parteien p ON p.id = pk.partei;

GRANT SELECT ON sitze_pro_partei_full TO web_anon;

-- Q2
