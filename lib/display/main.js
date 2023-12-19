//@ts-check
import * as CONFIG from "../../config.js";
import * as Error from "../error.js";
import * as Input from "../input.js";
import * as Sprite_Sheet from "./sprite/sheet.js";
import * as Vector from "../vector.js";
/** @type { HTMLCanvasElement | null } */
export let Canvas  =     null;
/** @type { CanvasRenderingContext2D | null } */
export let Context =    null;
/** @type { { Position: Vector.Entity, Target: Vector.Entity, zoom: number } } */
export const Camera = {
    Position: {x: 0, y: 0},
    Target:   {x: 0, y: 0},
    zoom:     CONFIG.DISPLAY_MAGNIFICATION,
}
/**
 * Get the offset of a position relative to the camera
 * @param {Vector.Entity} position - The position in absolute coordinates
 * @returns { Error.CODE|Vector.Entity }
 */
export function camera_offset (position) {
    if (Canvas == null) { 
        Error.emit(CONFIG.DEBUG_DISPLAY, "Canvas is null.");
        return Error.CODE.NOT_FOUND; 
    }
    return {
        x: (
            position.x 
            - Camera.Position.x                         // Offset by camera position
        ) * Camera.zoom  // Scale by relative zoom
        + Canvas.width / 2                              // Center the camera
        ,y: (
            position.y 
            - Camera.Position.y                         // Offset by camera position
        ) * Camera.zoom // Scale by relative zoom
        + Canvas.height / 2                             // Center the camera
    }
}
/**
 * Get the position of a point in world space relative to the camera
 * @param {Vector.Entity} position - The position in screen coordinates
 * @returns { Error.CODE|Vector.Entity }
 */
