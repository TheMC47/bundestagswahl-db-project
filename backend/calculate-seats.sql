-- Bestimmung der Direktmandaten
CREATE VIEW erststimmen_pro_direktkandidat
            (
             direktkandidat,
             partei,
             wahlkreis,
             erststimmen
                ) AS
(
SELECT e.direktkandidat,
       pk.id,
       dk.wahlkreis,
       e.anzahl_stimmen
FROM erststimmeergebnisse e
         JOIN direktkandidaten dk ON e.direktkandidat = dk.id
         JOIN parteiKandidaturen pk ON dk.partei = pk.id
         JOIN wahlen w ON pk.wahl = w.id
WHERE w.id = 1
    );

CREATE VIEW direktmandaten(direktkandidat, partei, wahlkreis) AS
(
WITH max_pro_wahlkreis(wahlkreis, max_erststimmen) AS (
    SELECT wahlkreis,
           MAX(erststimmen)
    FROM erststimmen_pro_direktkandidat
    GROUP BY wahlkreis
)
SELECT e1.direktkandidat,
       e1.partei,
       e1.wahlkreis
FROM erststimmen_pro_direktkandidat e1
         JOIN max_pro_wahlkreis m ON e1.wahlkreis = m.wahlkreis
WHERE e1.erststimmen = m.max_erststimmen
    );

CREATE VIEW direkmandaten_pro_partei(kandidat, partei) AS
(
SELECT k.id, dk.partei
FROM kandidaten k
         JOIN direktkandidaten dk ON dk.kandidat = k.id
         JOIN direktmandaten dm ON dm.direktkandidat = dk.id
    );

-- Berechnung der Sitzverteilung anhand der Ergebnisse der Zweitstimmen
CREATE VIEW zweitstimmen_pro_partei_pro_land(partei, land, zweitstimmen) AS
(
SELECT pk.id,
       wk.bundesland,
       SUM(COALESCE(z.zweitstimmen, 0))
FROM parteiKandidaturen pk
         LEFT OUTER JOIN landeslisten l ON l.partei = pk.id
         LEFT OUTER JOIN zweitstimmeErgebnisse z ON z.landesliste = l.id
         LEFT OUTER JOIN wahlkreise wk ON z.wahlkreis = wk.id
         LEFT OUTER JOIN wahlen w ON pk.wahl = w.id
WHERE w.id = 1 -- FIXME
GROUP BY pk.id,
         wk.bundesland
    );

CREATE VIEW zweitstimmen_bundesweit(partei, zweitstimmen) AS
(
SELECT partei,
       SUM(zweitstimmen)
FROM zweitstimmen_pro_partei_pro_land -- FIXME pro wahl
GROUP BY partei
    );

-- fünf-Prozent-Klausel
CREATE VIEW parteien_5_prozent(partei) AS
(
SELECT pk.id
FROM parteikandidaturen pk
         JOIN zweitstimmen_bundesweit azbw ON azbw.partei = pk.id
WHERE 100 * azbw.zweitstimmen / (
    SELECT SUM(zweitstimmen)
    FROM zweitstimmen_bundesweit
) >= 5
    );

-- Grundmandatsklausel
CREATE VIEW mindestens_3_direktmandaten(partei) AS
(
SELECT partei
FROM direktmandaten
GROUP BY partei
HAVING COUNT(*) >= 3
    );

-- Parteien, die gemäß der 5-%-Hürde im Bundestag vertreten dürfen
CREATE VIEW parteien_im_parlament(partei) AS
(
SELECT *
FROM mindestens_3_direktmandaten

UNION

SELECT *
FROM parteien_5prozent

UNION

SELECT pk.id
FROM parteikandidaturen pk
         JOIN minderheitsparteien mp ON mp.id = pk.partei
    );

