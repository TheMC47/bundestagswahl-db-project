CREATE ROLE helfer;
GRANT helfer TO authenticator;

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
        'helfer'::text as role,
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
     INSERT INTO erststimmen(direktkandidat) VALUES (NULL);
  ELSE
    INSERT INTO erststimmen(direktkandidat) VALUES (direktkandidat);
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
GRANT EXECUTE ON FUNCTION vote TO helfer;
