import "./style.css";

const APPLICATION_TITLE = "Hi";
const rootElement = document.querySelector<HTMLDivElement>("#app")!;

type Point = { x: number, y: number };
let strokes: Point[][] = []; // Display list for current strokes
let redoStack: Point[][] = []; // Stack for redo operations
let currentStroke: Point[] = [];

function initializeApp() {
    // Create and append the application title
    const headerTitle = document.createElement("h1");
    headerTitle.textContent = APPLICATION_TITLE;
    rootElement.appendChild(headerTitle);

    // Create and append the canvas
    const canvas = createCanvas();

    // Create and append control buttons
    const clearButton = createButton("Clear Canvas", () => clearCanvas(canvas));
    const undoButton = createButton("Undo", () => undoLastStroke(canvas));
    const redoButton = createButton("Redo", () => redoLastStroke(canvas));

    // Set the browser tab title
    document.title = APPLICATION_TITLE;

    // Add event listeners
    setupDrawingOnCanvas(canvas);
    canvas.addEventListener('drawing-changed', () => redrawCanvas(canvas));

    // Append buttons to the DOM
    rootElement.appendChild(clearButton);
    rootElement.appendChild(undoButton);
    rootElement.appendChild(redoButton);
}

function createButton(label: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
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
            if (currentStroke.length > 0) {
                strokes.push(currentStroke);
                redoStack = []; // Clear redo stack whenever a new stroke is finished
                dispatchDrawingChangedEvent(canvas);
            }
            drawing = false;
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
    context.strokeStyle = 'white';

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

function clearCanvas(canvas: HTMLCanvasElement) {
    strokes = [];
    redoStack = [];
    currentStroke = [];
    redrawCanvas(canvas);
}

function undoLastStroke(canvas: HTMLCanvasElement) {
    if (strokes.length > 0) {
        const stroke = strokes.pop()!;
        redoStack.push(stroke);
        dispatchDrawingChangedEvent(canvas);
    }
}

function redoLastStroke(canvas: HTMLCanvasElement) {
    if (redoStack.length > 0) {
        const stroke = redoStack.pop()!;
        strokes.push(stroke);
        dispatchDrawingChangedEvent(canvas);
    }
}

// Initialize the application when the document is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);