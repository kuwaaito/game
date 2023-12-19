//@ts-check
import * as CONFIG from "../config.js";
import * as Display from "./display/main.js";
import * as Error from "./error.js";
import * as Vector from "./vector.js";

/** @type { { [key: string]: boolean } } */
export let Keys  =  {};
export const Mouse = {
    /** @type { Vector.Entity } */
    Position: {x: 0, y: 0},
    Button:   {Left: false, Right: false}
};
export function initialize () {
    window.addEventListener("keydown", Key_Press);
    window.addEventListener("keyup",   Key_Release);
    const Canvas = Display.Canvas;
    if (Canvas == null) { 
        Error.emit(CONFIG.DEBUG_INPUT, "Display.Canvas is null.");
        return Error.CODE.NOT_FOUND; 
    }
    Canvas.addEventListener("mousemove", Mouse_Move);
    Canvas.addEventListener("mousedown", Mouse_Press);
    Canvas.addEventListener("mouseup",   Mouse_Release);
}
export function Key_Press (event) {
    if (CONFIG.DEBUG_INPUT) { console.log(event.code); }
    Keys[event.code] = true;
}
export function Key_Release (event) {
    if (CONFIG.DEBUG_INPUT) { console.log(event.code); }
    Keys[event.code] = false;
}
export function Mouse_Move (event) {
    const Canvas = Display.Canvas;
    if (Canvas == null) { 
        Error.emit(CONFIG.DEBUG_INPUT, "Display.Canvas is null.");
        return Error.CODE.NOT_FOUND; 
    }
    const Rect = Canvas.getBoundingClientRect();
    Mouse.Position.x = event.clientX - Rect.left;
    Mouse.Position.y = event.clientY - Rect.top;
}
export function Mouse_Press (event) {
    if (CONFIG.DEBUG_INPUT) { console.log(event.button); }
    if (event.button == 0) { Mouse.Button.Left  = true; }
    if (event.button == 2) { Mouse.Button.Right = true; }
}
export function Mouse_Release (event) {
    if (CONFIG.DEBUG_INPUT) { console.log(event.button); }
    if (event.button == 0) { Mouse.Button.Left  = false; }
    if (event.button == 2) { Mouse.Button.Right = false; }
}
export function Reset () {
    Mouse.Button.Left  = false;
    Mouse.Button.Right = false;
    Keys               = {};
}