export function camera_interpret (position) {
    if (Canvas == null) { 
        Error.emit(CONFIG.DEBUG_DISPLAY, "Canvas is null.");
        return Error.CODE.NOT_FOUND; 
    }
    return {
        x: (
            position.x 
            - Canvas.width / 2                          // Center the camera
        ) / Camera.zoom  // Scale by relative zoom
        + Camera.Position.x                         // Offset by camera position
        ,y: (
            position.y 
            - Canvas.height / 2                         // Center the camera
        ) / Camera.zoom // Scale by relative zoom
        + Camera.Position.y                         // Offset by camera position
    }
}
export function camera_scale () {
    // how big to draw sprites
    return Camera.zoom / CONFIG.DISPLAY_MAGNIFICATION * CONFIG.DISPLAY_MAGNIFICATION;
}
/** @type { () => Error.CODE|void } */
export function initialize () {
    // @ts-ignore
    Canvas  = document.getElementById(CONFIG.DISPLAY_ID);
    if (Canvas == null)  { 
        Error.emit(CONFIG.DEBUG_DISPLAY, "Canvas is null.");
        return Error.CODE.NOT_FOUND; 
    }
    // Configure the Canvas
    Canvas.width  = CONFIG.DISPLAY_WIDTH  * CONFIG.DISPLAY_MAGNIFICATION;
    Canvas.height = CONFIG.DISPLAY_HEIGHT * CONFIG.DISPLAY_MAGNIFICATION;
    Context = Canvas.getContext("2d");
    if (Context == null) { 
        Error.emit(CONFIG.DEBUG_DISPLAY, "Context is null.");
        return Error.CODE.NOT_FOUND; 
    }
    // This will be pixel art, so disable anti-aliasing
    Context.imageSmoothingEnabled = false;
    // Prevent the canvas from being highlighted
    Canvas.onselectstart = () => false;
    // Allow us to handle right-clicks
    Canvas.oncontextmenu = () => false;
    // Prevent the canvas from showing the cursor
    Canvas.style.cursor = "none";
    // When context is lost reset input
    Canvas.addEventListener("webglcontextlost", Input.Reset);
}
export const Draw = {
    /**
     * A function for drawing a circle on the canvas
     * @param {Vector.Entity} position  - The position of the circle center
     * @param {number} radius           - The radius of the circle in pixels
     * @param {string} color            - The color of the circle
     * @param {number} outline          - The thickness of the outline in pixels, 0 for no outline and fill instead
     * @returns {Error.CODE|void}            - Returns Error.CODE.NOT_FOUND if Context is null
     */
    circle: function (position, radius, color, outline = 0) {
        if (Context == null) { 
            Error.emit(CONFIG.DEBUG_DISPLAY, "Context is null.");
            return Error.CODE.NOT_FOUND; 
        }
        Context.beginPath();
        Context.arc(position.x, position.y, radius, 0, 2 * Math.PI);
        if (outline > 0) {
            Context.lineWidth = outline;
            Context.strokeStyle = color;
            Context.stroke();
        } else {
            Context.fillStyle = color;
            Context.fill();
        }
    },
    /**
     * A function for drawing a rectangle on the canvas
     * @param {Vector.Entity} position   - The position of the rectangle center
     * @param {Vector.Entity} dimensions - The size of the rectangle
     * @param {string} color             - The color of the rectangle
     * @param {number} outline           - The thickness of the outline in pixels, 0 for no outline and fill instead
     * @returns {Error.CODE|void}             - Returns Error.CODE.NOT_FOUND if Context is null
     */
    rectangle: function (position, dimensions, color, outline = 0) {
        if (Context == null) { 
            Error.emit(CONFIG.DEBUG_DISPLAY, "Context is null.");
            return Error.CODE.NOT_FOUND; 
        }
        const x = position.x - dimensions.x / 2;
        const y = position.y - dimensions.y / 2;
        if (outline > 0) {
            Context.lineWidth = outline;
            Context.strokeStyle = color;
            Context.strokeRect(x, y, dimensions.x, dimensions.y);
        } else {
            Context.fillStyle = color;
            Context.fillRect(x, y, dimensions.x, dimensions.y);
        }
    },
    /**
     * A function for drawing a line on the canvas
     * @param {Vector.Entity} start     - The position of the line start
     * @param {Vector.Entity} end       - The position of the line end
     * @param {string} color            - The color of the line
     * @param {number} thickness        - The thickness of the line in pixels
     * @returns {Error.CODE|void}            - Returns Error.CODE.NOT_FOUND if Context is null
     */
    line: function (start, end, color, thickness = 1) {
        if (Context == null) { 
            Error.emit(CONFIG.DEBUG_DISPLAY, "Context is null.");
            return Error.CODE.NOT_FOUND; 
        }
        Context.beginPath();
        Context.moveTo(start.x, start.y);
        Context.lineTo(end.x, end.y);
        Context.lineWidth = thickness;
        Context.strokeStyle = color;
        Context.stroke();
    },
    /**
     * A function for drawing text on the canvas centered at the given position
     * @param {Vector.Entity} position  - The position of the text center
     * @param {string} text             - The text to draw
     * @param {string} color            - The color of the text
     * @param {number} size             - The size of the text in pixels
     * @param {string} font             - The font to use
     * @returns {Error.CODE|void}            - Returns Error.CODE.NOT_FOUND if Context is null
     */
    text: function (position, text, color, size = 12, font = "Arial") {
        if (Context == null) { 
            Error.emit(CONFIG.DEBUG_DISPLAY, "Context is null.");
            return Error.CODE.NOT_FOUND; 
        }
        Context.font = `${size}px ${font}`;
        Context.fillStyle = color;
        Context.textAlign = "center";
        Context.textBaseline = "middle";
        Context.fillText(text, position.x, position.y);
    },
    /**
     * A function for drawing a sprite on the canvas
     * @param {Vector.Entity} position  - The position of the sprite center
     * @param {string} sprite_sheet     - The name of the sprite sheet to use
     * @param {string} animation        - The name of the animation to use
     * @param {number} frame            - The frame of the animation to use
     * @param {number} zoom             - The zoom level of the sprite
     * @returns {Error.CODE|void}            - Returns Error.CODE.NOT_FOUND if Context is null
     */
    from_sprite_sheet: function (position, sprite_sheet, animation, frame, zoom = 1) {
        if (Context == null) { 
            Error.emit(CONFIG.DEBUG_DISPLAY, "Context is null.");
            return Error.CODE.NOT_FOUND; 
        }
        const sprite = Sprite_Sheet.List[sprite_sheet];
        if (sprite == null) { 
            if (Sprite_Sheet.Loading[sprite_sheet] == null) { 
                Error.emit(CONFIG.DEBUG_DISPLAY, `Sprite_Sheet.List[${sprite_sheet}] is null.`);
            }
            else {
                Error.emit(CONFIG.DEBUG_DISPLAY, `Sprite_Sheet.List[${sprite_sheet}] is still loading.`);
            }
            return Error.CODE.NOT_FOUND;
        }
        const frame_length = sprite.Animations[animation].length;
        const frame_data = sprite.Animations[animation][frame % frame_length];
        if (frame_data == null) { 
            Error.emit(CONFIG.DEBUG_DISPLAY, `Sprite_Sheet.List[${sprite_sheet}].Animations[${animation}][${frame}] is null.`);
            return Error.CODE.NOT_FOUND; 
        }
        const x = position.x - frame_data.width  / 2 * zoom;
        const y = position.y - frame_data.height / 2 * zoom;
        Context.drawImage(
            frame_data,
            x, y,
            frame_data.width  * zoom,
            frame_data.height * zoom
        );
    }
}