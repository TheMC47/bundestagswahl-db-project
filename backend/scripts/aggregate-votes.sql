ALTER TABLE erststimmeErgebnisse DISABLE TRIGGER ALL;
ALTER TABLE zweitstimmeErgebnisse DISABLE TRIGGER ALL;
ALTER TABLE wahlkreiswahldaten DISABLE TRIGGER ALL;

DELETE FROM erststimmeErgebnisse ee
WHERE EXISTS (
      SELECT *
      FROM direktkandidaten dk
         JOIN parteikandidaturen pk
         ON dk.partei = pk.id
      WHERE ee.direktkandidat = dk.id AND pk.wahl = 1
);

INSERT INTO erststimmeErgebnisse (direktkandidat, anzahl_stimmen)
SELECT direktkandidat, COUNT(*)
FROM erststimmen
WHERE direktkandidat IS NOT NULL
GROUP BY direktkandidat;

DELETE FROM zweitstimmeErgebnisse ze
WHERE EXISTS (
      SELECT *
      FROM landeslisten ll
         JOIN parteikandidaturen pk
         ON ll.partei = pk.id
      WHERE ze.landesliste = ll.id AND pk.wahl = 1
);

INSERT INTO zweitstimmeErgebnisse(landesliste, anzahl_stimmen, wahlkreis)
SELECT landesliste, COUNT(*), wahlkreis
FROM zweitstimmen
WHERE landesliste IS NOT NULL
GROUP BY landesliste, wahlkreis;

WITH waehlende_agg(anzahl, wahlkreis)
AS (
   SELECT COUNT(w), wk.id
   FROM wahlkreise wk
        LEFT OUTER JOIN waehler w ON wk.id = w.wahlkreis AND w.hat_abgestimmt = TRUE
   GROUP BY wk.id
),
ungueltig_erste_stimme_agg(anzahl, wahlkreis)
AS (
   SELECT COUNT(e), wk.id
   FROM wahlkreise wk
        LEFT OUTER JOIN erststimmen e ON wk.id = e.wahlkreis AND e.direktkandidat IS NULL
   GROUP BY wk.id
),
ungueltig_zweite_stimme_agg(anzahl, wahlkreis)
AS (
   SELECT COUNT(z), wk.id
   FROM wahlkreise wk
        LEFT OUTER JOIN zweitstimmen z ON wk.id = z.wahlkreis AND z.landesliste IS NULL
   GROUP BY wk.id
)
UPDATE wahlkreiswahldaten wk
SET waehlende = (SELECT anzahl FROM waehlende_agg WHERE wahlkreis = wk.id),
    ungueltig_erste_stimme = (SELECT anzahl FROM ungueltig_erste_stimme_agg WHERE wahlkreis = wk.id),
    ungueltig_zweite_stimme = (SELECT anzahl FROM ungueltig_zweite_stimme_agg WHERE wahlkreis = wk.id)
WHERE wahl = 1;


ALTER TABLE erststimmeErgebnisse ENABLE TRIGGER ALL;
ALTER TABLE zweitstimmeErgebnisse ENABLE TRIGGER ALL;
ALTER TABLE wahlkreiswahldaten ENABLE TRIGGER ALL;
