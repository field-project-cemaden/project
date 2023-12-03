import { scaleThreshold } from 'd3';

export const colors = ['#d6ccc2', '#2a9d8f', '#e9c46a', '#e76f51'];
export const colorScale = scaleThreshold<number, string>(
  [10e-1, 30e-1, 70e-1],
  colors,
);
