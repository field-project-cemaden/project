import { writable } from 'svelte/store';

type AccumulatedData = Array<{
  acc120hr: number;
  acc12hr: number;
  acc1hr: number;
  acc24hr: number;
  acc3hr: number;
  acc48hr: number;
  acc6hr: number;
  acc72hr: number;
  acc96hr: number;
  latitude: number;
  longitude: number;
}>;

type StreetGraphData = Array<{
  name: string;
  start: [number, number];
  end: [number, number];
}>;

interface DataStore {
  isLoaded: boolean;
  accumulated: AccumulatedData;
  streetGraph: StreetGraphData;
}

export const data = writable<DataStore>({
  isLoaded: false,
  accumulated: [] as any,
  streetGraph: [] as any,
});

export async function loadData() {
  const accumulated: AccumulatedData = await fetch(
    'https://getaccumulateddata-7sc6jz6btq-uc.a.run.app/',
  ).then((r) => r.json());

  const streetGraph = await fetch('/graph.csv')
    .then((r) => r.text())
    .then((text) =>
      text
        .split('\n')
        .map((line) => line.split(';'))
        .map(([name, startLat, startLon, endLat, endLon]) => ({
          name: name,
          start: [Number(startLat), Number(startLon)] as [number, number],
          end: [Number(endLat), Number(endLon)] as [number, number],
        })),
    );

  data.set({
    isLoaded: true,
    accumulated: accumulated!,
    streetGraph: streetGraph!,
  });
}
