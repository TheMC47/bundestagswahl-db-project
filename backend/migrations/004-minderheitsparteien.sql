CREATE TABLE minderheitsparteien (
  id INT,
  PRIMARY KEY(id),
  FOREIGN KEY(id) REFERENCES parteien(id) ON
        UPDATE CASCADE ON
        DELETE CASCADE
);
