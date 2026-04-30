import 'diagram-js/assets/diagram-js.css';
import Diagram from 'diagram-js';
import CoreModule from 'diagram-js/lib/core';

// --- CUSTOM RENDERER (Adapted from reference files) ---
function CustomRenderer(eventBus) {
  eventBus.on('render.shape', function(event) {
    const gfx = event.gfx;
    const element = event.element;

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', element.width);
    rect.setAttribute('height', element.height);
    rect.setAttribute('fill', 'white');
    rect.setAttribute('stroke', '#333');
    rect.setAttribute('stroke-width', '2');
    rect.setAttribute('rx', '4');
    gfx.appendChild(rect);

    // Added text so the Start/Process/End blocks are distinguishable
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '15');
    text.setAttribute('y', element.height / 2 + 5);
    text.setAttribute('fill', '#333');
    text.setAttribute('font-family', 'sans-serif');
    text.setAttribute('font-weight', 'bold');
    text.textContent = element.id;
    gfx.appendChild(text);

    return rect;
  });

  eventBus.on('render.connection', function(event) {
    const gfx = event.gfx;
    const element = event.element;

    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    const points = element.waypoints.map(w => `${w.x},${w.y}`).join(' ');
    
    polyline.setAttribute('points', points);
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('stroke', '#333');
    polyline.setAttribute('stroke-width', '2');

    gfx.appendChild(polyline);
    return polyline;
  });
}

CustomRenderer.$inject = [ 'eventBus' ];
const customRenderModule = {
  __init__: [ 'customRenderer' ],
  customRenderer: [ 'type', CustomRenderer ]
};
// ------------------------------------------------------

// 1. Initialize Diagram
const diagram = new Diagram({
  canvas: { container: document.getElementById('canvas-container') },
  modules: [ CoreModule, customRenderModule ]
});

const canvas = diagram.get('canvas');
const elementFactory = diagram.get('elementFactory');
const elementRegistry = diagram.get('elementRegistry');
const eventBus = diagram.get('eventBus');

// 2. Set up the root element
const root = elementFactory.createRoot({ id: 'root' });
canvas.setRootElement(root);

// --- EXTENSION: Shape Counter ---
let shapeCount = 0;
const countDisplay = document.getElementById('shape-count');
eventBus.on('shape.added', (event) => {
  // We only want to count actual shapes, not the invisible root element
  if (event.element !== root) {
    shapeCount++;
    countDisplay.innerText = shapeCount;
  }
});

// 3. Add the shapes
const startShape = elementFactory.createShape({ id: 'Start', x: 100, y: 100, width: 120, height: 60 });
canvas.addShape(startShape, root);

const processShape = elementFactory.createShape({ id: 'Process', x: 300, y: 100, width: 120, height: 60 });
canvas.addShape(processShape, root);

const endShape = elementFactory.createShape({ id: 'End', x: 500, y: 100, width: 120, height: 60 });
canvas.addShape(endShape, root);

// --- EXTENSION: Fourth "Error" Shape ---
const errorShape = elementFactory.createShape({ id: 'Error', x: 300, y: 250, width: 120, height: 60 });
canvas.addShape(errorShape, root);

// 4. Connect the shapes
const c1 = elementFactory.createConnection({
  id: 'connection1',
  source: startShape,
  target: processShape,
  waypoints: [
    { x: 220, y: 130 },
    { x: 300, y: 130 }
  ]
});
canvas.addConnection(c1, root);

const c2 = elementFactory.createConnection({
  id: 'connection2',
  source: processShape,
  target: endShape,
  waypoints: [
    { x: 420, y: 130 },
    { x: 500, y: 130 }
  ]
});
canvas.addConnection(c2, root);

// --- EXTENSION: Connection routed below the main flow ---
const c3 = elementFactory.createConnection({
  id: 'connection3',
  source: processShape,
  target: errorShape,
  waypoints: [
    { x: 360, y: 160 }, // Bottom center of Process
    { x: 360, y: 250 }  // Top center of Error
  ]
});
canvas.addConnection(c3, root);

// Verify elementRegistry usage required by prompt
console.log('Successfully retrieved via elementRegistry:', elementRegistry.get('Process'));

// 5. Wire Toolbar Buttons
document.getElementById('fit-btn').addEventListener('click', () => {
  canvas.zoom('fit-viewport');
});

document.getElementById('zoom-in-btn').addEventListener('click', () => {
  const currentZoom = canvas.zoom();
  canvas.zoom(currentZoom + 0.25);
});

document.getElementById('zoom-out-btn').addEventListener('click', () => {
  const currentZoom = canvas.zoom();
  canvas.zoom(currentZoom - 0.25);
});
// --- EXTENSION: Reset Zoom Button ---
document.getElementById('reset-btn').addEventListener('click', () => {
  canvas.zoom(1.0);
});