import {
  ElectionResult,
  Deputy,
  ElectionRegionResult,
  Region,
  RegionSummary,
  TightestWinner,
  Party,
  Ueberhangsmandate,
  State,
  ParteiGewinner,
  Koalition,
  JoblessnessSummary,
  JoblessnessDistricts
} from './models'

export const URI = process.env.REACT_APP_URI


async function api<T>(suffix: string, init?: RequestInit): Promise<T> {
  const r = await fetch(URI + suffix, init);
  return await r.json();
}

/* const yearToId = (year: number): number => year == 2021 ? 1 : 2; */

export async function getSitzVerteilung(): Promise<ElectionResult[]> {
  return api('/sitze_pro_partei_full');
}

export async function getDeputies(): Promise<Deputy[]> {
  return api('/abgeordnete');
}

export async function getResults(id: number): Promise<ElectionRegionResult[]> {
  return api(`/alle_ergebnisse?wahlkreis=eq.${id}`);
}

export async function getResultsSingleVotes(id: number): Promise<ElectionRegionResult[]> {
  return api(`/alle_ergebnisse_einzelstimmen?wahlkreis=eq.${id}`);
}

export async function getRegions(): Promise<Region[]> {
  return api('/wahlkreise');
}

export async function getStatesAndRegions(): Promise<State[]> {
  return api('/bundeslaender?select=*,wahlkreise(*)');
}

export async function getRegionSummary(id: number): Promise<RegionSummary> {
  return api(`/wahlkreis_uebersicht?wahlkreis=eq.${id}`, {
    headers: new Headers({
      'Accept': 'application/vnd.pgrst.object+json'
    })
  });
}
export async function getDistricts(): Promise<JoblessnessDistricts[]> {
  return api('/rank_arbeitslosigkeit');
}

export async function getJoblessnessAnalysis(ideologie: string): Promise<JoblessnessSummary[]> {
  return api(`/arbeitslosigkeit_uebersicht?ideologie=eq.${ideologie}`);}


export async function getParties(): Promise<Party[]> {
  return api('/parties');
}

export async function getTightestWinner(wahl: number, partei: number): Promise<TightestWinner[]> {
  return api(`/knappste_sieger?wahl=eq.${wahl}&partei_id=eq.${partei}`);
}

export async function getUeberhangsmandate(wahl: number): Promise<Ueberhangsmandate[]> {
  return api(`/ueberhangsmandate?wahl=eq.${wahl}`);
}

export async function getRegionSummarySingleVotes(id: number): Promise<RegionSummary> {
  return api(`/wahlkreis_uebersicht_einzelstimmen?wahlkreis=eq.${id}`, {
    headers: new Headers({
      'Accept': 'application/vnd.pgrst.object+json'
    })
  });
}

export async function getStates(): Promise<State[]> {
  return api('/bundeslaender?select=*');
}


export async function getGewinner(bundesland: number): Promise<ParteiGewinner[]> {
  return api(`/gewinner_parteien?bundesland=eq.${bundesland}`)
}

export async function getKoalitionen(): Promise<Koalition[]> {
  return api('/koalitionen')
}
