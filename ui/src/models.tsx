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

export interface RegionSummary {
  wahlkreis: number;
  sieger_partei: string;
  gewinner: string;
  wahlbeteiligung: number;
}

export interface JoblessnessDistricts {
  land_id: number;
  land: string;
  rank: number;

}
export interface JoblessnessSummary {
  ideologie: string;
  bundesland: string;
  anzahlstimmen: number;

}

