export interface ElectionResult {
  kurzbezeichnung: string;
  sitze: number;
  wahl: number;
}

export interface Deputy {
  name: string;
  partei_kurzbezeichnung: string;
}

export interface TightestWinner {
  wahl: number;
  partei: string;
  wahlkreis: string;
  rank: number;
  siege: boolean;
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

export interface RegionSummary {
  wahlkreis: number;
  sieger_partei: string;
  gewinner: string;
  wahlbeteiligung: number;
}

export interface Party {
  wahl: number;
  id: number;
  name: string;
  kurzbezeichnung: string;
}

export interface ueberhangsmandate {
  wahl: number;
  partei: string;
  land: string;
  ueberhange: number;
}

export interface ueberhangsmandate {
  wahl: number;
  partei_id: number;
  partei_kurzbezeichnung: string;
  land_id: number;
  land_abkuerzung: string;
  ueberhange: number;
}
