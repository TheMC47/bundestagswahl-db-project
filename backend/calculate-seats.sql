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
    )
   , sitzkontigente_pro_land(land
   , sitzkontigente) AS (
SELECT land, COUNT (*)
FROM hochst_all
GROUP BY land
    )
        , zweitstimme_pro_partei(partei, land
        , anzahl_stimmen) AS (
SELECT z.landesliste, wk.bundesland, SUM (z.anzahl_stimmen)
FROM zweitstimmeErgebnisse z JOIN wahlkreise wk
ON z.wahlkreis = wk.id JOIN landeslisten l on z.landesliste = l.id JOIN parteiKandidaturen pk on l.partei = pk.id JOIN wahlen w ON pk.wahl = w.id
where w.id = 1
group by z.landesliste, wk.bundesland
    ),
    parteisitze_hochst (landesliste, land, hochst) AS (
select  z.partei, z.land, (z.anzahl_stimmen * 1.000) / (s.a - 0.5) AS hochst
from zweitstimme_pro_partei z,
    (select sl.land, generate_series(1, sl.sitzkontigente) as a
    FROM sitzkontigente_pro_land sl
    ) s
where s.land = z.land
    )
    , parteirank_pro_land (landesliste
    , land
    , rank) As (
select ph.landesliste, ph.land, rank() over ( partition by ph.land order by ph.hochst DESC)
from parteisitze_hochst ph
    ), parteisitze_pro_land (landesliste, land, sitze) As (
select rk.landesliste, rk.land, count (*)
from parteirank_pro_land rk join sitzkontigente_pro_land sl
on rk.land = sl.land
where rank <= sl.sitzkontigente
group by rk.land, rk.landesliste
    )
SELECT *
FROM parteisitze_pro_land
;