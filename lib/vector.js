//@ts-check
/** @typedef { {x: number, y: number} } Entity */

/** @type { (a: Entity, b: Entity) => Entity } */
export function add (a, b) {
    return {x: a.x + b.x, y: a.y + b.y};
};
export function subtract (a, b) {
    return {x: a.x - b.x, y: a.y - b.y};
};
/** @type { (a: Entity) => number } */
export function magnitude (vector) {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
}
/** @type { (a: Entity) => Entity } */
export function normalize (a) {
    const mag = magnitude(a);
    if (mag == 0) { return {x: 0, y: 0}; }
    return {x: a.x / mag, y: a.y / mag};
}
export function distance (a, b) {
    return magnitude(subtract(a, b));
}
export function scale (vector, scalar) {
    const a = normalize(vector);
    return {x: a.x * scalar, y: a.y * scalar};
}