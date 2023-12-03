<script lang="ts">
import * as d3 from 'd3';
import regl from 'regl';
import { viz, interpolator } from '@/stores/viz';
import { data } from '@/stores/data';
import { onEvent, onResize } from '@/utils/svelte';
import { transformCoord } from '@/utils/leaflet';
import { colorScale } from '@/utils/viz';

const FLOAT_BYTES = 4;

let canvasEl: HTMLCanvasElement;
$: canvas = d3.select(canvasEl);

let size = onResize();

$: gl = regl(canvasEl);

$: positionBuffer = gl.buffer({
  length: $data.graph.length * FLOAT_BYTES * 4,
  type: 'float',
  usage: 'dynamic',
});

$: colorBuffer = gl.buffer({
  length: $data.graph.length * FLOAT_BYTES * 3 * 2,
  type: 'float',
  usage: 'dynamic',
});

let offset = [0, 0];
let drawFn: regl.DrawCommand;

function hex2rgb(hex: string) {
  const hexNumber = parseInt(hex.slice(1), 16);
  return [16, 8, 0].map(
    (shift) => ((hexNumber & (255 << shift)) >> shift) / 255,
  );
}

function computeTGraph() {
  const tGraph = $data.graph.map((edge) =>
    edge.map((coord) => {
      const tEdge = transformCoord(coord);
      return [tEdge[0] / $size.width, tEdge[1] / $size.height];
    }),
  );

  positionBuffer.subdata(tGraph);
}

function drawGraph() {
  const zoom = $viz.map!.getZoom();

  gl.clear({ color: [0, 0, 0, 0], depth: 1 });
  drawFn({ offset, lineWidth: Math.max(1, (zoom / 12) ** 4) });
}

function getGraphOffset() {
  const rect = $viz
    .map!.getContainer()
    .querySelector('.leaflet-map-pane')!
    .getBoundingClientRect();

  offset = [rect.x / $size.width, rect.y / $size.height];
}

$: if ($data.isLoaded && $viz.map && canvasEl) {
  canvas.attr('width', $size.width).attr('height', $size.height);

  colorBuffer.subdata(
    $data.graph
      .flat()
      .map((coord) => hex2rgb(colorScale($interpolator.interpolate(coord))))
      .flat(),
  );

  drawFn = gl({
    frag: `
    precision mediump float;
    varying vec3 v_color;

    void main() {
      gl_FragColor = vec4(v_color, 1);
    }`,

    vert: `
    precision mediump float;
    attribute vec3 color; 
    attribute vec2 position;
    uniform vec2 offset;

    varying vec3 v_color;

    void main() {
      gl_Position = vec4(
        (position[0] + offset[0]) * 2.0 - 1.0,
        - (position[1] + offset[1]) * 2.0 + 1.0,
        0, 1
      );

      v_color = color;
    }`,

    attributes: {
      position: positionBuffer,
      color: colorBuffer,
    },

    uniforms: {
      offset: gl.prop('offset'),
    },

    viewport: {
      width: $size.width,
      height: $size.height,
    },

    primitive: 'lines',
    count: $data.graph.length * 2,
    lineWidth: gl.prop('lineWidth'),
  });

  computeTGraph();
  getGraphOffset();
  drawGraph();
}

onEvent('viz-map-hide', () => canvas.style('visibility', 'hidden'));
onEvent('viz-map-show', () => canvas.style('visibility', 'visible'));

onEvent('viz-map-zoom', () => {
  computeTGraph();
  drawGraph();
});

onEvent('viz-map-drag', () => {
  getGraphOffset();
  drawGraph();
});
</script>

<canvas bind:this={canvasEl}></canvas>

<style lang="scss">
canvas {
  width: 100vw;
  height: 100vh;
  position: absolute;
  z-index: 1000;
}
</style>
