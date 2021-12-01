CREATE TABLE bundestagsmandaten
(
    id           SERIAL,
    kandidat     INT  NOT NULL,
    partei       INT,
    bundesland   INT  NOT NULL,
    direktmandat BOOL NOT NULL,
    wahl         INT,
    FOREIGN KEY (bundesland) REFERENCES bundeslaender (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY (kandidat) REFERENCES kandidaten (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY (partei) REFERENCES parteikandidaturen (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY (wahl) REFERENCES wahlen (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- Bestimmung der Direktmandaten
CREATE VIEW erststimmen_pro_direktkandidat
(
    direktkandidat,
    partei,
    wahlkreis,
    erststimmen,
    wahl
)
AS
(
    SELECT e.direktkandidat,
           pk.id,
           dk.wahlkreis,
           e.anzahl_stimmen,
           w.id
    FROM erststimmeergebnisse e
             JOIN direktkandidaten dk ON e.direktkandidat = dk.id
             JOIN parteiKandidaturen pk ON dk.partei = pk.id
             JOIN wahlen w ON pk.wahl = w.id
);

CREATE VIEW direktmandaten(direktkandidat, partei, wahlkreis, wahl) AS
(
    WITH max_pro_wahlkreis(wahlkreis, wahl, max_erststimmen) AS (
        SELECT wahlkreis,
               wahl,
               MAX(erststimmen)
        FROM erststimmen_pro_direktkandidat
        GROUP BY wahlkreis, wahl
    )
    SELECT e1.direktkandidat,
           e1.partei,
           e1.wahlkreis,
           e1.wahl
    FROM erststimmen_pro_direktkandidat e1
             JOIN max_pro_wahlkreis m
                  ON e1.wahlkreis = m.wahlkreis AND e1.wahl = m.wahl
    WHERE e1.erststimmen = m.max_erststimmen
);

CREATE VIEW anzahl_direktmandaten_pro_partei_pro_land(partei, land, wahl, anzahl_direkt) AS
(
    SELECT dm.partei,
           b.id,
           dm.wahl,
           COUNT(*)
    FROM direktmandaten dm
             LEFT OUTER JOIN wahlkreise wk ON wk.id = dm.wahlkreis
             LEFT OUTER JOIN bundeslaender b ON b.id = wk.bundesland
    GROUP BY dm.partei,
             b.id,
             dm.wahl
);

-- Berechnung der Sitzverteilung anhand der Ergebnisse der Zweitstimmen
CREATE VIEW zweitstimmen_pro_partei_pro_land(partei, land, wahl, zweitstimmen) AS
(
    SELECT pk.id,
           wk.bundesland,
           w.id,
           SUM(COALESCE(z.anzahl_stimmen, 0))
    FROM parteiKandidaturen pk
             LEFT OUTER JOIN landeslisten l ON l.partei = pk.id
             LEFT OUTER JOIN zweitstimmeErgebnisse z ON z.landesliste = l.id
             LEFT OUTER JOIN wahlkreise wk ON z.wahlkreis = wk.id
             LEFT OUTER JOIN wahlen w ON pk.wahl = w.id
    GROUP BY pk.id,
             wk.bundesland,
             w.id
);

CREATE VIEW zweitstimmen_bundesweit(partei, wahl, zweitstimmen) AS
(
    SELECT partei,
           wahl,
           SUM(zweitstimmen)
    FROM zweitstimmen_pro_partei_pro_land
    GROUP BY partei, wahl
);


-- fünf-Prozent-Klausel
CREATE VIEW parteien_5_prozent(partei, wahl) AS
(
    WITH total_pro_wahl(wahl, total) AS
    (
        SELECT wahl, SUM(zweitstimmen)
        FROM zweitstimmen_bundesweit
        GROUP BY wahl
    )
    SELECT pk.id, pk.wahl
    FROM parteikandidaturen pk
             JOIN zweitstimmen_bundesweit azbw ON azbw.partei = pk.id
             JOIN total_pro_wahl tot ON tot.wahl = pk.wahl
    WHERE 100 * azbw.zweitstimmen / tot.total >= 5
);

-- Grundmandatsklausel
CREATE VIEW mindestens_3_direktmandaten(partei, wahl) AS
(
    SELECT partei, wahl
    FROM direktmandaten
    GROUP BY partei, wahl
    HAVING COUNT(*) >= 3
);

-- Parteien, die gemäß der 5-%-Hürde im Bundestag vertreten dürfen
CREATE VIEW parteien_im_parlament(partei, wahl) AS
(
    SELECT *
    FROM mindestens_3_direktmandaten

    UNION

    SELECT *
    FROM parteien_5_prozent

    UNION

    SELECT pk.id, w.id
    FROM parteikandidaturen pk
             JOIN minderheitsparteien mp ON mp.id = pk.partei,
        wahlen w
);

-- Berechnung der Sitzverteilung nach dem höchstzahlverfahren
CREATE MATERIALIZED VIEW mindest_sitzkontingente_pro_partei(partei, land, wahl, sitzkontingente) AS
(
    WITH hochst_all(land, wahl, rank) AS (
        SELECT bl.id                                    AS land,
               bv.wahl                                  AS wahl,
               RANK() OVER (
                   PARTITION BY bv.wahl
                   ORDER BY
                       (bv.anzahl_bewohner * 1.000) / (a - 0.5)
                       DESC
               )
        FROM bevoelkerung bv
                 JOIN bundeslaender bl ON bl.id = bv.id,
             generate_series(1, 598) AS s(a)
    ),
    sitzkontigente_pro_land(land, wahl, sitzkontigente) AS (
        SELECT land,
               wahl,
               COUNT(*)
        FROM hochst_all
        WHERE rank <= 598
        GROUP BY land, wahl
    ),
    parteisitze_hochst (partei, land, wahl, rank) AS (
        SELECT z.partei,
               z.land,
               z.wahl,
               RANK() OVER(
                   PARTITION BY z.land, z.wahl
                    ORDER BY
                      (z.zweitstimmen * 1.000) / (s.a - 0.5)
                    DESC
               )
        FROM parteien_im_parlament pip
                 JOIN zweitstimmen_pro_partei_pro_land z
                      ON pip.partei = z.partei AND pip.wahl = z.wahl
                 JOIN (
            SELECT sl.land,
                   sl.wahl,
                   generate_series(1, sl.sitzkontigente) AS a
            FROM sitzkontigente_pro_land sl
        ) s ON s.land = z.land AND s.wahl = z.wahl
    )
    SELECT ps.partei,
           ps.land,
           ps.wahl,
           COUNT(*)
    FROM parteisitze_hochst ps
             JOIN sitzkontigente_pro_land sk
                  ON sk.land = ps.land AND sk.wahl = ps.wahl
    WHERE rank <= sk.sitzkontigente
    GROUP BY ps.land,
             ps.wahl,
             ps.partei
);

CREATE VIEW mindestsitzzahl_pro_partei_pro_land(partei, land, wahl, mindestsitzzahl, ueberhang) AS
(
    SELECT sk.partei,
           sk.land,
           sk.wahl,
           CASE
                WHEN sk.wahl = 1 THEN --2021
                    GREATEST(dk.anzahl_direkt,
                             round((1.00 * sk.sitzkontingente + COALESCE(dk.anzahl_direkt, 0)) / 2)
                             )
                ELSE --2017
                    GREATEST(dk.anzahl_direkt, sk.sitzkontingente)
           END,
           GREATEST(COALESCE(dk.anzahl_direkt, 0) - COALESCE(sk.sitzkontingente, 0), 0)
    FROM mindest_sitzkontingente_pro_partei sk
         LEFT OUTER JOIN anzahl_direktmandaten_pro_partei_pro_land dk
              ON sk.partei = dk.partei AND sk.land = dk.land AND dk.wahl = sk.wahl
);

CREATE VIEW midestsitzanspruch_pro_partei(partei, wahl, mindessitzanspruch, ueberhang) AS
(
    SELECT sz.partei,
           sz.wahl,
           COALESCE(
                   GREATEST(SUM(sz.mindestsitzzahl), SUM(sk.sitzkontingente)),
                   0
               ),
           SUM(sz.ueberhang)
    FROM mindestsitzzahl_pro_partei_pro_land sz
             LEFT OUTER JOIN mindest_sitzkontingente_pro_partei sk ON sz.land = sk.land
        AND sz.partei = sk.partei AND sz.wahl = sk.wahl
    GROUP BY sz.partei, sz.wahl
);
