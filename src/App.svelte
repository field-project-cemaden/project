<script lang="ts">
  import * as d3 from 'd3';
  import { onDestroy, onMount } from 'svelte';
  import * as L from 'leaflet';
  import { data, loadData } from './stores/data';

  const centerLatitude = -22.94;
  const centerLongitude = -43.2;

  let map: L.Map;
  let svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
  let hideSvg = false;
  let mutationObserver: MutationObserver;

  function transform(lat: number, lon: number) {
    const point = map.latLngToLayerPoint(new L.LatLng(lat, lon));
    return [point.x, point.y];
  }

  function draw() {
    if (!$data.isLoaded) return;

    const rect = document
      .querySelector('.leaflet-map-pane')!
      .getBoundingClientRect();

    svg
      .selectAll('.point')
      .data($data.accumulated)
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
              const [_x1, y1] = transform(d.latitude, d.longitude);
              const [_x2, y2] = transform(d.latitude + 0.00904371733 * 2, d.longitude);

              return Math.abs(y2 - y1);
            })
            .attr('fill', '#FF000033');

          return update.attr('transform', (d) => {
            let [x, y] = transform(d.latitude, d.longitude);

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

    loadData();
  });

  onDestroy(() => {
    mutationObserver.disconnect();
  });

  $: if ($data.isLoaded && svg) {
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
