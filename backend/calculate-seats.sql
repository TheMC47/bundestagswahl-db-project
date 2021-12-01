-- > python manage.py migrate
-- > python manage.py seed
-- > python manage.py run-script calculate-seats.sql
--
REFRESH MATERIALIZED VIEW mindest_sitzkontingente_pro_partei;


CREATE TABLE endgueltige_sitzkontingente
(
    partei INT,
    land   INT,
    sitze  INT,
    PRIMARY KEY (partei, land),
    FOREIGN KEY (land) REFERENCES bundeslaender (id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (partei) REFERENCES parteikandidaturen (id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE sitze_pro_partei
(
    partei INT PRIMARY KEY,
    sitze  INT,
    FOREIGN KEY (partei) REFERENCES parteikandidaturen ON UPDATE CASCADE ON DELETE CASCADE
);


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
    FROM endgueltige_sitze es
             LEFT OUTER JOIN anzahl_direktmandaten_pro_partei_pro_land dir
                             ON es.partei = dir.partei AND es.land = dir.land
);

CREATE OR REPLACE FUNCTION update_sitze(n int)
    RETURNS VOID
AS
$FUNCTION$
BEGIN
    DELETE FROM sitze_pro_partei;
    WITH hochst AS (
        SELECT h.partei, (1.000 * COALESCE(zt.zweitstimmen, 0)) / (s.a - 0.5) AS hochst
        FROM parteien_im_parlament h
                 LEFT OUTER JOIN zweitstimmen_bundesweit zt ON h.partei = zt.partei,
             generate_series(1, n) AS s(a)
        ORDER BY hochst DESC
        LIMIT n
    )
    INSERT
    INTO sitze_pro_partei(partei, sitze)
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
    uberhang   INT;
    sitze_curr INT;
    p          RECORD;
BEGIN
    sitze_curr := 598;
    LOOP
        uberhang := (
            WITH ueberhang_q AS
                     (SELECT GREATEST(mpp.mindessitzanspruch - COALESCE(s.sitze, 0), 0) as u
                      FROM midestsitzanspruch_pro_partei mpp
                               LEFT OUTER JOIN sitze_pro_partei s ON mpp.partei = s.partei)
            SELECT SUM(u)
            FROM ueberhang_q
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

CREATE OR REPLACE FUNCTION update_sitzkontingent(n int, partei_id int)
    RETURNS VOID
AS
$FUNCTION$
BEGIN
    DELETE FROM endgueltige_sitzkontingente WHERE partei = partei_id;
    WITH hochst AS (
        SELECT zt.land                                 AS land,
               (1.000 * zt.zweitstimmen) / (s.a - 0.5) AS hochst
        FROM zweitstimmen_pro_partei_pro_land zt,
             generate_series(1, n) AS s(a)
        WHERE zt.partei = partei_id
        ORDER BY hochst DESC
        LIMIT n
    )
    INSERT
    INTO endgueltige_sitzkontingente (partei, land, sitze)
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
    n      INT;
    curr   INT;
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
                               JOIN mindestsitzzahl_pro_partei_pro_land mind
                                    ON eg.partei = mind.partei AND eg.land = mind.land
                      WHERE mind.partei = partei_id
                     )
            SELECT SUM(anz)
            FROM max_pro_land
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


INSERT INTO bundestagsmandaten(kandidat, partei, bundesland, direktmandat)
WITH
direktkandidaten_mit_mandat(kandidat) AS (
    SELECT k.id
    FROM kandidaten k
             JOIN direktkandidaten dk ON dk.kandidat = k.id
             JOIN direktmandaten dm ON dm.direktkandidat = dk.id
),
ranked_listen_kandidate(partei, kandidat, listennummer, bundesland, rank, mandate) AS (
    SELECT l.partei,
           lk.kandidat,
           lk.listennummer,
           l.bundesland,
           RANK() OVER (PARTITION BY lk.landesliste ORDER BY lk.listennummer) as rank,
           als.anz
    FROM listenkandidaten lk
             JOIN landeslisten l ON lk.landesliste = l.id
             JOIN parteien_im_parlament h ON h.partei = l.partei
             JOIN anzahl_landessitze als ON als.partei = l.partei AND als.land = l.bundesland
    WHERE lk.kandidat NOT IN (SELECT kandidat FROM direktkandidaten_mit_mandat)
)
SELECT kandidat, partei, bundesland, false
FROM ranked_listen_kandidate
WHERE rank <= mandate;

INSERT INTO bundestagsmandaten(kandidat, partei, bundesland, direktmandat)
SELECT dk.kandidat, dm.partei, w.bundesland, true
FROM direktmandaten dm
         JOIN wahlkreise w ON w.id = dm.wahlkreis
         JOIN direktkandidaten dk ON dk.id = dm.direktkandidat;

DROP TABLE endgueltige_sitzkontingente CASCADE;
