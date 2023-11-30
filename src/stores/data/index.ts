import { writable } from 'svelte/store';
import * as d3 from 'd3';
import type { MultiPolygon } from 'geojson';

export type AccumulatedData = Array<{
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
  start: [number, number];
  end: [number, number];
}>;

type GeoJSON = d3.ExtendedFeatureCollection<d3.ExtendedFeature<MultiPolygon>>;

interface DataStore {
  isLoaded: boolean;
  accumulated: AccumulatedData;
  streetGraph: StreetGraphData;
  boundary: GeoJSON;
  regions: GeoJSON;
  neighborhoods: GeoJSON;
}

export const data = writable<DataStore>({
  isLoaded: false,
  accumulated: [] as any,
  streetGraph: [] as any,
  boundary: null as any,
  regions: null as any,
  neighborhoods: null as any,
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
        .map(([startLat, startLon, endLat, endLon]) => ({
          start: [Number(startLat), Number(startLon)] as [number, number],
          end: [Number(endLat), Number(endLon)] as [number, number],
        })),
    );

  console.log(
    streetGraph.length,
  );

  const boundary = await d3.json<GeoJSON>('/boundary.geojson');
  const regions = await d3.json<GeoJSON>('/regions.geojson');
  const neighborhoods = await d3.json<GeoJSON>('/neighborhoods.geojson');

  data.set({
    isLoaded: true,
    accumulated: accumulated!,
    streetGraph: streetGraph!,
    boundary: boundary!,
    regions: regions!,
    neighborhoods: neighborhoods!,
  });
}
