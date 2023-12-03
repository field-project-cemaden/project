import { writable, derived } from 'svelte/store';
import { type Map } from 'leaflet';
import { data } from '@/stores/data';
import { IDWInterpolator } from './idw';
import { KrigingInterpolator } from './kriging';
import type { Interpolator } from './interpolator';

export enum Layer {
  shapes = 'Divisões',
  graph = 'Grafo',
}
export const layers = Object.values(Layer);

export enum Interpolation {
  idw = 'Inverso da distância ponderada',
  kriging = 'Krigagem',
}
export const interpolations = Object.values(Interpolation);

export enum Shape {
  regions = 'Regiões admnistrativas',
  neighborhoods = 'Bairros',
}
export const shapes = Object.values(Shape);

export const intervals = [1, 3, 6, 12, 24, 48, 72, 96, 120] as const;
export type Interval = (typeof intervals)[number];

export interface VizStore {
  map?: Map;
  selectedLayers: Record<Layer, boolean>;
  selectedInterpolation: Interpolation;
  selectedShape: Shape;
  selectedInterval: Interval;
}

export const viz = writable<VizStore>({
  map: undefined,
  selectedLayers: {
    [Layer.shapes]: true,
    [Layer.graph]: false,
  },
  selectedInterpolation: Interpolation.idw,
  selectedShape: Shape.regions,
  selectedInterval: 1,
});

export const interpolator = derived(
  [viz, data],
  ([$viz, $data]): Interpolator => {
    const rainDataForSelectedInterval = $data.rain.map((row) => ({
      position: [row.longitude, row.latitude] as [number, number],
      value: row[`acc${$viz.selectedInterval}hr`],
    }));

    switch ($viz.selectedInterpolation) {
      case Interpolation.idw:
        return new IDWInterpolator(rainDataForSelectedInterval);
      case Interpolation.kriging:
        return new KrigingInterpolator(rainDataForSelectedInterval);
    }
  },
);
