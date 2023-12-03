import { type Interpolator, type Point } from './interpolator';
import kriging from '@sakitam-gis/kriging';

export class KrigingInterpolator implements Interpolator {
  private variogram: any;

  constructor(points: Point[]) {
    const t = points.map((point) => point.value);
    const x = points.map((point) => point.position[0]);
    const y = points.map((point) => point.position[1]);
    this.variogram = kriging.train(t, x, y, 'exponential', 0, 100);
  }

  interpolate(coord: [number, number]): number {
    return kriging.predict(coord[0], coord[1], this.variogram);
  }
}
