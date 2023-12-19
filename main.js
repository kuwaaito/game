// @ts-check
import * as CONFIG from "./config.js";
export { CONFIG };
import * as Vector from "./lib/vector.js";
export { Vector };
import * as Error from "./lib/error.js";
export { Error };
import * as Input from "./lib/input.js";
export { Input };
import * as Sprite from "./lib/display/sprite/main.js";
export { Sprite };
import * as Sprite_Sheet from "./lib/display/sprite/sheet.js";
export { Sprite_Sheet };
import * as Display from "./lib/display/main.js";
export { Display };
import * as State from "./lib/state.js";
export { State };
import * as Scene from "./lib/scene.js";
export { Scene };
import * as Scenes from "./data/scenes/main.js";
document.addEventListener("DOMContentLoaded", () => {
    Scene.enter(Scenes["Test_Initialization"]);
});

