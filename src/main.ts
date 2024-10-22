import "./style.css";

const APPLICATION_TITLE = "Hi";
const rootElement = document.querySelector<HTMLDivElement>("#app")!;

// Define Sticker Data interface
interface StickerData {
    icon: string;
    name: string;
}

// Initial array for managing sticker objects
let stickersData: StickerData[] = [
    { icon: "😱", name: "shock" },
    { icon: "😰", name: "worried" },
    { icon: "😨", name: "fear" }
];

let lineThickness: number = 3;

class ToolPreview {
    position: Point;
    thickness: number;

    constructor(thickness: number, position: Point = { x: 0, y: 0 }) {
        this.thickness = thickness;
        this.position = position;
    }

    updatePosition(position: Point) {
        this.position = position;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.thickness / 2, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // Semi-transparent for preview
        ctx.fill();
    }
}

let currentToolPreview: ToolPreview | null = null;

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

class Sticker {
    position: Point;
    icon: string;

    constructor(icon: string, position: Point = { x: 0, y: 0 }) {
        this.icon = icon;
        this.position = position;
    }

    updatePosition(position: Point) {
        this.position = position;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.font = '24px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, this.position.x, this.position.y);
    }
}

let currentStickerPreview: Sticker | null = null;  // To preview sticker before placement
let stickers: Sticker[] = []; // List to hold added stickers

function initializeApp() {
    const headerTitle = document.createElement("h1");
    headerTitle.textContent = APPLICATION_TITLE;
    rootElement.appendChild(headerTitle);

    const container = document.createElement('div');
    container.classList.add('canvas-container');
    rootElement.appendChild(container);

    const canvas = createCanvas();
    container.appendChild(canvas);

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container');

    const clearButton = createButton("Clear Canvas", () => clearCanvas(canvas));
    const undoButton = createButton("Undo", () => undoLastStroke(canvas));
    const redoButton = createButton("Redo", () => redoLastStroke(canvas));
    const thinButton = createButton("Thin", () => setlineThickness(1));
    const medButton = createButton("Medium", () => setlineThickness(3));
    const thickButton = createButton("Thick", () => setlineThickness(5));

    buttonContainer.appendChild(clearButton);
    buttonContainer.appendChild(undoButton);
    buttonContainer.appendChild(redoButton);
    buttonContainer.appendChild(thinButton);
    buttonContainer.appendChild(medButton);
    buttonContainer.appendChild(thickButton);

    // Create sticker buttons dynamically
    stickersData.forEach(sticker => {
        const button = createButton(sticker.icon, () => setStickerTool(sticker.icon));
        buttonContainer.appendChild(button);
    });

    // Add a button for custom stickers
    const addCustomStickerButton = createButton("Add Custom Sticker", () => createCustomSticker());
    buttonContainer.appendChild(addCustomStickerButton);

    container.appendChild(buttonContainer); // Append the button container
    document.title = APPLICATION_TITLE;

    setupDrawingOnCanvas(canvas);
    canvas.addEventListener('drawing-changed', () => redrawCanvas(canvas));
}

let currentTool: HTMLButtonElement | null = null;
let currentStickerIcon: string | null = null;

function setStickerTool(icon: string) {
    currentStickerIcon = icon;
    currentToolPreview = null;
}

function createCustomSticker() {
    const userIcon = prompt("Enter a new emoji or character for your sticker:", "🙂");
    if (userIcon) {
        stickersData.push({ icon: userIcon, name: `custom-${stickersData.length}` });
        const button = createButton(userIcon, () => setStickerTool(userIcon));
        document.querySelector('.button-container')?.appendChild(button);
    }
}

function createButton(label: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = label;
    button.addEventListener('click', () => {
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

let drawing = false;
function setupDrawingOnCanvas(canvas: HTMLCanvasElement) {

    canvas.addEventListener('mousemove', (event) => {
        if (currentStickerIcon) {
            const point = { 
                x: event.clientX - canvas.offsetLeft, 
                y: event.clientY - canvas.offsetTop 
            };
            previewSticker(currentStickerIcon, canvas, point);
        }
        toolMoved(event); // Update tool movement
    });

    canvas.addEventListener('mousedown', () => {
        if (currentStickerIcon && currentStickerPreview) {
            addSticker(currentStickerIcon, currentStickerPreview.position);
            currentStickerPreview = null;
            dispatchDrawingChangedEvent(canvas);
        }
    });

    const startDrawing = (event: MouseEvent) => {
        drawing = true;
        currentStroke = new Stroke(lineThickness);
        currentToolPreview = null;
        addPoint(event, canvas);
    };

    const endDrawing = () => {
        if (drawing && currentStroke.points.length > 0) {
            strokes.push(currentStroke);
            redoStack = [];
            dispatchDrawingChangedEvent(canvas);
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

    const toolMoved = (event: MouseEvent) => {
        const point = {
            x: event.clientX - canvas.offsetLeft,
            y: event.clientY - canvas.offsetTop
        };
        currentToolPreview = new ToolPreview(lineThickness, point);

        redrawCanvas(canvas);
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mouseup', endDrawing);
    canvas.addEventListener('mousemove', (event) => {
        addPoint(event, canvas);
        toolMoved(event);
    });
}

function dispatchDrawingChangedEvent(canvas: HTMLCanvasElement) {
    const event = new CustomEvent('drawing-changed');
    canvas.dispatchEvent(event);
}

function redrawCanvas(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokes) {
        stroke.display(context);
    }
    
    if (currentToolPreview && !drawing) {
        currentToolPreview.draw(context);
    }

    for (const sticker of stickers) {
        sticker.draw(context);
    }

    if (currentStickerPreview && !drawing) {
        currentStickerPreview.draw(context);
    }
}

function clearCanvas(canvas: HTMLCanvasElement) {
    strokes = [];
    redoStack = [];
    currentStroke = new Stroke(lineThickness);
    stickers = [];
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

function previewSticker(icon: string, canvas: HTMLCanvasElement, position: Point) {
    currentStickerPreview = new Sticker(icon, position);
    dispatchDrawingChangedEvent(canvas);
}

function addSticker(icon: string, position: Point) {
    const newSticker = new Sticker(icon, position);
    stickers.push(newSticker);
    currentStickerPreview = null;
}

document.addEventListener('DOMContentLoaded', initializeApp);