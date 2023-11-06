<script lang="ts">
import { onDestroy, onMount } from 'svelte';
import * as L from 'leaflet';
import { loadData } from './stores/data';
import IDWLayer from './components/idw-layer';
import {
  AddOutline,
  RemoveOutline,
  LayersOutline,
  MapOutline,
} from 'svelte-ionicons';

const centerLatitude = -22.94;
const centerLongitude = -43.2;

enum Layer {
  idw = 'Inverse distance weighting (IDW)',
  gp = 'Gaussian process (GP)',
}

let map: L.Map;
let mutationObserver: MutationObserver;
let onZoom = () => {};
let onMove = () => {};
let onHide = (_hide: boolean) => {};

let currentLayer = Layer.idw;

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

function onZoomIn() {
  map.zoomIn();
}

function onZoomOut() {
  map.zoomOut();
}
</script>

<main>
  <div id="map">
    {#if currentLayer == Layer.idw}
      <IDWLayer {map} bind:onZoom bind:onMove bind:onHide />
    {/if}

    <aside>
      <div class="button-group">
        <button on:click={onZoomIn}>
          <AddOutline />
        </button>
        <button on:click={onZoomOut}>
          <RemoveOutline />
        </button>
      </div>

      <div class="button-group">
        <button id="layers-button">
          <LayersOutline />

          <ul id="layer-list">
            {#each Object.values(Layer) as layer}
              <li
                class:selected={currentLayer == layer}
                on:click={() => (currentLayer = layer)}
                role="presentation"
              >
                <MapOutline />
                <span>{layer}</span>
              </li>
            {/each}
          </ul>
        </button>
      </div>
    </aside>
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

    :global(.leaflet-control-container) {
      visibility: hidden;
    }
  }

  aside {
    position: absolute;
    z-index: 10000;

    display: flex;
    flex-direction: column;
    row-gap: 1rem;

    top: 50%;
    left: 0.5rem;
    transform: translate(0, -50%);

    .button-group {
      display: flex;
      flex-direction: column;
      row-gap: 0.5rem;

      button {
        display: flex;
        align-items: center;
        justify-content: center;

        width: 3rem;
        height: 3rem;
        margin: 0;
        padding: 0;
        text-align: center;

        background: white;
        color: #283618;
        border: none;
        box-shadow: none;

        :global(svg) {
          outline: none;
        }

        &:hover {
          background: #283618;
          color: white;
        }

        &#layers-button {
          position: relative;

          &::after {
            content: '';
            width: 1rem;
            height: 4rem;
            left: 3rem;
            position: absolute;
          }

          #layer-list {
            visibility: hidden;
            border-radius: var(--border-radius);

            opacity: 0;
            background: white;

            position: absolute;
            left: 4rem;
            padding: 0.5rem 1rem;

            transition: opacity var(--transition);

            li {
              display: flex;
              align-items: center;
              column-gap: 0.5rem;

              width: 20rem;
              margin: 0;
              padding-left: 0;
              border-bottom: 1px #28361844 solid;

              font-weight: regular;
              color: #000b;
              transition: color var(--transition);

              &:last-child {
                border-bottom: 0;
              }

              :global(svg) {
                padding: 5px;
                width: 1.75rem;
                height: 1.75rem;
                border-radius: var(--border-radius);
              }

              &:hover:not(.selected) {
                color: black;
              }

              &.selected {
                color: black;

                :global(svg) {
                  color: white;
                  background: #606c38;
                }
              }
            }
          }

          &:hover {
            #layer-list {
              opacity: 1;
              visibility: visible;
            }
          }
        }
      }
    }
  }
}
</style>