-- Berechnung der Sitzverteilung nach dem höchstzahlverfahren
CREATE VIEW mindest_sitzkontingente_pro_partei(partei, land, sitzkontingente) AS
(
WITH hochst_all(land, hochst) AS (
    SELECT bl.id AS land,
           (bv.anzahl_bewohner * 1.000) / (a - 0.5) AS hochst
    FROM bevoelkerung bv
             JOIN bundeslaender bl ON bl.id = bv.id
             JOIN wahlen w ON w.id = bv.wahl,
         generate_series(1, 598) AS s(a)
    WHERE w.id = 1
    ORDER BY hochst DESC
    LIMIT 598
),
     sitzkontigente_pro_land(land, sitzkontigente) AS (
         SELECT
             land,
             COUNT (*)
         FROM
             hochst_all
         GROUP BY
             land
     ),
     parteisitze_hochst (partei, land, hochst) AS (
         SELECT
             z.partei,
             z.land,
             (z.zweitstimmen * 1.000) / (s.a - 0.5) AS hochst
         FROM
             parteien_im_parlament h
                 LEFT OUTER JOIN zweitstimmen_pro_partei_pro_land z ON h.partei = z.partei
                 JOIN (
                 SELECT
                     sl.land,
                     generate_series(1, sl.sitzkontigente) AS a
                 FROM
                     sitzkontigente_pro_land sl
             ) s ON s.land = z.land
     ),
     parteirank_pro_land (partei, land, rank) AS (
         SELECT
             ph.partei,
             ph.land,
             RANK() OVER (
                 PARTITION BY ph.land
                 ORDER BY
                     ph.hochst DESC
                 )
         FROM
             parteisitze_hochst ph
     )
SELECT rk.partei,
       rk.land,
       COUNT(*)
FROM parteirank_pro_land rk
         JOIN sitzkontigente_pro_land sl ON rk.land = sl.land
WHERE rank <= sl.sitzkontigente
GROUP BY rk.land,
         rk.partei
    );

CREATE VIEW anzahl_direktmandaten_pro_partei_pro_land(partei, land, anzahl_direkt) AS
(
SELECT dm.partei,
       b.id,
       COUNT(*)
FROM direktmandaten dm
         LEFT OUTER JOIN wahlkreise wk ON wk.id = dm.wahlkreis
         LEFT OUTER JOIN bundeslaender b ON b.id = wk.bundesland
GROUP BY dm.partei,
         b.id
    );

CREATE MATERIALIZED VIEW mindestsitzzahl_pro_partei_pro_land(partei, land, mindestsitzzahl, ueberhang) AS
(
SELECT sk.partei,
       sk.land,
       GREATEST(dk.anzahl_direkt,
                round((1.00 * sk.sitzkontingente + COALESCE(dk.anzahl_direkt, 0)) / 2)
           ),
       GREATEST(COALESCE(dk.anzahl_direkt, 0) - COALESCE(sk.sitzkontingente, 0), 0)
FROM mindest_sitzkontingente_pro_partei sk
         LEFT OUTER JOIN anzahl_direktmandaten_pro_partei_pro_land dk
                         ON sk.partei = dk.partei AND sk.land = dk.land
    );

CREATE MATERIALIZED VIEW midestsitzanspruch_pro_partei(partei, mindessitzanspruch, ueberhang) AS
(
SELECT sz.partei,
       COALESCE(
               GREATEST(SUM(sz.mindestsitzzahl), SUM(sk.sitzkontingente)),
               0
           ),
       SUM(sz.ueberhang)
FROM mindestsitzzahl_pro_partei_pro_land sz
         LEFT OUTER JOIN mindest_sitzkontingente_pro_partei sk ON sz.land = sk.land
    AND sz.partei = sk.partei
GROUP BY sz.partei
    );

