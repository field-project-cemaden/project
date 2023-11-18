<script lang="ts">
import { data } from '@/stores/data';
import { viz, Shape } from '@/stores/viz';
import * as d3 from 'd3';
import * as L from 'leaflet';
import * as turf from '@turf/turf';
import { invDist } from './functions';
import type { MultiPolygon } from 'geojson';

export let map: L.Map;
export let colorScale: d3.ScaleThreshold<number, string>;

let svgEl: SVGSVGElement;
$: svg = d3.select(svgEl);

let tooltipEl: Element;
$: tooltip = d3.select(tooltipEl);

$: accumulatedData = $data.accumulated.map((row) => ({
  position: [row.longitude, row.latitude] as [number, number],
  value: row[`acc${$viz.selectedInterval}hr`],
}));

let shapeData = [] as {
  features: d3.ExtendedFeature<MultiPolygon>;
  value: number;
}[];

$: if ($data.isLoaded) {
  let shape;

  switch ($viz.selectedShape) {
    case Shape.regions:
      shape = $data.regions;
      break;
    case Shape.neighborhoods:
      shape = $data.neighborhoods;
  }

  shapeData = shape!.features.map((features) => {
    let coords = features.geometry.coordinates;
    coords = typeof coords[0][0][0] === 'number' ? ([coords] as any) : coords;
    const multiPolygon = turf.multiPolygon(coords);
    const center = turf.center(multiPolygon).geometry.coordinates;

    return {
      features,
      value: invDist(center as [number, number], accumulatedData),
    };
  });
}

function transform([lon, lat]: [number, number]): [number, number] {
  const point = map.latLngToLayerPoint(new L.LatLng(lat, lon));
  return [point.x, point.y];
}

function drawHeatMap() {
  const path = d3.geoPath().projection(
    d3.geoTransform({
      point: function (lon, lat) {
        this.stream.point(...transform([lon, lat]));
      },
    }),
  );

  svg
    .select('g')
    .selectAll('path')
    .data(shapeData)
    .join('path')
    .attr('d', (region) => path(region.features))
    .attr('fill', (region) => colorScale(region.value))
    .attr('stroke', 'white')
    .attr('stroke-width', 1)
    .attr('opacity', 0.5)
    .on('mouseenter', (_, region) => {
      tooltip.classed('open', true);

      const properties = region.features.properties;
      const name = properties?.nomera ?? properties?.nome;

      tooltip.select('.region-name').text(name);
      tooltip
        .select('.region-value')
        .text(
          `${Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(
            region.value,
          )} mm`,
        );
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

$: if ($data.isLoaded && svg && shapeData) {
  drawHeatMap();
  translateG();
}
</script>

<svg bind:this={svgEl}>
  <g></g>
</svg>

<div class="region-tooltip" bind:this={tooltipEl}>
  <p class="region-name"></p>
  <p class="region-value"></p>
</div>

<style lang="scss">
svg {
  width: 100vw;
  height: 100vh;
  position: absolute;
  z-index: 1000;
}

.region-tooltip {
  position: absolute;
  visibility: hidden;

  opacity: 0;
  background: white;
  border-radius: var(--border-radius);

  height: 4rem;
  padding: 0.5rem 0.75rem;

  transition: opacity var(--transition);
  z-index: 10000;

  &:global(.open) {
    opacity: 1;
    visibility: visible;
  }

  .region-name {
    font-weight: bold;
    margin: 0;
  }

  .region-value {
    font-size: 0.85rem;
  }
}
</style>
