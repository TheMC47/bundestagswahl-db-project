import { ElectionResult, Deputy, ElectionRegionResult, Region } from './models'

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


export async function getRegions(): Promise<Region[]> {
  return api('/wahlkreise');
}
