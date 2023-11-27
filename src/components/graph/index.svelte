<script lang="ts">
import * as d3 from 'd3';
import regl from 'regl';
import { viz } from '@/stores/viz';
import { data } from '@/stores/data';
import { onEvent, onResize } from '@/utils/svelte';
import { transformCoord } from '@/utils/leaflet';

let canvasEl: HTMLCanvasElement;
$: canvas = d3.select(canvasEl);

let size = onResize();

$: graphData = $data.streetGraph
  .filter(
    (edge) =>
      !(
        isNaN(edge.start[0]) ||
        isNaN(edge.start[1]) ||
        isNaN(edge.end[0]) ||
        isNaN(edge.end[1])
      ),
  )
  .map((edge) => [edge.start, edge.end]);

$: gl = regl(canvasEl);

$: positionBuffer = gl.buffer({
  length: graphData.length * 16,
  type: 'float',
  usage: 'dynamic',
});

let offset = [0, 0];
let drawFn: regl.DrawCommand;

function computeTGraph() {
  const tGraph = graphData.map((edge) =>
    edge.map((edge) => {
      const tEdge = transformCoord(edge);
      return [tEdge[0] / $size.width, tEdge[1] / $size.height];
    }),
  );

  positionBuffer.subdata(tGraph);
}

function drawGraph() {
  gl.clear({ color: [0, 0, 0, 0], depth: 1 });
  drawFn({ offset });
}

$: if ($data.isLoaded && $viz.map && canvasEl) {
  canvas.attr('width', $size.width).attr('height', $size.height);

  // positionBuffer =

  drawFn = gl({
    frag: `
    precision mediump float;
    uniform vec4 color;
    void main() {
      gl_FragColor = color;
    }`,

    vert: `
    precision mediump float;
    attribute vec2 position;
    uniform vec2 offset;

    void main() {
      gl_Position = vec4(
        (position[0] + offset[0]) * 2.0 - 1.0,
        - (position[1] + offset[1]) * 2.0 + 1.0,
        0, 1
      );
    }`,

    attributes: {
      position: positionBuffer,
    },

    uniforms: {
      color: [0, 0, 0, 1],
      offset: gl.prop('offset'),
    },

    viewport: {
      width: $size.width,
      height: $size.height,
    },

    primitive: 'lines',
    count: graphData.length,
  });

  computeTGraph();
  drawGraph();
}

onEvent('viz-map-hide', () => canvas.style('visibility', 'hidden'));
onEvent('viz-map-show', () => canvas.style('visibility', 'visible'));

onEvent('viz-map-zoom', () => {
  computeTGraph();
  drawGraph();
});

onEvent('viz-map-drag', () => {
  const rect = $viz
    .map!.getContainer()
    .querySelector('.leaflet-map-pane')!
    .getBoundingClientRect();

  offset = [rect.x / $size.width, rect.y / $size.height];

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
