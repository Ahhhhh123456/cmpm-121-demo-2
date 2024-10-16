import "./style.css";

const APPLICATION_TITLE = "Hi";
const rootElement = document.querySelector<HTMLDivElement>("#app")!;

type Point = { x: number, y: number };
let strokes: Point[][] = []; // Store all strokes; each stroke is an array of points
let currentStroke: Point[] = [];

function initializeApp() {
    // Create and append the application title
    const headerTitle = document.createElement("h1");
    headerTitle.textContent = APPLICATION_TITLE;
    rootElement.appendChild(headerTitle);

    // Create and append the canvas
    const canvas = createCanvas();

    // Create and append a clear button
    const clearButton = document.createElement('button');
    clearButton.textContent = "Clear Canvas";
    rootElement.appendChild(clearButton);

    // Set the browser tab title
    document.title = APPLICATION_TITLE;

    // Add event listeners
    clearButton.addEventListener('click', () => clearCanvas(canvas));
    setupDrawingOnCanvas(canvas);
    canvas.addEventListener('drawing-changed', () => redrawCanvas(canvas));
}

function createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.id = 'myCanvas';
    canvas.width = 256;
    canvas.height = 256;
    rootElement.appendChild(canvas);
    return canvas;
}

function setupDrawingOnCanvas(canvas: HTMLCanvasElement) {
    let drawing = false;

    const startDrawing = (event: MouseEvent) => {
        drawing = true;
        currentStroke = [];
        addPoint(event, canvas);
    };

    const endDrawing = () => {
        if (drawing) {
            drawing = false;
            if (currentStroke.length > 0) {
                strokes.push(currentStroke);
                dispatchDrawingChangedEvent(canvas);
            }
        }
    };

    const addPoint = (event: MouseEvent, canvas: HTMLCanvasElement) => {
        if (!drawing) return;
        const point: Point = {
            x: event.clientX - canvas.offsetLeft,
            y: event.clientY - canvas.offsetTop
        };
        currentStroke.push(point);
        dispatchDrawingChangedEvent(canvas);
    };

    // Attach mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mouseup', endDrawing);
    canvas.addEventListener('mousemove', (event) => addPoint(event, canvas));
}

// Dispatch a custom "drawing-changed" event
function dispatchDrawingChangedEvent(canvas: HTMLCanvasElement) {
    const event = new CustomEvent('drawing-changed');
    canvas.dispatchEvent(event);
}

// Clear and redraw the canvas based on current strokes
function redrawCanvas(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) return;

    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.lineWidth = 2;
    context.lineCap = 'round';
    context.strokeStyle = 'white'; // The draw color is white

    for (const stroke of strokes) {
        context.beginPath();
        for (let i = 0; i < stroke.length; i++) {
            const point = stroke[i];
            if (i === 0) {
                context.moveTo(point.x, point.y);
            } else {
                context.lineTo(point.x, point.y);
            }
        }
        context.stroke();
    }
}

// Clear the canvas and reset strokes
function clearCanvas(canvas: HTMLCanvasElement) {
    strokes = [];
    currentStroke = [];
    redrawCanvas(canvas);
}

// Initialize the application when the document is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);