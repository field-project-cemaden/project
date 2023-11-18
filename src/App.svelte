<script lang="ts">
import { onDestroy, onMount } from 'svelte';
import * as d3 from 'd3';
import * as L from 'leaflet';

import { loadData } from '@/stores/data';

import {
  viz,
  selectLayer,
  selectShape,
  selectInterval,
  intervals,
  Layer,
  Shape,
} from '@/stores/viz';

import IDWLayer from './components/idw-layer';
import About from './components/about';

import {
  AddOutline,
  RemoveOutline,
  CheckmarkCircleOutline,
  LayersOutline,
  ShapesOutline,
  TimeOutline,
  InformationOutline,
} from 'svelte-ionicons';

const centerLatitude = -22.94;
const centerLongitude = -43.2;

let map: L.Map;
let mutationObserver: MutationObserver;
let onZoom = () => {};
let onMove = () => {};
let onHide = (_hide: boolean) => {};

let aboutOpen = false;

const colors = ['#d6ccc2', '#2a9d8f', '#e9c46a', '#e76f51'];
let colorScale = d3.scaleThreshold<number, string>([10, 30, 70], colors);

onMount(() => {
  map = L.map('map', { zoomControl: false }).setView(
    [centerLatitude, centerLongitude],
    10,
  );

  L.tileLayer('http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  L.control.scale({ imperial: false }).addTo(map);

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
    {#if $viz.selectedLayer == Layer.idw}
      <IDWLayer {map} {colorScale} bind:onZoom bind:onMove bind:onHide />
    {/if}

    <div id="legend">
      <p>Precipitação<br />acumulada</p>
      <div class="legend-info">
        <div class="legend-info-color" style="background-color: {colors[0]}" />
        <p class="legend-info-name">0 - 10 mm</p>
      </div>
      <div class="legend-info">
        <div class="legend-info-color" style="background-color: {colors[1]}" />
        <p class="legend-info-name">10 - 30 mm</p>
      </div>
      <div class="legend-info">
        <div class="legend-info-color" style="background-color: {colors[2]}" />
        <p class="legend-info-name">30 - 70 mm</p>
      </div>
      <div class="legend-info">
        <div class="legend-info-color" style="background-color: {colors[3]}" />
        <p class="legend-info-name">&ge; 70 mm</p>
      </div>
    </div>

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
        <button class="selection-button">
          <LayersOutline />

          <ul class="selection-list">
            {#each Object.values(Layer) as layer}
              <li
                class:selected={$viz.selectedLayer == layer}
                on:click={() => selectLayer(layer)}
                role="presentation"
              >
                <CheckmarkCircleOutline />
                <span>{layer}</span>
              </li>
            {/each}
          </ul>
        </button>

        <button class="selection-button">
          <ShapesOutline />

          <ul class="selection-list">
            {#each Object.values(Shape) as shape}
              <li
                class:selected={$viz.selectedShape == shape}
                on:click={() => selectShape(shape)}
                role="presentation"
              >
                <CheckmarkCircleOutline />
                <span>{shape}</span>
              </li>
            {/each}
          </ul>
        </button>

        <button class="selection-button">
          <TimeOutline />

          <ul class="selection-list">
            {#each intervals as interval}
              <li
                class:selected={$viz.selectedInterval == interval}
                on:click={() => selectInterval(interval)}
                role="presentation"
              >
                <CheckmarkCircleOutline />
                <span>Acumulado de {interval} horas</span>
              </li>
            {/each}
          </ul>
        </button>

        <button class="selection-button" on:click={() => (aboutOpen = true)}>
          <InformationOutline />
        </button>
      </div>
    </aside>
  </div>

  <About bind:open={aboutOpen} />
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

  #legend {
    position: absolute;
    z-index: 10000;
    right: 1rem;
    bottom: 2rem;

    background-color: white;
    padding: 0.5rem 1rem;
    border-radius: var(--border-radius);

    display: flex;
    flex-direction: column;

    > p {
      color: black;
      margin-bottom: 0.5rem;
      font-weight: bold;
    }

    .legend-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.25rem;

      .legend-info-color {
        width: 1rem;
        height: 1rem;
        border-radius: 100%;
      }

      .legend-info-name {
        color: black;
        margin: 0;
        font-size: 14px;
      }
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

        &.selection-button {
          .selection-list {
            &::before {
              content: '';
              width: 1rem;
              height: 4rem;
              position: absolute;
              left: -1rem;
              top: 50%;
              transform: translate(0, -50%);
            }

            visibility: hidden;
            border-radius: var(--border-radius);

            opacity: 0;
            background: white;

            position: absolute;
            margin-bottom: 0;
            left: 4rem;
            padding: 0.5rem 0.75rem;

            transition: opacity var(--transition);

            li {
              display: flex;
              align-items: center;
              column-gap: 0.5rem;

              width: 20rem;
              margin: 0;
              padding-left: 0;
              border-bottom: 1px #28361844 solid;
              color: #000b;

              &:last-child {
                border-bottom: 0;
              }

              &:hover:not(.selected) {
                color: black;
              }

              :global(svg) {
                padding: 0.25em;
                width: 1.75rem;
                height: 1.75rem;
                border-radius: var(--border-radius);
                flex-shrink: 0;
              }

              span {
                font-weight: regular;
                transition: color var(--transition);
                margin: 0;
                text-align: left;
                height: 1.75rem;
              }

              &.selected {
                :global(svg) {
                  color: white;
                  background: #606c38;
                }

                span {
                  color: black;
                }
              }
            }
          }

          &:hover {
            .selection-list {
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
