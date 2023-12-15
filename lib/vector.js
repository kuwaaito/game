//@ts-check

/** @typedef { {x: number, y: number} } Entity */

export const Vector = {
    /** @type { (a: Entity, b: Entity) => Entity } */
    add: function (a, b) {
        return {x: a.x + b.x, y: a.y + b.y};
    },
};