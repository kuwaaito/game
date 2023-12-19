// @ts-check
import * as Main from "../../../main.js";
import * as CONFIG from "../../../config.js";
import * as Vector from "../../vector.js";
import * as Error from "../../error.js";

/** @typedef { { Dimensions: Vector.Entity, Animations: {[key:string]: Array<HTMLCanvasElement> }} } Entity*/

/** @type { { [key: string]: boolean } } */
export const Loading = {};
/** @type { { [key: string]: Entity } } */
export const List = {};
/**
 * A function for importing a sprite sheet
 * @param {string} name                     - The name of the sprite sheet
 * @param {string} path                     - The path to the sprite sheet image
 * @param {Vector.Entity} dimensions        - The dimensions of each frame in the sprite sheet
 * @param { { [key: string]: number } } animation_parameters - The number of frames for each animation
 * @returns {Error.CODE|void}                    - Returns Error.CODE.NOT_FOUND if Sprite_Sheet.Context is null
 */
export function load (name, path, dimensions, animation_parameters) {
    Loading[name] = true;
    const img = new Image();
    img.src = path;
    img.onload = function () {
        // Split the image into frames
        /** @type { Entity } */
        const sprite_sheet = {
            Dimensions: dimensions,
            Animations: {}
        }
        let x_offset = 0;
        for (const animation in animation_parameters) {
            let index = 0;
            sprite_sheet.Animations[animation] = [];
            while (index < animation_parameters[animation]) {
                const frame = document.createElement("canvas");
                frame.width  = dimensions.x;
                frame.height = dimensions.y;
                const context = frame.getContext("2d");
                if (context == null) { 
                    Error.emit(CONFIG.DEBUG_DISPLAY, "Sprite's context is null!");
                    return Error.CODE.NOT_FOUND; 
                }
                context.drawImage(
                    img, 
                    x_offset, 0, 
                    dimensions.x, dimensions.y, 
                    0, 0, 
                    dimensions.x, dimensions.y
                );
                sprite_sheet.Animations[animation].push(frame);
                x_offset += dimensions.x;
                index += 1;
            }
        }
        List[name]     = sprite_sheet;
        Loading[name]  = false;
    };
}
