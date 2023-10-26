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

interface DataStore {
  isLoaded: boolean;
  accumulated: AccumulatedData;
}

export const data = writable<DataStore>({
  isLoaded: false,
  accumulated: [] as any,
});

export async function loadData() {
  const accumulated: AccumulatedData = await fetch(
    'https://getaccumulateddata-7sc6jz6btq-uc.a.run.app/',
  ).then((r) => r.json());

  data.set({
    isLoaded: true,
    accumulated: accumulated!,
  });
}
