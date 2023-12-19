//@ts-check
import * as Vector from "../../vector.js";
import * as Display from "../main.js";
import * as CONFIG from "../../../config.js";
import * as Error from "../../error.js";

/** @typedef { { Position: Vector.Entity, sprite_sheet: string, animation: string, frame: number, timer: number, uuid: number} } Entity */
/** @type { Array<Entity> } */
export let List = [];
let uuid = 0;
/**
 * Create a new sprite
 * @returns { Entity }
 */
export function create () {
    const sprite = {
        Position:     {x: 0, y: 0},
        sprite_sheet: "n/a",
        animation:    "Idle",
        frame:        0,
        timer:        0,
        uuid:         uuid++
    }
    List.push(sprite);
    return sprite;
}
/**
 * Delete a sprite
 * @param {Entity} sprite - The the sprite to delete
 * @returns {Error.CODE|void} - Returns Error.CODE.NOT_FOUND if the sprite was not found
 */
export function remove (sprite) {
    const index = List.indexOf(sprite);
    if (index == -1) { Error.emit(CONFIG.DEBUG_SPRITE, "Sprite not found."); return Error.CODE.NOT_FOUND; }
    List.splice(index, 1);
}
export function remove_all () {
    List = [];
}
/**
 * Update a sprite
 * @param {Entity} sprite - The sprite to update
 * @returns {void}
 */
export function update (sprite) {
    sprite.timer -= 1;
    if (sprite.timer <= 0) {
        sprite.frame += 1;
        sprite.timer = CONFIG.SPRITE_FRAME_DURATION;
    }
}
/**
 * Update all sprites
 * @returns {void}
 */
export function update_all () {
    for (const sprite of List) {
        update(sprite);
    }
}
/**
 * Draw a sprite
 * @param {Entity} sprite - The sprite to draw
 * @returns {Error.CODE|void} - Returns Error.CODE.UNABLE_TO_PROCESS if the sprite could not be drawn
 */
export function draw (sprite) {
    const screen_position = Display.camera_offset(sprite.Position);
    if (typeof screen_position == 'string') { return Error.CODE.NOT_FOUND; }
    const result = Display.Draw.from_sprite_sheet(
        screen_position,
        sprite.sprite_sheet,
        sprite.animation,
        sprite.frame,
        Display.camera_scale()
    );
    if (!result) { return; }
    Error.emit(CONFIG.DEBUG_SPRITE, `Unable to draw sprite with uuid ${sprite.uuid}.`);
    return Error.CODE.UNABLE_TO_PROCESS;
}
/**
 * Draw all sprites
 * @returns {Error.CODE|void} - Returns Error.CODE.UNABLE_TO_PROCESS if any sprite could not be drawn
 */
export function draw_all () {
    let result = null;
    for (const sprite of List) {
        result = draw(sprite) || result;
    }
    if (result) { return result; }
}