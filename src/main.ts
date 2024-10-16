import "./style.css";

const APP_NAME = "Hi";
const app = document.querySelector<HTMLDivElement>("#app")!;


const title = document.createElement("h1");
title.textContent = APP_NAME;

// Append the h1 element to the app
app.appendChild(title);

// Update the document title
document.title = APP_NAME;


function createCanvas() {
    const appDiv = document.getElementById('app');
    if (appDiv) {
        const canvas = document.createElement('canvas');
        canvas.id = 'myCanvas';
        canvas.width = 256;
        canvas.height = 256;
        appDiv.appendChild(canvas);
    }
}

document.addEventListener('DOMContentLoaded', createCanvas);

