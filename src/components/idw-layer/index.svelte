<script lang="ts">
  import { data } from '../../stores/data';
  import * as d3 from 'd3';
  import * as L from 'leaflet';
  import * as turf from '@turf/turf';
  import { invDist } from './functions';

  const deltaDegree = 4e-3;

  export let map: L.Map;

  let svgEl: SVGSVGElement;
  $: svg = d3.select(svgEl);

  $: accumulatedData = $data.accumulated.map((row) => [
    row.latitude,
    row.longitude,
    row.acc72hr,
  ]) as [number, number, number][];

  function transform([lon, lat]: [number, number]): [number, number] {
    const point = map.latLngToLayerPoint(new L.LatLng(lat, lon));
    return [point.x, point.y];
  }

  function drawHeatMap() {
    const multyPolygon = turf.multiPolygon(
      $data.boundary?.features[0].geometry.coordinates,
    );
    const [lon1, lat1, lon2, lat2] = turf.bbox(multyPolygon);

    const allPoints: Array<[number, number]> = [];

    for (let lat = lat1; lat <= lat2; lat += deltaDegree) {
      for (let lon = lon1; lon <= lon2; lon += deltaDegree) {
        allPoints.push([lon, lat]);
      }
    }

    const landPoints = turf
      .pointsWithinPolygon(turf.points(allPoints), multyPolygon)
      .features.map((point) => point.geometry.coordinates as [number, number]);

    let boxes: [[number, number], [number, number], number][] = landPoints.map(
      ([lon, lat]) => [
        [lon, lat],
        [lon + deltaDegree, lat + deltaDegree],
        invDist(lat, lon, accumulatedData),
      ],
    );


    const color = d3
      .scaleLinear<string>()
      .domain([0, d3.max(boxes.map(([_1, _2, v]) => v)) as number])
      .range(['transparent', 'darkblue']);

    svg
      .select('g')
      .selectAll('rect')
      .data(
        boxes.map(
          ([c1, c2, v]) =>
            [transform(c1), transform(c2), v] as [
              [number, number],
              [number, number],
              number,
            ],
        ),
      )
      .join('rect')
      .attr('x', (d) => (d[0][0] + d[1][0]) / 2)
      .attr('y', (d) => (d[0][1] + d[1][1]) / 2)
      .attr('width', (d) => Math.abs(d[1][0] - d[0][0]))
      .attr('height', (d) => Math.abs(d[1][1] - d[0][1]))
      .attr('fill', (d) => color(d[2]))
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
