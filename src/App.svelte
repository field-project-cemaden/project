<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import * as L from 'leaflet';
  import { loadData } from './stores/data';
  import IDWLayer from './components/idw-layer';

  const centerLatitude = -22.94;
  const centerLongitude = -43.2;

  let map: L.Map;
  let mutationObserver: MutationObserver;
  let onZoom: () => {};
  let onMove: () => {};
  let onHide: (hide: boolean) => {};

  onMount(() => {
    map = L.map('map').setView([centerLatitude, centerLongitude], 10);

    L.tileLayer('http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    map.on('zoomstart', () => {
      onHide(true);
    });

    map.on('zoomend', () => {
      onZoom();
      onHide(false);
    });

    mutationObserver = new MutationObserver(() => {
      onMove();
    });

    mutationObserver.observe(document.querySelector('.leaflet-map-pane')!, {
      attributes: true,
      attributeFilter: ['style'],
    });

    loadData();
  });

  onDestroy(() => {
    mutationObserver.disconnect();
  });
</script>

<main>
  <div id="map">
    <IDWLayer
      {map}
      bind:onZoom="{onZoom}"
      bind:onMove="{onMove}"
      bind:onHide="{onHide}"
    />
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
      width: 100%;
      height: 100%;
      user-select: none;
    }
  }
</style>
