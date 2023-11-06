<script lang="ts">
  import { data } from '@/stores/data';
  import * as d3 from 'd3';
  import * as d3hex from 'd3-hexbin';
  import * as L from 'leaflet';
  import * as turf from '@turf/turf';
  import { invDist, type Point } from './functions';

  const deltaDegree = 4e-3;

  export let map: L.Map;

  let svgEl: SVGSVGElement;
  $: svg = d3.select(svgEl);

  $: accumulatedData = $data.accumulated.map((row) => ({
    position: [row.longitude, row.latitude] as [number, number],
    value: row.acc120hr,
  }));

  let points: Point[] = [];

  $: if ($data.isLoaded) {
    const multyPolygon = turf.multiPolygon(
      $data.boundary?.features[0].geometry.coordinates,
    );
    const [lon1, lat1, lon2, lat2] = turf.bbox(multyPolygon);

    const positions: Array<[number, number]> = [];

    for (let lat = lat1 + deltaDegree / 2; lat <= lat2; lat += deltaDegree) {
      for (let lon = lon1 + deltaDegree / 2; lon <= lon2; lon += deltaDegree) {
        positions.push([lon, lat]);
      }
    }

    points = turf
      .pointsWithinPolygon(turf.points(positions), multyPolygon)
      .features.map((point) => point.geometry.coordinates as [number, number])
      .map((point) => ({
        position: point,
        value: invDist(point, accumulatedData),
      }));
  }

  function transform([lon, lat]: [number, number]): [number, number] {
    const point = map.latLngToLayerPoint(new L.LatLng(lat, lon));
    return [point.x, point.y];
  }

  function drawHeatMap() {
    if (points.length < 2) return;

    const transformedPoints = points.map((point) => ({
      ...point,
      position: transform(point.position),
    }));

    const color = d3
      .scaleQuantize<string>()
      .domain([0, d3.max([...accumulatedData.map((point) => point.value), 1])!])
      .range(d3.schemeBlues[9]);

    const radius =
      80 *
      deltaDegree *
      Math.abs(
        transformedPoints[1].position[0] - transformedPoints[0].position[0],
      );

    const hexbin = d3hex
      .hexbin<Point>()
      .x((d) => d.position[0])
      .y((d) => d.position[1])
      .radius(radius);

    svg
      .select('g')
      .selectAll('path')
      .data(hexbin(transformedPoints))
      .join('path')
      .attr('transform', (d) => `translate(${d.x},${d.y})`)
      .attr('d', hexbin.hexagon())
      .attr('fill', (d) => {
        const mean = d.reduce((acc, point) => acc + point.value, 0) / d.length;
        return color(mean);
      })
      .attr('opacity', 0.5);
  }

  function translateG() {
    const container = map.getContainer().querySelector('.leaflet-map-pane')!;
    const rect = container.getBoundingClientRect();
    const translate = [rect.x, rect.y];

    svg
      .select('g')
      .attr('transform', `translate(${translate[0]}, ${translate[1]})`);
  }

  export function onZoom() {
    drawHeatMap();
  }

  export function onMove() {
    translateG();
  }

  export function onHide(hide: boolean) {
    svg.style('visibility', hide ? 'hidden' : 'visible');
  }

  $: if ($data.isLoaded) {
    drawHeatMap();
  }
</script>

<svg bind:this="{svgEl}">
  <g></g>
</svg>

<style lang="scss">
  svg {
    width: 100vw;
    height: 100vh;
    position: absolute;
    z-index: 1000;
  }
</style>
