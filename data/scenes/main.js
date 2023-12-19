//@ts-check
import * as std from "../../main.js";
const Display = std.Display;
const Input = std.Input;
import * as Sprite from "../../lib/display/sprite/main.js";
const Sprite_Sheet = std.Sprite_Sheet;
import * as Scene from "../../lib/scene.js";
const Error = std.Error;
const CONFIG = std.CONFIG;
const enter = std.Scene.enter;
const update = std.Scene.update;
const render = std.Scene.render;

/** @type { Scene.Entity } */
export const Test_Initialization = {
    name: "Test Initialization",
    child_scene: null,
    parent_scene: null,
    State: {
        interval: 0
    },
    enter: function () {
        Display.initialize();
        Input.initialize();
        const game_loop = function () {
            update();
            render();
        }
        enter(Test_Scene);
        this.State.interval = setInterval(game_loop, 1000 / CONFIG.FRAMES_PER_SECOND);
    },
    leave: function () {},
    update: function () {
        Sprite.update_all();
    },
    render: function () {
        // Clear the screen
        if (Display.Context == null) { 
            Error.emit(CONFIG.DEBUG_DISPLAY, "Display.Context is null.");
            return Error.CODE.NOT_FOUND; 
        }
        if (Display.Canvas == null) { 
            Error.emit(CONFIG.DEBUG_DISPLAY, "Display.Canvas is null.");
            return Error.CODE.NOT_FOUND; 
        }
        Display.Context.clearRect(0, 0, Display.Canvas.width, Display.Canvas.height);
        Display.Context.fillStyle = "black";
        Display.Context.fillRect(0, 0, Display.Canvas.width, Display.Canvas.height);
    },
}
/** @type { Scene.Entity } */
const Test_Scene = {
    name: "Test Scene",
    child_scene: null,
    parent_scene: null,
    State: {
        /** @type { Sprite.Entity | null } */
        test_sprite: null
    },
    enter: function () {
        Sprite_Sheet.load(
            "Test Sheet",
            "data/test.png",
            {x: 16, y: 16},
            { "Idle": 1, "Walk": 4}
        );
        const test_sprite = Sprite.create();
        test_sprite.sprite_sheet = "Test Sheet";
        test_sprite.animation    = "Walk";
        test_sprite.frame        = 0;
        test_sprite.timer        = CONFIG.SPRITE_FRAME_DURATION;
        this.State.test_sprite = test_sprite;
        // Create a static sprite just so we can see the world position
        const static_sprite = Sprite.create();
        static_sprite.sprite_sheet = "Test Sheet";
        static_sprite.animation    = "Idle";
        static_sprite.frame        = 0;
        static_sprite.timer        = CONFIG.SPRITE_FRAME_DURATION;
        static_sprite.Position     = {x: 0, y: 0};
        // Another sprite offset from the first to check camera scaling
        const static_sprite_offset = Sprite.create();
        static_sprite_offset.sprite_sheet = "Test Sheet";
        static_sprite_offset.animation    = "Idle";
        static_sprite_offset.frame        = 0;
        static_sprite_offset.timer        = CONFIG.SPRITE_FRAME_DURATION;
        static_sprite_offset.Position     = {x: 16, y: 16};

        const static_sprite_offset_another = Sprite.create();
        static_sprite_offset_another.sprite_sheet = "Test Sheet";
        static_sprite_offset_another.animation    = "Idle";
        static_sprite_offset_another.frame        = 0;
        static_sprite_offset_another.timer        = CONFIG.SPRITE_FRAME_DURATION;
        static_sprite_offset_another.Position     = {x: -8, y: 32};
    },
    leave: function () {},
    update: function () {
        // Map the sprite's position to the mouse position
        const test_sprite = this.State.test_sprite;
        if (test_sprite == null) { 
            Error.emit(CONFIG.DEBUG_SCENE, "Scenes['Test_Scene'].State.test_sprite is null.");
            return Error.CODE.NOT_FOUND; 
        }
        // Move the camera based on wasd
        if (Input.Keys["KeyW"]) { Display.Camera.Position.y -= 1; }
        if (Input.Keys["KeyA"]) { Display.Camera.Position.x -= 1; }
        if (Input.Keys["KeyS"]) { Display.Camera.Position.y += 1; }
        if (Input.Keys["KeyD"]) { Display.Camera.Position.x += 1; }
        // Zoom with q and e
        if (Input.Keys["KeyQ"]) { Display.Camera.zoom *= 1.1; }
        if (Input.Keys["KeyE"]) { Display.Camera.zoom *= 0.9; }
        const mouse_position = Input.Mouse.Position;
        const mouse_world_position = Display.camera_interpret(mouse_position);
        if (typeof mouse_world_position == 'string') { return Error.CODE.NOT_FOUND; }
        test_sprite.Position = mouse_world_position;
    },
    render: function () {
        Sprite.draw_all();
    },
}