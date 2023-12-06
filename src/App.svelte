<script lang="ts">
import * as L from 'leaflet';
import { onDestroy, onMount } from 'svelte';

import {
  viz,
  interpolations,
  shapes,
  intervals,
  layers,
  Layer,
} from '@/stores/viz';
import { loadData } from '@/stores/data';
import { colors } from '@/utils/viz';
import RainMap from '@/components/rain-map';
import Graph from '@/components/graph';
import About from '@/components/about';

import {
  IconLassoPolygon,
  IconEaseInOut,
  IconBoxMultiple,
  IconSelect,
  IconClock,
  IconZoomIn,
  IconZoomOut,
  IconInfoSquareRounded,
} from '@tabler/icons-svelte';

const centerLatitude = -22.94;
const centerLongitude = -43.2;

let mutationObserver: MutationObserver;

let showAbout = false;

onMount(() => {
  $viz.map = L.map('map', { zoomControl: false }).setView(
    [centerLatitude, centerLongitude],
    12,
  );

  L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo($viz.map);

  L.control.scale({ imperial: false }).addTo($viz.map);

  $viz.map.on('zoomstart', () => {
    document.dispatchEvent(new Event('viz-map-hide'));
  });

  $viz.map.on('zoomend', () => {
    document.dispatchEvent(new Event('viz-map-zoom'));
    document.dispatchEvent(new Event('viz-map-show'));
  });

  mutationObserver = new MutationObserver(() => {
    document.dispatchEvent(new Event('viz-map-drag'));
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
  $viz.map?.zoomIn();
}

function onZoomOut() {
  $viz.map?.zoomOut();
}
</script>

<main>
  <div id="map">
    {#if $viz.selectedLayers[Layer.shapes]}
      <RainMap />
    {/if}

    {#if $viz.selectedLayers[Layer.graph]}
      <Graph />
    {/if}
  </div>

  <aside id="buttons">
    <div class="button-group">
      <button on:click={onZoomIn}>
        <IconZoomIn />
      </button>
      <button on:click={onZoomOut}>
        <IconZoomOut />
      </button>
    </div>

    <div class="button-group">
      <button class="selection-button">
        <IconBoxMultiple />

        <ul class="selection-list">
          {#each layers as layer}
            <li
              class:selected={$viz.selectedLayers[layer]}
              on:click={() =>
                ($viz.selectedLayers[layer] = !$viz.selectedLayers[layer])}
              role="presentation"
            >
              <IconSelect />
              <span>{layer}</span>
            </li>
          {/each}
        </ul>
      </button>

      {#if $viz.selectedLayers[Layer.shapes]}
        <button class="selection-button">
          <IconLassoPolygon />

          <ul class="selection-list">
            {#each shapes as shape}
              <li
                class:selected={$viz.selectedShape == shape}
                on:click={() => ($viz.selectedShape = shape)}
                role="presentation"
              >
                <IconSelect />
                <span>{shape}</span>
              </li>
            {/each}
          </ul>
        </button>
      {/if}

      <div class="button-group">
        <button class="selection-button">
          <IconEaseInOut />

          <ul class="selection-list">
            {#each interpolations as interpolation}
              <li
                class:selected={$viz.selectedInterpolation == interpolation}
                on:click={() => ($viz.selectedInterpolation = interpolation)}
                role="presentation"
              >
                <IconSelect />
                <span>{interpolation}</span>
              </li>
            {/each}
          </ul>
        </button>

        <button class="selection-button">
          <IconClock />

          <ul class="selection-list">
            {#each intervals as interval}
              <li
                class:selected={$viz.selectedInterval == interval}
                on:click={() => ($viz.selectedInterval = interval)}
                role="presentation"
              >
                <IconSelect />
                <span>Acumulado de {interval} horas</span>
              </li>
            {/each}
          </ul>
        </button>

        <button class="selection-button" on:click={() => (showAbout = true)}>
          <IconInfoSquareRounded />
        </button>
      </div>
    </div>
  </aside>

  <aside id="info-box">
    <img src="/figs/logo_sem_legenda.png" alt="Logo" />

    <hr style="margin-top: 0.25rem" />

    <p>Precipitação ({$viz.selectedInterval}h)</p>

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
  </aside>

  <About bind:open={showAbout} />
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

  #info-box {
    position: absolute;
    z-index: 10000;
    right: 1rem;
    top: 1rem;

    width: 12rem;

    background-color: white;
    background-color: rgba(255,255,255,0.8);
    padding-bottom: 1rem;
    backdrop-filter: blur(10px);
    padding: 0.5rem 1rem;
    border-radius: var(--border-radius);

    hr {
      border-color: #28361844;
      margin: 1rem 0;
    }

    > img {
      padding: 0.5rem 0 0;
    }

    > p {
      color: black;
      margin: 0.5rem 0;
      font-weight: 500;
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

  #buttons {
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
