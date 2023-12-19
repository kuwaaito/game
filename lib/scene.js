// @ts-check
import * as CONFIG from "../config.js";
import * as Error from "./error.js";

/** @typedef { { name: string, child_scene: Entity | null, parent_scene: Entity | null, State: any, enter: () => Error.CODE|void, leave: () => Error.CODE|void, update: () => Error.CODE|SCENE_CODE|void, render: () => Error.CODE|SCENE_CODE|void } } Entity */
/** @enum { string } */
const SCENE_CODE = {
    PAUSE:      "SCENE_CODE_PAUSE",
};
/** @type { Entity | null } */
let Head = null;
/** @type { Entity | null } */
let Tail = null;
/** @type { { [key: string]: Entity } } */
/**
 * Add a scene to the scene list
 * @param {Entity} scene - The name of the scene
 * @returns {Error.CODE|void} - Returns Error.CODE.NOT_FOUND if the scene already exists
 */
export function enter (scene) {
    if (!scene) { Error.emit(CONFIG.DEBUG_SCENE, `Scene doesn't exist.`); return Error.CODE.NOT_FOUND; };
    const previous_head = Head;
    const previous_tail = Tail;
    if (!previous_head || !previous_tail) { Head = scene; Tail = scene; scene.enter(); return; }
    previous_tail.child_scene = scene; 
    scene.parent_scene = previous_tail;
    Tail = scene;
    scene.enter();
}
export function leave () {
    const scene = Tail;
    if (!scene) { Error.emit(CONFIG.DEBUG_SCENE, `No scene to leave.`); return Error.CODE.NOT_FOUND; };
    const parent = scene.parent_scene;
    scene.leave();
    scene.parent_scene = null;
    Tail = parent;
    if (parent) { parent.child_scene = null; }
    else { Head = null; }
}
/**
 * @returns {Error.CODE|void} - Returns an Error.CODE if no scenes are found
 */
export function update () {
    let scene = Tail;
    if (!scene) { Error.emit(CONFIG.DEBUG_SCENE, `No scenes to render.`); return Error.CODE.NOT_FOUND; }
    while (scene) {
        const result = scene.update();
        if (result == SCENE_CODE.PAUSE) { break; }
        scene = scene.parent_scene;
    }
}
/**
 * @returns {Error.CODE|void} - Returns an Error.CODE if no scenes are found
 */
export function render () {
    // Start at the Head of the scene tree and render each scene
    let scene = Head;
    if (!scene) { Error.emit(CONFIG.DEBUG_SCENE, `No scenes to render.`); return Error.CODE.NOT_FOUND; }
    while (scene) {
        scene.render();
        scene = scene.child_scene;
    }
}