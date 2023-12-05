<script lang="ts">
import * as d3 from 'd3';
import * as turf from '@turf/turf';
import regl from 'regl';
import dijkstra from 'graphology-shortest-path/dijkstra';

import { viz, interpolator } from '@/stores/viz';
import { data } from '@/stores/data';
import { onEvent, onResize } from '@/utils/svelte';
import { transformCoord, transformLayerPoint } from '@/utils/leaflet';
import { colorScale } from '@/utils/viz';

const FLOAT_BYTES = 4;

let canvasEl: HTMLCanvasElement;
$: canvas = d3.select(canvasEl);

let size = onResize();

$: nodes = turf.featureCollection(
  $data.graph?.mapNodes((node) =>
    turf.point(node.split(',').map(Number).toReversed()),
  ),
);

$: edges = $data.graph?.mapEdges((_, attrs) => [attrs['start'], attrs['end']]);

$: gl = regl(canvasEl);

$: edgeBuffer = gl.buffer({
  length: edges?.length * FLOAT_BYTES * 4,
  type: 'float',
  usage: 'dynamic',
});

$: edgeColorBuffer = gl.buffer({
  length: edges?.length * FLOAT_BYTES * 3 * 2,
  type: 'float',
  usage: 'dynamic',
});

let selectedNodes = [] as [number, number][];
$: selectedNodeBuffer = gl.buffer({
  length: FLOAT_BYTES * 4,
  type: 'float',
  usage: 'dynamic',
});

let dijkstraPath: number[][] = [];
let dijkstraPositionBuffer: regl.Buffer;

let offset = [0, 0];
let drawEdgesFn: regl.DrawCommand;
let drawHoveredNodeFn: regl.DrawCommand;
let drawDijkstraPathFn: regl.DrawCommand;

function hex2rgb(hex: string) {
  const hexNumber = parseInt(hex.slice(1), 16);
  return [16, 8, 0].map(
    (shift) => ((hexNumber & (255 << shift)) >> shift) / 255,
  );
}

function computeTGraph() {
  const tGraph = edges.map((edge) =>
    edge.map((coord) => {
      const tEdge = transformCoord(coord);
      return [tEdge[0] / $size.width, tEdge[1] / $size.height];
    }),
  );

  edgeBuffer.subdata(tGraph);
}

function getGraphOffset() {
  const rect = $viz
    .map!.getContainer()
    .querySelector('.leaflet-map-pane')!
    .getBoundingClientRect();

  offset = [rect.x / $size.width, rect.y / $size.height];
}

function computeSelectedNodeBuffer() {
  selectedNodeBuffer = gl.buffer(
    selectedNodes.map((node) => {
      const point = transformCoord(node!);
      return [point[0] / $size.width, point[1] / $size.height];
    }),
  );
}

function computeDijkstraPath() {
  if (selectedNodes.length === 2) {
    const rawPath = dijkstra.bidirectional(
      $data.graph,
      selectedNodes[0],
      selectedNodes[1],
      (_, attrs) => {
        const s = attrs['start'];
        const e = attrs['end'];

        return (
          $interpolator.interpolate([(s[0] + e[0]) / 2, (s[1] + e[1]) / 2]) *
          attrs['length']
        );
      },
    );

    dijkstraPath = rawPath
      .map((coords) => coords.split(',').map(Number))
      .map((node, i) => {
        if (i !== 0 && i !== rawPath.length - 1) {
          return [node, node];
        }

        return [node];
      })
      .flat();
  } else {
    dijkstraPath = [];
  }
}

function computeDijkstraPathBuffer() {
  dijkstraPositionBuffer = gl.buffer(
    dijkstraPath
      .map(transformCoord)
      .map(([x, y]) => [x / $size.width, y / $size.height])
      .flat(),
  );
}

function drawGraph() {
  const zoom = $viz.map!.getZoom();
  const lineWidth = Math.min(
    Math.max(1, (zoom / 12) ** 4),
    gl.limits.lineWidthDims[1],
  );

  gl.clear({ color: [0, 0, 0, 0], depth: 1 });

  drawHoveredNodeFn({ position: selectedNodeBuffer, offset });

  if (dijkstraPath.length > 0) {
    drawDijkstraPathFn({
      position: dijkstraPositionBuffer,
      count: dijkstraPath.length,
      offset: offset,
      lineWidth: lineWidth,
    });
  }

  drawEdgesFn({ offset, lineWidth });
}

$: if ($data.isLoaded && $viz.map && canvasEl) {
  canvas.attr('width', $size.width).attr('height', $size.height);

  edgeColorBuffer.subdata(
    edges
      .flat()
      .map((coord) => hex2rgb(colorScale($interpolator.interpolate(coord))))
      .flat(),
  );

  drawEdgesFn = gl({
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
      position: edgeBuffer,
      color: edgeColorBuffer,
    },

    uniforms: {
      offset: gl.prop('offset'),
    },

    viewport: {
      width: $size.width,
      height: $size.height,
    },

    primitive: 'lines',
    count: edges.length * 2,
    lineWidth: gl.prop('lineWidth'),
  });

  drawHoveredNodeFn = gl({
    frag: `
    precision mediump float;

    void main() {
      gl_FragColor = vec4(0, 0, 0, 1);
    }`,

    vert: `
    precision mediump float;
    attribute vec3 color; 
    attribute vec2 position;
    uniform vec2 offset;

    void main() {
      gl_PointSize = 10.0;
      gl_Position = vec4(
        (position[0] + offset[0]) * 2.0 - 1.0,
        - (position[1] + offset[1]) * 2.0 + 1.0,
        0, 1
      );

    }`,

    attributes: {
      position: gl.prop('position'),
    },

    uniforms: {
      offset: gl.prop('offset'),
    },

    viewport: {
      width: $size.width,
      height: $size.height,
    },

    primitive: 'points',
    count: 2,
  });

  drawDijkstraPathFn = gl({
    frag: `
      precision mediump float;

      void main() {
        gl_FragColor = vec4(0, 0, 0, 1);
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
      }`,

    attributes: {
      position: gl.prop('position'),
    },

    uniforms: {
      offset: gl.prop('offset'),
    },

    viewport: {
      width: $size.width,
      height: $size.height,
    },

    primitive: 'lines',
    count: gl.prop('count'),
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
  computeSelectedNodeBuffer();
  computeDijkstraPathBuffer();
  drawGraph();
});

onEvent('viz-map-drag', () => {
  getGraphOffset();
  drawGraph();
});

let startX = 0;
let startY = 0;

onEvent('mousedown', (e) => {
  startX = e.pageX;
  startY = e.pageY;
});

onEvent('mouseup', (e) => {
  if (Math.abs(e.pageX - startX) > 5 || Math.abs(e.pageY - startY) > 5) {
    return;
  }

  const coord = transformLayerPoint([e.pageX, e.pageY]);
  const nearestCoord = turf
    .nearestPoint(turf.point(coord.toReversed()), nodes)
    .geometry.coordinates.toReversed() as [number, number];

  if (selectedNodes.length < 2) {
    selectedNodes.push(nearestCoord);
  } else {
    selectedNodes = [nearestCoord];
  }

  computeSelectedNodeBuffer();
  computeDijkstraPath();
  computeDijkstraPathBuffer();
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
