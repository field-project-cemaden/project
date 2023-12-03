export interface Point {
  position: [number, number];
  value: number;
}

export interface Interpolator {
  interpolate(coord: [number, number]): number;
}
