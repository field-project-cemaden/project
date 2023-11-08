<script lang="ts">
import { data } from '@/stores/data';
import * as d3 from 'd3';
import * as L from 'leaflet';
import * as turf from '@turf/turf';
import { invDist, type Point } from './functions';

// const deltaDegree = 6e-3;

export let map: L.Map;

let svgEl: SVGSVGElement;
$: svg = d3.select(svgEl);

let tooltipEl: Element;
$: tooltip = d3.select(tooltipEl);

$: accumulatedData = $data.accumulated.map((row) => ({
  position: [row.longitude, row.latitude] as [number, number],
  value: row.acc120hr,
}));

let points: Point[] = [];

$: if ($data.isLoaded) {
  // const multyPolygon = turf.multiPolygon(
  //   $data.boundary?.features[0].geometry.coordinates,
  // );

  // const [lon1, lat1, lon2, lat2] = turf.bbox(multyPolygon);

  // const positions: Array<[number, number]> = [];

  // for (let lat = lat1 + deltaDegree / 2; lat <= lat2; lat += deltaDegree) {
  //   for (let lon = lon1 + deltaDegree / 2; lon <= lon2; lon += deltaDegree) {
  //     positions.push([lon, lat]);
  //   }
  // }

  // points = turf
  //   .pointsWithinPolygon(turf.points(positions), multyPolygon)
  //   .features.map((point) => point.geometry.coordinates as [number, number])
  //   .map((point) => ({
  //     position: point,
  //     value: invDist(point, accumulatedData),
  //   }));
}

function transform([lon, lat]: [number, number]): [number, number] {
  const point = map.latLngToLayerPoint(new L.LatLng(lat, lon));
  return [point.x, point.y];
}

function drawHeatMap() {
  // if (points.length < 2) return;

  // const transformedPoints = points.map((point) => ({
  //   ...point,
  //   position: transform(point.position),
  // }));

  const color = d3
    .scaleQuantize<string>()
    .domain([0, d3.max([...accumulatedData.map((point) => point.value), 1])!])
    .range(d3.schemeBlues[9]);

  const path = d3.geoPath().projection(
    d3.geoTransform({
      point: function (lon, lat) {
        this.stream.point(...transform([lon, lat]));
      },
    }),
  );

  // svg
  //   .select('g')
  //   .selectAll('circle')
  //   .data(transformedPoints)
  //   .join('circle')
  //   .attr('cx', (d) => d.position[0])
  //   .attr('cy', (d) => d.position[1])
  //   .attr('r', 2)
  //   .attr('fill', 'blue');

  svg
    .select('g')
    .selectAll('path')
    .data($data.regions.features)
    .join('path')
    .attr('d', path)
    .attr('fill', (d) => {
      let coords = d.geometry.coordinates;
      coords = typeof coords[0][0][0] === 'number' ? ([coords] as any) : coords;
      const multiPolygon = turf.multiPolygon(coords);
      const center = turf.center(multiPolygon).geometry.coordinates;
      return color(invDist(center as [number, number], accumulatedData));
    })
    .attr('stroke', 'white')
    .attr('stroke-width', 1)
    .attr('opacity', 0.75)
    .on('mouseenter', (_, d) => {
      tooltip.classed('open', true).text(d.properties?.nomera);
    })
    .on('mousemove', (e) => {
      tooltip
        .style('left', `${e.clientX + 10}px`)
        .style('top', `${e.clientY + 10}px`);
    })
    .on('mouseleave', () => {
      tooltip.classed('open', false);
    });
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

$: if ($data.isLoaded && svg) {
  drawHeatMap();
  translateG();
}
</script>

<svg bind:this={svgEl}>
  <g></g>
</svg>

<div class="tooltip" bind:this={tooltipEl}></div>

<style lang="scss">
svg {
  width: 100vw;
  height: 100vh;
  position: absolute;
  z-index: 1000;
}

.tooltip {
  position: absolute;
  visibility: hidden;

  opacity: 0;
  background: white;
  border-radius: var(--border-radius);
  font-weight: bold;

  width: 10rem;
  height: 4rem;
  padding: 0.5rem;

  transition: opacity var(--transition);
  z-index: 10000;

  &:global(.open) {
    opacity: 1;
    visibility: visible;
  }
}
</style>
