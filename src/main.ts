import "./style.css";

const APPLICATION_TITLE = "Hi";
const rootElement = document.querySelector<HTMLDivElement>("#app")!;

let lineThickness: number = 3;

class Stroke {
    points: Point[];
    thickness: number;

    constructor(thickness: number, points: Point[] = []) {
        this.thickness = thickness;
        this.points = points;
    }

    addPoint(point: Point) {
        this.points.push(point);
    }

    display(ctx: CanvasRenderingContext2D) {
        if (this.points.length === 0) return;

        ctx.lineWidth = this.thickness; // Use the stroke's specific thickness
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'white'; // The draw color is white

        ctx.beginPath();
        for (let i = 0; i < this.points.length; i++) {
            const point = this.points[i];
            if (i === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }
        ctx.stroke();
    }
}

type Point = { x: number, y: number };
let strokes: Stroke[] = []; // Display list for current strokes
let redoStack: Stroke[] = []; // Stack for redo operations
let currentStroke: Stroke = new Stroke(lineThickness);

function initializeApp() {
    // Create and append the application title
    const headerTitle = document.createElement("h1");
    headerTitle.textContent = APPLICATION_TITLE;
    rootElement.appendChild(headerTitle);

    // Create a container for the canvas and controls
    const container = document.createElement('div');
    container.classList.add('canvas-container');
    rootElement.appendChild(container);

    // Create and append the canvas
    const canvas = createCanvas();
    container.appendChild(canvas);

    // Create control buttons
    const clearButton = createButton("Clear Canvas", () => clearCanvas(canvas));
    const undoButton = createButton("Undo", () => undoLastStroke(canvas));
    const redoButton = createButton("Redo", () => redoLastStroke(canvas));
    const thinButton = createButton("Thin", () => setlineThickness(1));
    const medButton = createButton("Medium", () => setlineThickness(3)); // Default Thickness   
    const thickButton = createButton("Thick", () => setlineThickness(5)); 

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container');
    buttonContainer.appendChild(clearButton);
    buttonContainer.appendChild(undoButton);
    buttonContainer.appendChild(redoButton);
    buttonContainer.appendChild(thinButton);
    buttonContainer.appendChild(medButton);
    buttonContainer.appendChild(thickButton);

    container.appendChild(buttonContainer); // Append the button container

    // Set the browser tab title
    document.title = APPLICATION_TITLE;

    // Add event listeners for canvas
    setupDrawingOnCanvas(canvas);
    canvas.addEventListener('drawing-changed', () => redrawCanvas(canvas));
}

let currentTool: HTMLButtonElement | null = null;

function createButton(label: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = label;
    button.addEventListener('click', () => {
      // Update the current tool and styling
      if (currentTool) {
          currentTool.classList.remove('selectedTool');
      }
      currentTool = button;
      button.classList.add('selectedTool');
      onClick();
    });
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
        currentStroke = new Stroke(lineThickness); // Initialize current stroke with the current global thickness
        addPoint(event, canvas);
    };

    const endDrawing = () => {
        if (drawing) {
            if (currentStroke.points.length > 0) {
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
        currentStroke.addPoint(point);
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

    // Call display method on each stroke
    for (const stroke of strokes) {
        stroke.display(context);
    }
}

function clearCanvas(canvas: HTMLCanvasElement) {
    strokes = [];
    redoStack = [];
    currentStroke = new Stroke(lineThickness);
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

function setlineThickness(thickness: number) {
     lineThickness = thickness;
}

// Initialize the application when the document is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);