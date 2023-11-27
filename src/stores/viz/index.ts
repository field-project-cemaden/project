import { writable } from 'svelte/store';
import { type Map } from 'leaflet';

export enum Layer {
  idw = 'Inverse distance weighting (IDW)',
  gp = 'Gaussian process (GP)',
}
export const layers = Object.values(Layer);

export enum Shape {
  regions = 'Regiões admnistrativas',
  neighborhoods = 'Bairros',
}
export const shapes = Object.values(Shape);

export const intervals = [1, 3, 6, 12, 24, 48, 72, 96, 120] as const;
export type Interval = (typeof intervals)[number];

export interface VizStore {
  map?: Map;
  selectedLayer: Layer;
  selectedShape: Shape;
  selectedInterval: Interval;
}

export const viz = writable<VizStore>({
  map: undefined,
  selectedLayer: Layer.idw,
  selectedShape: Shape.regions,
  selectedInterval: 1,
});

