CREATE TABLE wahl (
  id SERIAL,
  wahltag DATE NOT NULL,
  PRIMARY KEY (id)
);
CREATE TABLE bundesland (
  id INT,
  name VARCHAR(64) UNIQUE NOT NULL,
  abkuerzung CHAR(2) UNIQUE,
  PRIMARY KEY (id)
);
CREATE TABLE wahlkreis (
  id INT,
  name VARCHAR(64) NOT NULL,
  bundesland INT NOT NULL,
  wahl INT NOT NULL,
  PRIMARY KEY(id),
  FOREIGN KEY (bundesland) REFERENCES bundesland(id) ON
                        UPDATE CASCADE ON
                        DELETE CASCADE,
  FOREIGN KEY (wahl) REFERENCES wahl(id) ON
                          UPDATE CASCADE ON
                          DELETE CASCADE,
  UNIQUE(name, bundesland)
);
CREATE TABLE wahlkreisergebnis (
  wahlkreis INT NOT NULL,
  gueltig_erste_stimme INT NOT NULL,
  ungueltig_erste_stimme INT NOT NULL,
  gueltig_zweite_stimme INT NOT NULL,
  ungueltig_zweite_stimme INT NOT NULL,
  PRIMARY KEY (wahlkreis),
  FOREIGN KEY (wahlkreis) REFERENCES wahlkreis(id) ON
                        UPDATE CASCADE ON
                        DELETE CASCADE
);
CREATE TABLE partei (
  id SERIAL,
  name VARCHAR UNIQUE NOT NULL,
  kurzbezeichnung VARCHAR,
  zusatzbezeichnung VARCHAR,
  PRIMARY KEY (id)
);
CREATE TABLE parteiKandidatur (
  id SERIAL,
  partei INT NOT NULL,
  wahl INT NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (partei) REFERENCES partei(id) ON
                                 UPDATE CASCADE ON
                                 DELETE CASCADE,
  FOREIGN KEY (wahl) REFERENCES wahl(id) ON
                               UPDATE CASCADE ON
                               DELETE CASCADE
);
CREATE TABLE landesliste (
  id SERIAL,
  partei INT NOT NULL,
  bundesland INT NOT NULL,
  PRIMARY KEY (id),
  wahl INT NOT NULL,
  FOREIGN KEY (wahl) REFERENCES wahl(id) ON
                          UPDATE CASCADE ON
                          DELETE CASCADE,
  FOREIGN KEY (partei) REFERENCES parteiKandidatur(id) ON
                          UPDATE CASCADE ON
                          DELETE CASCADE,
  FOREIGN KEY (bundesland) REFERENCES bundesland(id) ON
                          UPDATE CASCADE ON
                          DELETE CASCADE
);
CREATE TABLE kandidat (
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
CREATE TABLE direktkandidat (
  id INT NOT NULL,
  wahlkreis INT NOT NULL,
  partei INT,
  FOREIGN KEY (id) REFERENCES kandidat(id) ON
                             UPDATE CASCADE ON
                             DELETE CASCADE,
  FOREIGN KEY (wahlkreis) REFERENCES wahlkreis(id) ON
                             UPDATE CASCADE ON
                             DELETE CASCADE,
  FOREIGN KEY (partei) REFERENCES parteiKandidatur(id),
  PRIMARY KEY (id),
  UNIQUE (partei, wahlkreis)
);
CREATE TABLE listenkandidat (
  id INT NOT NULL,
  landesliste INT NOT NULL,
  listennummer INT NOT NULL,
  FOREIGN KEY (id) REFERENCES kandidat(id) ON
                             UPDATE CASCADE ON
                             DELETE CASCADE,
  FOREIGN KEY (landesliste) REFERENCES landesliste(id) ON
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
  FOREIGN KEY (wahlkreis) REFERENCES wahlkreis(id) ON
                      UPDATE CASCADE ON
                      DELETE CASCADE,
  FOREIGN KEY (wahl) REFERENCES wahl(id) ON
                      UPDATE CASCADE ON
                      DELETE CASCADE
);
CREATE TABLE erststimme (
  id SERIAL,
  direktkandidat INT,
  wahlkreis INT NOT NULL,
  is_valid Bool DEFAULT TRUE,
  PRIMARY KEY (id),
  FOREIGN KEY (direktkandidat) REFERENCES direktkandidat(id) ON
                         UPDATE CASCADE ON
                         DELETE CASCADE,
  FOREIGN KEY (wahlkreis) REFERENCES wahlkreis(id) ON
                         UPDATE CASCADE ON
                         DELETE CASCADE
);
CREATE TABLE zweitstimme (
  id SERIAL,
  landesliste INT NOT NULL,
  wahlkreis INT NOT NULL,
  is_valid Bool DEFAULT TRUE,
  PRIMARY KEY (id),
  FOREIGN KEY (landesliste) REFERENCES landesliste(id) ON
                          UPDATE CASCADE ON
                          DELETE CASCADE,
  FOREIGN KEY (wahlkreis) REFERENCES wahlkreis(id) ON
                          UPDATE CASCADE ON
                          DELETE CASCADE
);
CREATE TABLE erststimmeErgebnis (
  id SERIAL,
  direktkandidat INT NOT NULL,
  wahlkreis INT NOT NULL,
  anzahl_stimmen INT,
  PRIMARY KEY (id),
  FOREIGN KEY (direktkandidat) REFERENCES direktkandidat(id) ON
                          UPDATE CASCADE ON
                          DELETE CASCADE,
  FOREIGN KEY (wahlkreis) REFERENCES wahlkreis(id) ON
                          UPDATE CASCADE ON
                          DELETE CASCADE,
  UNIQUE(direktkandidat, wahlkreis)
);
CREATE TABLE zweitstimmeErgebnis (
  id SERIAL,
  landesliste INT NOT NULL,
  wahlkreis INT NOT NULL,
  anzahl_stimmen INT,
  PRIMARY KEY (id),
  FOREIGN KEY (landesliste) REFERENCES landesliste(id) ON
                          UPDATE CASCADE ON
                          DELETE CASCADE,
  FOREIGN KEY (wahlkreis) REFERENCES wahlkreis(id) ON
                          UPDATE CASCADE ON
                          DELETE CASCADE,
  UNIQUE(landesliste, wahlkreis)
);
