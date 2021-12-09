export interface ElectionResult {
  kurzbezeichnung: string;
  sitze: number;
  wahl: number;
}

export interface Deputy {
  name: string;
  partei_kurzbezeichnung: string;
}

export interface ElectionRegionResult {
  wahlkreis: number;
  kurzbezeichnung: string,
  erststimmen_anzahl_2021?: number;
  erststimmen_prozent_2021?: number;
  erststimmen_anzahl_2017?: number;
  erststimmen_prozent_2017?: number;
  unterschied_erststimmen?: number;
  zweitstimmen_anzahl_2021?: number;
  zweitstimmen_prozent_2021?: number;
  zweitstimmen_anzahl_2017?: number;
  zweitstimmen_prozent_2017?: number;
  unterschied_zweitstimmen?: number;
}

export interface Region {
  id: number;
  name: string;
}
