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

export interface State {
  id: number;
  name: string;
  wahlkreise: Region[];
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


export interface Party {
  wahl: number;
  id: number;
  name: string;
  kurzbezeichnung: string;
}

export interface Ueberhangsmandate {
  wahl: number;
  partei: string;
  land: string;
  ueberhange: number;
}

export interface WahlkreisGewinner {
  kandidat: string;
  wahlkreis: number;
}

export interface ListenGewinner {
  kandidat: string;
  listennummer: number;
}

export interface AlleGewinner {
  wahlkreise?: WahlkreisGewinner[];
  listenplaetze?: ListenGewinner[];
}

export interface ParteiGewinner {
  partei: string;
  bundsland: number;
  gewinner: AlleGewinner;
}

export interface Koalition {
  koalition: string[];
  sitze: number;
}

export interface Direktkandidat {
  wahlkreis: number;
  kandidat_id: number;
  kandidat_nachname: string;
  kandidat_vorname: string;
  kandidat_beruf: string;
  partei_abk: string;
  partei_name: string;
  rank: number;
}

export interface Landesliste {
  bundesland: number;
  liste_id: number;
  partei_abk: string;
  partei_name: string;
  rank: number;
  kandidaten: string;

}
