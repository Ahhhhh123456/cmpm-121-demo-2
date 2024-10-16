import "./style.css";

const APPLICATION_TITLE = "Hi";
const rootElement = document.querySelector<HTMLDivElement>("#app")!;

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
    const context = canvas.getContext('2d');
    if (!context) return;

    let drawing = false;

    const startDrawing = (event: MouseEvent) => {
        drawing = true;
        draw(event);
    };

    const endDrawing = () => {
        drawing = false;
        context.beginPath(); // Prepare for a new path
    };

    const draw = (event: MouseEvent) => {
        if (!drawing) return;

        context.lineWidth = 2;
        context.lineCap = 'round';
        context.strokeStyle = 'white';

        context.lineTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
        context.stroke();
        context.beginPath(); // Ensure continuity in strokes
        context.moveTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mouseup', endDrawing);
    canvas.addEventListener('mousemove', draw);
}

function clearCanvas(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// Initialize the application when the document is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);