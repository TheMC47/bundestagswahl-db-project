CREATE VIEW zweitstimmen_pro_partei(partei, land, anzahl_stimmen) AS (
  SELECT
    pk.id,
    wk.bundesland,
    SUM (COALESCE(z.anzahl_stimmen, 0))
  FROM
    parteiKandidaturen pk
    LEFT OUTER JOIN landeslisten l ON l.partei = pk.id
    LEFT OUTER JOIN zweitstimmeErgebnisse z ON z.landesliste = l.id
    LEFT OUTER JOIN wahlkreise wk ON z.wahlkreis = wk.id
    LEFT OUTER JOIN wahlen w ON pk.wahl = w.id
  WHERE
    w.id = 1 -- FIXME
  GROUP BY
    pk.id,
    wk.bundesland
);
CREATE VIEW anz_zweitstimmen_bundesweit(partei, anz) AS (
  SELECT
    partei,
    SUM(anzahl_stimmen)
  FROM
    zweitstimmen_pro_partei -- FIXME pro wahl
  GROUP BY
    partei
);
CREATE VIEW parteien_5prozent(partei) AS (
  SELECT
    pk.id
  FROM
    parteikandidaturen pk
    JOIN anz_zweitstimmen_bundesweit azbw ON azbw.partei = pk.id
  WHERE
    100 * azbw.anz / (
      SELECT
        SUM(anz)
      FROM
        anz_zweitstimmen_bundesweit
    ) >= 5
);
CREATE VIEW erststimmen_pro_direktkandidat (
  direktkandidat,
  partei,
  wahlkreis,
  anzahl_stimmen
) AS (
  SELECT
    e.direktkandidat,
    pk.id,
    dk.wahlkreis,
    e.anzahl_stimmen
  FROM
    erststimmeergebnisse e
    JOIN direktkandidaten dk ON e.direktkandidat = dk.id
    JOIN parteiKandidaturen pk ON dk.partei = pk.id
    JOIN wahlen w ON pk.wahl = w.id
  WHERE
    w.id = 1
);
CREATE VIEW direktmandaten(direktkandidat, partei, wahlkreis) AS (
  WITH max_pro_wahlkreis(wahlkreis, anz) AS (
    SELECT
      wahlkreis,
      MAX (anzahl_stimmen)
    FROM
      erststimmen_pro_direktkandidat
    GROUP BY
      wahlkreis
  )
  SELECT
    e1.direktkandidat,
    e1.partei,
    e1.wahlkreis
  FROM
    erststimmen_pro_direktkandidat e1
    JOIN max_pro_wahlkreis m ON e1.wahlkreis = m.wahlkreis
  WHERE
    e1.anzahl_stimmen = m.anz
);
CREATE VIEW mindestens_3_direktmandaten(partei) AS (
  SELECT
    partei
  FROM
    direktmandaten
  GROUP BY
    partei
  HAVING
    COUNT(*) >= 3
);
CREATE VIEW parteien_ohne_huerde(partei) AS (
  SELECT
    *
  FROM
    mindestens_3_direktmandaten
  UNION
  SELECT
    *
  FROM
    parteien_5prozent
  UNION
  SELECT
    pk.id
  FROM
    parteikandidaturen pk
    JOIN minderheitsparteien mp ON mp.id = pk.partei
);
CREATE VIEW mindest_landessitze_pro_partei(partei, land, anzahl_sitze) AS (
  WITH hochst_all(land, hochst) AS (
    SELECT
      bl.id AS land,
      (bv.anzahl_bewohner * 1.000) / (a - 0.5) AS hochst
    FROM
      bevoelkerung bv
      JOIN bundeslaender bl ON bl.id = bv.id
      JOIN wahlen w ON w.id = bv.wahl,
      generate_series(1, 598) AS s(a)
    WHERE
      w.id = 1
    ORDER BY
      hochst DESC
    LIMIT
      598
  ), sitzkontigente_pro_land(land, sitzkontigente) AS (
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
      (z.anzahl_stimmen * 1.000) / (s.a - 0.5) AS hochst
    FROM
      parteien_ohne_huerde h
      LEFT OUTER JOIN zweitstimmen_pro_partei z ON h.partei = z.partei
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
  SELECT
    rk.partei,
    rk.land,
    COUNT (*)
  FROM
    parteirank_pro_land rk
    JOIN sitzkontigente_pro_land sl ON rk.land = sl.land
  WHERE
    rank <= sl.sitzkontigente
  GROUP BY
    rk.land,
    rk.partei
);
CREATE VIEW anzahl_direktmandaten_pro_partei_pro_land(partei, land, anzahl_direkt) AS (
  SELECT
    dm.partei,
    b.id,
    COUNT(*)
  FROM
    direktmandaten dm
    LEFT OUTER JOIN wahlkreise wk ON wk.id = dm.wahlkreis
    LEFT OUTER JOIN bundeslaender b ON b.id = wk.bundesland
  GROUP BY
    dm.partei,
    b.id
);
