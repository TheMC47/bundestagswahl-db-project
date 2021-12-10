export interface ElectionResult {
  kurzbezeichnung: string;
  sitze: number;
  wahl: number;
}

export interface Deputy {
  name: string;
  partei_kurzbezeichnung: string;
}

export interface TightestWinner{
    wahl: number;
    direkt_kandidat: string;
    wahlkreis: number;
    partei_kurzbezeichnung: string;
    rank: number;
}