-- Berechnung der Anzahl der Sitze im Bundestag pro Partei
CREATE TABLE parteien_im_parlament
(
    partei INT PRIMARY KEY,
    sitze  INT,
    FOREIGN KEY (partei) REFERENCES parteikandidaturen ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION update_sitze(n int)
    RETURNS VOID
AS
$FUNCTION$
BEGIN
    DELETE FROM sitze_pro_partei;
    WITH hochst AS (
        SELECT h.partei, (1.000 * COALESCE(zt.zweitstimmen, 0)) / (s.a - 0.5) AS hochst
        FROM
            parteien_im_parlament h
                LEFT OUTER JOIN zweitstimmen_bundesweit zt ON h.partei = zt.partei,
            generate_series(1, n) AS s(a)
        ORDER BY hochst DESC
        LIMIT n
    )
    INSERT INTO sitze_pro_partei(partei, sitze)
    SELECT partei, COUNT(*) AS sitze
    FROM hochst
    GROUP BY partei;
END
$FUNCTION$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION distribute_sitze()
    RETURNS VOID
AS
$FUNCTION$
DECLARE
    uberhang INT;
    sitze_curr INT;
    p RECORD;
BEGIN
    sitze_curr := 598;
    LOOP
        uberhang := (
            WITH ueberhang_q AS
                     (SELECT GREATEST(mpp.mindessitzanspruch - COALESCE(s.sitze, 0), 0) as u
                      FROM midestsitzanspruch_pro_partei mpp
                               LEFT OUTER JOIN sitze_pro_partei s ON mpp.partei = s.partei)
            SELECT SUM(u) FROM ueberhang_q
        );
        IF uberhang > 3
        THEN
            sitze_curr := sitze_curr + 1;
            PERFORM update_sitze(sitze_curr);
        ELSE
            -- Update nicht ausgeglichene Überhangsmandate
            FOR p IN SELECT mpp.mindessitzanspruch - s.sitze as u,
                            s.partei
                     FROM sitze_pro_partei s
                              JOIN midestsitzanspruch_pro_partei mpp ON mpp.partei = s.partei
                     WHERE mpp.mindessitzanspruch - s.sitze > 0
                LOOP
                    UPDATE sitze_pro_partei SET sitze = sitze + p.u WHERE partei = p.partei;
                END LOOP;
            RETURN;
        END IF;
    END LOOP;
END;
$FUNCTION$ LANGUAGE plpgsql;

CREATE TABLE endgueltige_sitzkontingente
(
    partei INT,
    land   INT,
    sitze  INT,
    PRIMARY KEY(partei, land),
    FOREIGN KEY(land) REFERENCES bundeslaender(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY(partei) REFERENCES parteikandidaturen(id) ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE OR REPLACE FUNCTION update_sitzkontingent(n int, partei_id int)
    RETURNS VOID
AS
$FUNCTION$
BEGIN
    DELETE FROM endgueltige_sitzkontingente WHERE partei = partei_id;
    WITH hochst AS (
        SELECT zt.land AS land,
               (1.000 * zt.zweitstimmen) / (s.a - 0.5) AS hochst
        FROM
            zweitstimmen_pro_partei_pro_land zt,
            generate_series(1, n) AS s(a)
        WHERE zt.partei = partei_id
        ORDER BY hochst DESC
        LIMIT n
    )
    INSERT INTO endgueltige_sitzkontingente (partei, land, sitze)
    SELECT partei_id, land, COUNT(*) AS sitze
    FROM hochst
    GROUP BY land;
END
$FUNCTION$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_endgueltige_sitzkontingente(partei_id int)
    RETURNS VOID
AS
$FUNCTION$
DECLARE
    n INT;
    curr INT;
    target INT;
BEGIN
    target := (SELECT sitze FROM sitze_pro_partei WHERE partei = partei_id);
    n := target;
    LOOP
        PERFORM update_sitzkontingent(n, partei_id);
        curr := (
            WITH max_pro_land(land, anz) AS
                     (SELECT mind.land, GREATEST(eg.sitze, mind.mindestsitzzahl)
                      FROM endgueltige_sitzkontingente eg
                               JOIN mindestsitzzahl_pro_partei_pro_land mind ON eg.partei = mind.partei AND eg.land = mind.land
                      WHERE mind.partei = partei_id
                     )
            SELECT SUM(anz) FROM max_pro_land
        );
        IF curr > target
        THEN
            n := n - 1;
        ELSIF curr < target
        THEN
            n := n + 1;
        ELSE
            RETURN;
        END IF;
    END LOOP;
END;
$FUNCTION$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_endgueltige_sitzkontingente_all()
    RETURNS VOID
AS
$FUNCTION$
DECLARE
    p RECORD;
BEGIN
    FOR p IN SELECT * FROM parteien_im_parlament
        LOOP
            PERFORM calculate_endgueltige_sitzkontingente(p.partei);
        END LOOP;
END;
$FUNCTION$ LANGUAGE plpgsql;

DO
$$
    BEGIN
        PERFORM distribute_sitze();
        PERFORM calculate_endgueltige_sitzkontingente_all();
    END;
$$;

CREATE VIEW endgueltige_sitze(partei, land, anz) AS
(
SELECT mind.partei,
       mind.land,
       GREATEST(eg.sitze, mind.mindestsitzzahl)
FROM endgueltige_sitzkontingente eg
         JOIN mindestsitzzahl_pro_partei_pro_land mind
              ON eg.partei = mind.partei AND eg.land = mind.land
    );

CREATE VIEW anzahl_landessitze(partei, land, anz) AS
(
SELECT es.partei, es.land, GREATEST(es.anz - COALESCE(dir.anzahl_direkt, 0), 0)
FROM
    endgueltige_sitze es
        LEFT OUTER JOIN anzahl_direktmandaten_pro_partei_pro_land dir
                        ON es.partei = dir.partei AND es.land = dir.land
    );

CREATE TABLE bundestagsmandaten(
                                   id SERIAL,
                                   kandidat INT NOT NULL,
                                   partei INT,
                                   bundesland INT NOT NULL,
                                   direktmandat BOOL NOT NULL,
                                   FOREIGN KEY (bundesland) REFERENCES bundeslaender(id)
                                       ON UPDATE CASCADE
                                       ON DELETE CASCADE,
                                   FOREIGN KEY (kandidat) REFERENCES kandidaten(id)
                                       ON UPDATE CASCADE
                                       ON DELETE CASCADE,
                                   FOREIGN KEY (partei) REFERENCES parteikandidaturen(id)
                                       ON UPDATE CASCADE
                                       ON DELETE CASCADE
);

INSERT INTO bundestagsmandaten(kandidat, partei, bundesland, direktmandat)
WITH ranked_listen_kandidate(partei, kandidat, listennummer, bundesland, rank, mandate) AS (
    SELECT l.partei,
           lk.kandidat,
           lk.listennummer,
           l.bundesland,
           RANK() OVER (PARTITION BY lk.landesliste ORDER BY lk.listennummer) as rank,
           als.anz
    FROM listenkandidaten lk
             JOIN landeslisten l ON lk.landesliste = l.id
             JOIN parteien_im_parlament h ON h.partei = l.partei
             JOIN anzahl_landessitze als ON als.partei = l.partei AND als.land=l.bundesland
    WHERE lk.kandidat NOT IN (SELECT kandidat FROM direkmandaten_pro_partei)
)
SELECT kandidat, partei, bundesland, false
FROM ranked_listen_kandidate
WHERE rank <= mandate;

INSERT INTO bundestagsmandaten(kandidat, partei, bundesland, direktmandat)
SELECT dk.kandidat, dm.partei, w.bundesland, true
FROM direktmandaten dm
         JOIN wahlkreise w ON w.id = dm.wahlkreis
         JOIN direktkandidaten dk ON dk.id = dm.direktkandidat;
