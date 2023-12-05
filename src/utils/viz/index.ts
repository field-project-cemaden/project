import { scaleThreshold } from 'd3';

export const colors = ['#AAAAAA', '#2a9d8f', '#e9c46a', '#e76f51'];
export const colorScale = scaleThreshold<number, string>(
  [10e-2, 30e-2, 70e-2],
  colors,
);
