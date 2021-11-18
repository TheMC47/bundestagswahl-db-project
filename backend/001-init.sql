CREATE TABLE wahlen (
  id SERIAL,
  wahltag DATE NOT NULL,
  PRIMARY KEY (id)
);
CREATE TABLE bundeslaender (
  id INT,
  name VARCHAR(64) UNIQUE NOT NULL,
  abkuerzung CHAR(2) UNIQUE,
  PRIMARY KEY (id)
);
CREATE TABLE wahlkreise (
  id INT,
  name VARCHAR(128) NOT NULL,
  bundesland INT NOT NULL,
  PRIMARY KEY(id),
  FOREIGN KEY (bundesland) REFERENCES bundeslaender(id) ON
                        UPDATE CASCADE ON
                        DELETE CASCADE,
  UNIQUE(name, bundesland)
);
CREATE TABLE wahlkreisergebnisse (
  id INT NOT NULL,
  wahlkreis INT NOT NULL,
  wahl INT NOT NULL,
  gueltig_erste_stimme INT NOT NULL,
  ungueltig_erste_stimme INT NOT NULL,
  gueltig_zweite_stimme INT NOT NULL,
  ungueltig_zweite_stimme INT NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (wahlkreis) REFERENCES wahlkreise(id) ON
                        UPDATE CASCADE ON
                        DELETE CASCADE,
  FOREIGN KEY (wahl) REFERENCES wahlen(id) ON
                        UPDATE CASCADE ON
                        DELETE CASCADE,
  UNIQUE (wahlkreis, wahl)
);
CREATE TABLE parteien (
  id SERIAL,
  name VARCHAR UNIQUE NOT NULL,
  kurzbezeichnung VARCHAR,
  PRIMARY KEY (id)
);
CREATE TABLE parteiKandidaturen (
  id SERIAL,
  partei INT NOT NULL,
  wahl INT NOT NULL,
  zusatzbezeichnung VARCHAR,
  PRIMARY KEY (id),
  FOREIGN KEY (partei) REFERENCES parteien(id) ON
                                 UPDATE CASCADE ON
                                 DELETE CASCADE,
  FOREIGN KEY (wahl) REFERENCES wahlen(id) ON
                               UPDATE CASCADE ON
                               DELETE CASCADE
);
CREATE TABLE landeslisten (
  id SERIAL,
  partei INT NOT NULL,
  bundesland INT NOT NULL,
  wahl INT NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (wahl) REFERENCES wahlen(id) ON
                          UPDATE CASCADE ON
                          DELETE CASCADE,
  FOREIGN KEY (partei) REFERENCES parteiKandidaturen(id) ON
                          UPDATE CASCADE ON
                          DELETE CASCADE,
  FOREIGN KEY (bundesland) REFERENCES bundeslaender(id) ON
                          UPDATE CASCADE ON
                          DELETE CASCADE
);
CREATE TABLE kandidaten (
  id SERIAL,
  name VARCHAR NOT NULL,
  vorname VARCHAR NOT NULL,
  titel VARCHAR,
  namenzusatz VARCHAR,
  beruf VARCHAR,
  geburtsjahr numeric,
  geschlecht CHAR(1) NOT NULL,
  PRIMARY KEY (id),
  CHECK (geschlecht in ('m', 'w', 'd'))
);
CREATE TABLE direktkandidaten (
  id SERIAL,
  kandidat INT,
  wahlkreis INT NOT NULL,
  wahl INT NOT NULL,
  partei INT,
  FOREIGN KEY (kandidat) REFERENCES kandidaten(id) ON
                             UPDATE CASCADE ON
                             DELETE CASCADE,
  FOREIGN KEY (wahlkreis) REFERENCES wahlkreise(id) ON
                             UPDATE CASCADE ON
                             DELETE CASCADE,
  FOREIGN KEY (wahl) REFERENCES wahlen(id) ON
                             UPDATE CASCADE ON
                             DELETE CASCADE,
  FOREIGN KEY (partei) REFERENCES parteiKandidaturen(id),
  UNIQUE (partei, wahlkreis, wahl)
);
CREATE TABLE listenkandidaten (
  id SERIAL,
  kandidat INT,
  landesliste INT NOT NULL,
  listennummer INT NOT NULL,
  FOREIGN KEY (kandidat) REFERENCES kandidaten(id) ON
                             UPDATE CASCADE ON
                             DELETE CASCADE,
  FOREIGN KEY (landesliste) REFERENCES landeslisten(id) ON
                             UPDATE CASCADE ON
                             DELETE CASCADE,
  PRIMARY KEY (id),
  UNIQUE (landesliste, listennummer)
);
CREATE TABLE waehler (
  id CHAR(64) NOT NULL UNIQUE,
  wahlkreis INT NOT NULL,
  wahl INT NOT NULL,
  hat_abgestimmt Bool DEFAULT FALSE,
  PRIMARY KEY(id),
  FOREIGN KEY (wahlkreis) REFERENCES wahlkreise(id) ON
                      UPDATE CASCADE ON
                      DELETE CASCADE,
  FOREIGN KEY (wahl) REFERENCES wahlen(id) ON
                      UPDATE CASCADE ON
                      DELETE CASCADE
);
CREATE TABLE erststimmen (
  id SERIAL,
  direktkandidat INT,
  wahlkreis INT NOT NULL,
  is_valid Bool DEFAULT TRUE,
  PRIMARY KEY (id),
  FOREIGN KEY (direktkandidat) REFERENCES direktkandidaten(id) ON
                         UPDATE CASCADE ON
                         DELETE CASCADE,
  FOREIGN KEY (wahlkreis) REFERENCES wahlkreise(id) ON
                         UPDATE CASCADE ON
                         DELETE CASCADE
);
CREATE TABLE zweitstimmen (
  id SERIAL,
  landesliste INT NOT NULL,
  wahlkreis INT NOT NULL,
  is_valid Bool DEFAULT TRUE,
  PRIMARY KEY (id),
  FOREIGN KEY (landesliste) REFERENCES landeslisten(id) ON
                          UPDATE CASCADE ON
                          DELETE CASCADE,
  FOREIGN KEY (wahlkreis) REFERENCES wahlkreise(id) ON
                          UPDATE CASCADE ON
                          DELETE CASCADE
);
CREATE TABLE erststimmeErgebnisse (
  id SERIAL,
  direktkandidat INT NOT NULL,
  wahlkreis INT NOT NULL,
  wahl INT NOT NULL,
  anzahl_stimmen INT,
  PRIMARY KEY (id),
  FOREIGN KEY (direktkandidat) REFERENCES direktkandidaten(id) ON
                          UPDATE CASCADE ON
                          DELETE CASCADE,
  FOREIGN KEY (wahlkreis) REFERENCES wahlkreise(id) ON
                          UPDATE CASCADE ON
                          DELETE CASCADE,
  FOREIGN KEY (wahl) REFERENCES wahlen(id) ON
                          UPDATE CASCADE ON
                          DELETE CASCADE,
  UNIQUE(direktkandidat, wahlkreis, wahl)
);
CREATE TABLE zweitstimmeErgebnisse (
  id SERIAL,
  landesliste INT NOT NULL,
  wahlkreis INT NOT NULL,
  wahl INT NOT NULL,
  anzahl_stimmen INT,
  PRIMARY KEY (id),
  FOREIGN KEY (landesliste) REFERENCES landeslisten(id) ON
                          UPDATE CASCADE ON
                          DELETE CASCADE,
  FOREIGN KEY (wahlkreis) REFERENCES wahlkreise(id) ON
                          UPDATE CASCADE ON
                          DELETE CASCADE,
  FOREIGN KEY (wahl) REFERENCES wahlen(id) ON
                          UPDATE CASCADE ON
                          DELETE CASCADE,
  UNIQUE(landesliste, wahlkreis, wahl)
);