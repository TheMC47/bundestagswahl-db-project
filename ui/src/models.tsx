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
    kurzbezeichnung: string;
    wahlkreis: string;
    rank: number;
}
