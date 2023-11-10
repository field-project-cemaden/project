import { writable } from 'svelte/store';

export enum Layer {
  idw = 'Inverse distance weighting (IDW)',
  gp = 'Gaussian process (GP)',
}

export enum Shape {
  regions = 'Regiões admnistrativas',
  neighborhoods = 'Bairros',
}

export const intervals = [1, 3, 6, 12, 24, 48, 72, 96, 120] as const;
export type Interval = (typeof intervals)[number];

export interface VizStore {
  selectedLayer: Layer;
  selectedShape: Shape;
  selectedInterval: Interval;
}

export const viz = writable<VizStore>({
  selectedLayer: Layer.idw,
  selectedShape: Shape.regions,
  selectedInterval: 1,
});

export function selectLayer(layer: Layer) {
  viz.update((value) => ({
    ...value,
    selectedLayer: layer,
  }));
}

export function selectShape(division: Shape) {
  viz.update((value) => ({
    ...value,
    selectedShape: division,
  }));
}

export function selectInterval(interval: Interval) {
  viz.update((value) => ({
    ...value,
    selectedInterval: interval,
  }));
}
