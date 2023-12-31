import { LatLng } from 'leaflet';
import { get } from 'svelte/store';
import { viz } from '@/stores/viz';

export function transformCoord([lon, lat]: number[]): [number, number] {
  const point = get(viz).map!.latLngToLayerPoint(new LatLng(lat, lon));
  return [point.x, point.y];
}

export function transformLayerPoint(point: number[]): [number, number] {
  const coord = get(viz).map!.containerPointToLatLng(point as [number, number]);
  return [coord.lng, coord.lat];
}
