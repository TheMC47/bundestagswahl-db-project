CREATE TABLE bundestagsmandaten
(
    id           SERIAL,
    kandidat     INT  NOT NULL,
    partei       INT,
    bundesland   INT  NOT NULL,
    direktmandat BOOL NOT NULL,
    FOREIGN KEY (bundesland) REFERENCES bundeslaender (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY (kandidat) REFERENCES kandidaten (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY (partei) REFERENCES parteikandidaturen (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- Bestimmung der Direktmandaten
CREATE VIEW erststimmen_pro_direktkandidat
(
    direktkandidat,
    partei,
    wahlkreis,
    erststimmen
)
AS
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


-- Berechnung der Sitzverteilung anhand der Ergebnisse der Zweitstimmen
CREATE VIEW zweitstimmen_pro_partei_pro_land(partei, land, zweitstimmen) AS
(
    SELECT pk.id,
           wk.bundesland,
           SUM(COALESCE(z.anzahl_stimmen, 0))
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
    FROM parteien_5_prozent

    UNION

    SELECT pk.id
    FROM parteikandidaturen pk
             JOIN minderheitsparteien mp ON mp.id = pk.partei
);

-- Berechnung der Sitzverteilung nach dem höchstzahlverfahren
CREATE MATERIALIZED VIEW mindest_sitzkontingente_pro_partei(partei, land, sitzkontingente) AS
(
    WITH hochst_all(land, hochst) AS (
        SELECT bl.id                                    AS land,
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
        SELECT land,
               COUNT(*)
        FROM hochst_all
        GROUP BY land
    ),
    parteisitze_hochst (partei, land, hochst) AS (
        SELECT z.partei,
               z.land,
               (z.zweitstimmen * 1.000) / (s.a - 0.5) AS hochst
        FROM parteien_im_parlament h
                 LEFT OUTER JOIN zweitstimmen_pro_partei_pro_land z ON h.partei = z.partei
                 JOIN (
            SELECT sl.land,
                   generate_series(1, sl.sitzkontigente) AS a
            FROM sitzkontigente_pro_land sl
        ) s ON s.land = z.land
    ),
    parteirank_pro_land (partei, land, rank) AS (
        SELECT ph.partei,
               ph.land,
               RANK() OVER (
                   PARTITION BY ph.land
                   ORDER BY
                       ph.hochst DESC
                   )
        FROM parteisitze_hochst ph
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

CREATE VIEW mindestsitzzahl_pro_partei_pro_land(partei, land, mindestsitzzahl, ueberhang) AS
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

CREATE VIEW midestsitzanspruch_pro_partei(partei, mindessitzanspruch, ueberhang) AS
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
