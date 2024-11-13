import "./style.css";

const APPLICATION_TITLE = "Hi";
const rootElement = document.querySelector<HTMLDivElement>("#app")!;

const stickersData = [
    { icon: "😱", name: "shock" },
    { icon: "😰", name: "worried" },
    { icon: "😨", name: "fear" }
];

let lineThickness: number = 3;
let currentColor: string = getRandomColor();

class ToolPreview {
    position: Point;
    thickness: number;
    color: string;

    constructor(thickness: number, position: Point = { x: 0, y: 0 }, color: string = 'rgba(255, 255, 255, 0.5)') {
        this.thickness = thickness;
        this.position = position;
        this.color = color;
    }

    updatePosition(position: Point) {
        this.position = position;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.thickness / 2, 0, 2 * Math.PI);
        ctx.fillStyle = this.color; 
        ctx.fill();
    }
}

let currentToolPreview: ToolPreview | null = null;

class Stroke {
    points: Point[];
    thickness: number;
    color: string;

    constructor(thickness: number, color: string, points: Point[] = []) {
        this.thickness = thickness;
        this.points = points;
        this.color = color;
    }

    addPoint(point: Point) {
        this.points.push(point);
    }

    display(ctx: CanvasRenderingContext2D) {
        if (this.points.length === 0) return;

        ctx.lineWidth = this.thickness;
        ctx.lineCap = 'round';
        ctx.strokeStyle = this.color;

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
let strokes: Stroke[] = []; 
let redoStack: Stroke[] = []; 
let currentStroke: Stroke = new Stroke(lineThickness, currentColor);

class Sticker {
    position: Point;
    icon: string;
    rotation: number; 

    constructor(icon: string, position: Point = { x: 0, y: 0 }, rotation: number = Math.random() * 2 * Math.PI) {
        this.icon = icon;
        this.position = position;
        this.rotation = rotation;
    }

    updatePosition(position: Point) {
        this.position = position;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.rotation);

        ctx.font = '24px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, 0, 0);

        ctx.restore();
    }
}

let currentStickerPreview: Sticker | null = null;  
let stickers: Sticker[] = [];

// Updated UI setup function with stickers label
function initializeApp() {
    const headerTitle = document.createElement("h1");
    headerTitle.textContent = APPLICATION_TITLE;
    rootElement.appendChild(headerTitle);

    const container = document.createElement('div');
    container.classList.add('canvas-container');
    rootElement.appendChild(container);

    const canvas = createCanvas();
    container.appendChild(canvas);

    // Create a container for brush sizes.
    const brushSizeContainer = document.createElement('div');
    brushSizeContainer.classList.add('brush-size-container');

    const brushSizeLabel = document.createElement("span");
    brushSizeLabel.textContent = "Brush Sizes: ";
    brushSizeContainer.appendChild(brushSizeLabel);

    // Add brush size buttons to the brush size container.
    const thinButton = createButton("Thin", () => setlineThickness(1));
    const medButton = createButton("Medium (Default)", () => setlineThickness(3));
    const thickButton = createButton("Thick", () => setlineThickness(5));

    brushSizeContainer.appendChild(thinButton);
    brushSizeContainer.appendChild(medButton);
    brushSizeContainer.appendChild(thickButton);

    // Append the brush size container to the main container.
    container.appendChild(brushSizeContainer);

    // Create a container for sticker buttons.
    const stickerContainer = document.createElement('div');
    stickerContainer.classList.add('sticker-container');

    const stickerLabel = document.createElement("span");
    stickerLabel.textContent = "Stickers: ";
    stickerContainer.appendChild(stickerLabel);

    stickersData.forEach(sticker => {
        const button = createButton(sticker.icon, () => setStickerTool(sticker.icon));
        stickerContainer.appendChild(button);
    });

    const addCustomStickerButton = createButton("Add Custom Sticker", () => createCustomSticker());
    stickerContainer.appendChild(addCustomStickerButton);

    // Append the sticker container below the brush size container.
    container.appendChild(stickerContainer);

    // Create and append a single button container for the remaining buttons.
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container');

    const clearButton = createButton("Clear Canvas", () => clearCanvas(canvas));
    const undoButton = createButton("Undo", () => undoLastStroke(canvas));
    const redoButton = createButton("Redo", () => redoLastStroke(canvas));

    buttonContainer.appendChild(clearButton);
    buttonContainer.appendChild(undoButton);
    buttonContainer.appendChild(redoButton);

    const exportButton = createButton("Export", exportCanvas);
    buttonContainer.appendChild(exportButton);

    // Append the button container below the sticker container.
    container.appendChild(buttonContainer);

    document.title = APPLICATION_TITLE;
    setupDrawingOnCanvas(canvas);
    canvas.addEventListener('drawing-changed', () => redrawCanvas(canvas));
}

let currentTool: HTMLButtonElement | null = null;
let currentStickerIcon: string | null = null;

function setStickerTool(icon: string) {
    currentStickerIcon = icon;
    randomizeToolProperties();
    currentToolPreview = null;
}

function randomizeToolProperties() {
    currentColor = getRandomColor();
    if (currentStickerIcon) {
        const randomRotation = Math.random() * 2 * Math.PI;
        currentStickerPreview = new Sticker(currentStickerIcon, { x: 0, y: 0 }, randomRotation);
    }
}

function createCustomSticker() {
    const userIcon = prompt("Enter a new emoji or character for your sticker:", "🙂");
    if (userIcon) {
        stickersData.push({ icon: userIcon, name: `custom-${stickersData.length}` });
        const button = createButton(userIcon, () => setStickerTool(userIcon));
        document.querySelector('.sticker-container')?.appendChild(button);
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
        randomizeToolProperties();
        redrawCanvas(document.querySelector('#myCanvas')!);
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
        toolMoved(event);
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
        currentStroke = new Stroke(lineThickness, currentColor);
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
        currentToolPreview = new ToolPreview(lineThickness, point, currentColor);
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
    currentStroke = new Stroke(lineThickness, currentColor);
    stickers = [];
    redrawCanvas(canvas);
}

function exportCanvas() {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 1024;
    exportCanvas.height = 1024;
    const exportContext = exportCanvas.getContext('2d');
    if (!exportContext) return;

    exportContext.scale(4, 4); 

    for (const stroke of strokes) {
        stroke.display(exportContext);
    }
    for (const sticker of stickers) {
        sticker.draw(exportContext);
    }

    exportCanvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'canvas-export.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a); 
        URL.revokeObjectURL(url);
    });
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
    currentToolPreview = new ToolPreview(lineThickness, { x: 0, y: 0 }, currentColor);
    redrawCanvas(document.querySelector('#myCanvas')!);
}

function previewSticker(icon: string, canvas: HTMLCanvasElement, position: Point) {
    currentStickerPreview = new Sticker(icon, position, currentStickerPreview ? currentStickerPreview.rotation : 0);
    dispatchDrawingChangedEvent(canvas);
}

function addSticker(icon: string, position: Point) {
    const rotation = currentStickerPreview ? currentStickerPreview.rotation : 0;
    const newSticker = new Sticker(icon, position, rotation);
    stickers.push(newSticker);
    currentStickerPreview = null;
}

function getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

document.addEventListener('DOMContentLoaded', initializeApp);