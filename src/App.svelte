<script lang="ts">
  import * as d3 from 'd3';
  import { onDestroy, onMount } from 'svelte';
  import * as L from 'leaflet';

  const centerLatitude = -22.94;
  const centerLongitude = -43.2;

  let map: L.Map;
  let svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
  let data: d3.DSVRowString<string>[];
  let hideSvg = false;
  let mutationObserver: MutationObserver;

  function transform(lat: number, lon: number) {
    const point = map.latLngToLayerPoint(new L.LatLng(lat, lon));
    return [point.x, point.y];
  }

  function draw() {
    if (!data) return;

    const rect = document
      .querySelector('.leaflet-map-pane')!
      .getBoundingClientRect();

    svg
      .selectAll('.point')
      .data(data)
      .join(
        (enter) => {
          const g = enter.append('g').attr('class', 'point');

          g.append('circle').attr('class', 'center');
          g.append('circle').attr('class', 'radius');

          return g;
        },
        (update) => {
          update.select('.center').attr('r', 5).attr('fill', 'red');
          update
            .select('.radius')
            .attr('r', (d) => {
              const lat = +d.latitude.replaceAll(',', '.');
              const lon = +d.longitude.replaceAll(',', '.');
              const [_x1, y1] = transform(lat, lon);
              const [_x2, y2] = transform(lat + 0.009043717330 * 2, lon);

              return Math.abs(y2 - y1);
            })
            .attr('fill', '#FF000033');

          return update.attr('transform', (d) => {
            const lat = +d.latitude.replaceAll(',', '.');
            const lon = +d.longitude.replaceAll(',', '.');
            let [x, y] = transform(lat, lon);

            x += rect.x;
            y += rect.y;

            return `translate(${x}, ${y})`;
          });
        },
      );
  }

  onMount(() => {
    map = L.map('map').setView([centerLatitude, centerLongitude], 10);

    L.tileLayer('http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    map.on('zoomstart', () => {
      hideSvg = true;
    });

    map.on('zoomend', () => {
      draw();
      hideSvg = false;
    });

    mutationObserver = new MutationObserver(() => {
      draw();
    });

    mutationObserver.observe(document.querySelector('.leaflet-map-pane')!, {
      attributes: true,
      attributeFilter: ['style'],
    });

    svg = d3.select('#map > svg');

    d3.dsv(';', 'data.csv').then(
      (csv) =>
        (data = Array.from(d3.group(csv, (d) => d.codEstacao).values()).map(
          (g) => g[0],
        )),
    );
  });

  onDestroy(() => {
    mutationObserver.disconnect();
  });

  $: if (data && svg) {
    draw();
    svg.style('visibility', hideSvg ? 'hidden' : 'visible');
  }
</script>

<main>
  <div id="map">
    <svg />
  </div>
</main>

<style lang="scss">
  main {
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;

    #map {
      background: lightgray;
      width: 100%;
      height: 100%;
      user-select: none;

      svg {
        width: 100vw;
        height: 100vh;
        position: absolute;
        z-index: 1000;
      }
    }
  }
</style>
