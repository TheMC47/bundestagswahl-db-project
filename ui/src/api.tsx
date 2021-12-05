import { ElectionResult } from './App';

export const URI = process.env.REACT_APP_URI


async function api<T>(suffix: string, init?: RequestInit): Promise<T> {
  const r = await fetch(URI + suffix, init);
  return await r.json();
}

const yearToId = (year: number): number => year == 2021 ? 1 : 0;

export async function getSitzVerteilung(year: number): Promise<ElectionResult[]> {
  return api(`/sitze_pro_partei_full?wahl=eq.${yearToId(year)}`);
}
