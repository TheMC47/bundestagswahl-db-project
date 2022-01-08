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

UPDATE wahlkreiswahldaten wk
SET waehlende = (SELECT COUNT(*) FROM waehler WHERE hat_abgestimmt = TRUE AND wahlkreis = wk.id),
    ungueltig_erste_stimme = (SELECT COUNT(*) FROM erststimmen WHERE direktkandidat IS NULL AND wahlkreis = wk.id),
    ungueltig_zweite_stimme = (SELECT COUNT(*) FROM zweitstimmen WHERE landesliste IS NULL AND wahlkreis = wk.id)
WHERE wahl = 1;


ALTER TABLE erststimmeErgebnisse ENABLE TRIGGER ALL;
ALTER TABLE zweitstimmeErgebnisse ENABLE TRIGGER ALL;
ALTER TABLE wahlkreiswahldaten ENABLE TRIGGER ALL;
