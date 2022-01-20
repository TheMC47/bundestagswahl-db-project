CREATE ROLE voter;
GRANT voter TO authenticator;

CREATE TABLE wahlkreishelfer
(
  kennung   uuid DEFAULT uuid_generate_v4(),
  nachname  VARCHAR NOT NULL,
  vornamen  VARCHAR NOT NULL,
  wahlkreis INT NOT NULL,
  PRIMARY KEY (kennung),
  FOREIGN KEY (wahlkreis) REFERENCES wahlkreise (id) ON
       UPDATE CASCADE ON
       DELETE CASCADE
);

CREATE TABLE wahlkreis_keys
(
  id        uuid DEFAULT uuid_generate_v4(),
  wahlkreis INT NOT NULL,
  aktiviert uuid,
  PRIMARY KEY (id),
  FOREIGN KEY (aktiviert) REFERENCES wahlkreishelfer (kennung),
  FOREIGN KEY (wahlkreis) REFERENCES wahlkreise (id) ON
       UPDATE CASCADE ON
       DELETE CASCADE
);

CREATE TYPE jwt_token AS (
  token text
);

CREATE OR REPLACE FUNCTION helfer_login(key text, helfer text) RETURNS jwt_token AS $$
  DECLARE
    _token jwt_token;
    _helfer wahlkreishelfer;
    _key wahlkreis_keys;
  BEGIN
    SELECT * FROM wahlkreishelfer WHERE kennung::text = helfer INTO _helfer;
    IF _helfer IS NULL THEN
      RAISE invalid_password USING message = 'Helferkennung ungültig';
    END IF;

    SELECT * FROM wahlkreis_keys WHERE id::text = key AND wahlkreis = _helfer.wahlkreis
      INTO _key;
    IF _key IS NULL THEN
      RAISE invalid_password USING message = 'Schlüssel ungültig';
    END IF;
    IF _key.aktiviert IS NOT NULL THEN
      RAISE invalid_password USING message = 'Schlüssel schon aktiviert';
    END IF;

    UPDATE wahlkreis_keys SET aktiviert = _helfer.kennung
    WHERE id = _key.id;

    SELECT sign(
      row_to_json(r), current_setting('pgrst.jwt_secret')
    ) AS token
    FROM (
      SELECT
        'voter'::text as role,
        extract(epoch from now())::integer + 60*5*12*2 AS exp,
        _helfer.wahlkreis AS wahlkreis
    ) r
    INTO _token;
    RETURN _token;
  END
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION vote(direktkandidat int, landesliste int, waehlerSchlussel text) RETURNS VOID AS $$
  DECLARE
    _waehler waehler;
    _wahlkreis int;
    _direktkandidat direktkandidaten;
    _landesliste landeslisten;
  BEGIN
  SELECT current_setting('request.jwt.claim.wahlkreis', true) INTO _wahlkreis;

  SELECT *
  FROM waehler
  WHERE hat_abgestimmt = FALSE AND
        wahlkreis = _wahlkreis AND
        id::text = waehlerSchlussel AND
        wahl = 1
  INTO _waehler;

  IF _waehler IS NULL THEN
      RAISE invalid_password USING message = 'Wahlschlüssel ungültig';
  END IF;

  SELECT *
  FROM direktkandidaten
  WHERE id = direktkandidat AND
        wahlkreis = _wahlkreis
  INTO _direktkandidat;

  IF _direktkandidat IS NULL THEN
     INSERT INTO erststimmen(direktkandidat, wahlkreis) VALUES (NULL, _wahlkreis);
  ELSE
    INSERT INTO erststimmen(direktkandidat, wahlkreis) VALUES (direktkandidat, _wahlkreis);
  END IF;

  SELECT *
  FROM landeslisten ll
       JOIN  bundeslaender b ON b.id = ll.bundesland
       JOIN wahlkreise wk ON wk.bundesland = b.id
  WHERE ll.id = landesliste AND
        wk.id = _wahlkreis
  INTO _landesliste;

  IF _landesliste IS NULL THEN
     INSERT INTO zweitstimmen(landesliste, wahlkreis) VALUES (NULL, _wahlkreis);
  ELSE
    INSERT INTO zweitstimmen(landesliste, wahlkreis) VALUES (landesliste, _wahlkreis);
  END IF;

  UPDATE waehler SET hat_abgestimmt = TRUE WHERE id::text = waehlerSchlussel ;

  END
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- By default, everyone can call the function
REVOKE EXECUTE ON FUNCTION vote FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vote TO voter;


CREATE OR REPLACE FUNCTION ping() RETURNS TEXT AS $$
  BEGIN
     RETURN 'pong';
  END
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION refresh_aggregates(_wahlkreis int)
    RETURNS VOID
AS
$FUNCTION$
DECLARE
    p RECORD;
BEGIN

    ALTER TABLE erststimmeErgebnisse DISABLE TRIGGER ALL;
    ALTER TABLE zweitstimmeErgebnisse DISABLE TRIGGER ALL;
    ALTER TABLE wahlkreiswahldaten DISABLE TRIGGER ALL;

    DELETE FROM erststimmeErgebnisse ee
    WHERE EXISTS (
          SELECT *
          FROM direktkandidaten dk
             JOIN parteikandidaturen pk
             ON dk.partei = pk.id
          WHERE ee.direktkandidat = dk.id AND pk.wahl = 1 AND dk.wahlkreis = _wahlkreis
    );

    INSERT INTO erststimmeErgebnisse (direktkandidat, anzahl_stimmen)
    SELECT direktkandidat, COUNT(*)
    FROM erststimmen
    WHERE direktkandidat IS NOT NULL AND wahlkreis = _wahlkreis
    GROUP BY direktkandidat;


    DELETE FROM zweitstimmeErgebnisse ze
    WHERE EXISTS (
          SELECT *
          FROM landeslisten ll
             JOIN parteikandidaturen pk
             ON ll.partei = pk.id
          WHERE ze.landesliste = ll.id AND pk.wahl = 1
    ) AND ze.wahlkreis = _wahlkreis;


    INSERT INTO zweitstimmeErgebnisse(landesliste, anzahl_stimmen, wahlkreis)
    SELECT landesliste, COUNT(*), wahlkreis
    FROM zweitstimmen
    WHERE landesliste IS NOT NULL AND wahlkreis = _wahlkreis
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
    WHERE wahl = 1 AND wahlkreis = _wahlkreis;

    ALTER TABLE erststimmeErgebnisse ENABLE TRIGGER ALL;
    ALTER TABLE zweitstimmeErgebnisse ENABLE TRIGGER ALL;
    ALTER TABLE wahlkreiswahldaten ENABLE TRIGGER ALL;


END;
$FUNCTION$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION refresh_aggregates_all()
    RETURNS VOID
AS
$FUNCTION$
DECLARE
    p RECORD;
BEGIN

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


END;
$FUNCTION$ LANGUAGE plpgsql;
