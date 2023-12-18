// @ts-check
import * as Test from "./lib/test.js";
export { Test };
import * as Vector from "./lib/vector.js";

const State = {
    uuid: 0
};
/** @enum { string } */
const ERROR = {
    NOT_FOUND:               "ERROR_NOT_FOUND",
    UNABLE_TO_PROCESS:       "ERROR_UNABLE_TO_PROCESS",
};
const Error = {
    /** @type { (filter: boolean, message: string) => void } */
    emit: function (filter, message) {
        if (filter || CONFIG.DEBUG_MODE ) { console.error(message); }
    },
    panic: function () {
        console.error("PANIC!");
    }
};
const CONFIG = {
    DISPLAY_ID: "display",

    DISPLAY_WIDTH:  0x00F0,
    DISPLAY_HEIGHT: 0x00A0,

    DISPLAY_MAGNIFICATION: 0x0002,

    CAMERA_MIN_ZOOM: 0.1,

    DEBUG_MODE:      true,
    DEBUG_DISPLAY:   true,
    DEBUG_INPUT:     true,
    DEBUG_SPRITE:    true,

    SPRITE_FRAME_DURATION: 0x000A,

    FRAMES_PER_SECOND: 0x003C,
};
/** @typedef { { Dimensions: Vector.Entity, Animations: {[key:string]: Array<HTMLCanvasElement> }} } Sprite_Sheet*/
const Sprite_Sheet = {
    /** @type { { [key: string]: boolean } } */
    Loading: {},
    /** @type { { [key: string]: Sprite_Sheet } } */
    List: {},
    /**
     * A function for importing a sprite sheet
     * @param {string} name                     - The name of the sprite sheet
     * @param {string} path                     - The path to the sprite sheet image
     * @param {Vector.Entity} dimensions        - The dimensions of each frame in the sprite sheet
     * @param { { [key: string]: number } } animation_parameters - The number of frames for each animation
     * @returns {ERROR|void}                    - Returns ERROR.NOT_FOUND if Sprite_Sheet.Context is null
     */
    import: function (name, path, dimensions, animation_parameters) {
        Sprite_Sheet.Loading[name] = true;
        const img = new Image();
        img.src = path;
        img.onload = function () {
            // Split the image into frames
            /** @type { Sprite_Sheet } */
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
                        return ERROR.NOT_FOUND; 
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
            Sprite_Sheet.List[name]     = sprite_sheet;
            Sprite_Sheet.Loading[name]  = false;
        };
    }
};
/** @typedef { { Position: Vector.Entity, sprite_sheet: string, animation: string, frame: number, timer: number, uuid: number} } Sprite */
const Sprite = {
    /** @type { Array<Sprite> } */
    List: [],
    /**
     * Create a new sprite
     * @returns { Sprite }
     */
    create: function () {
        const sprite = {
            Position:     {x: 0, y: 0},
            sprite_sheet: "n/a",
            animation:    "Idle",
            frame:        0,
            timer:        0,
            uuid:         State.uuid++
        }
        Sprite.List.push(sprite);
        return sprite;
    },
    /**
     * Delete a sprite
     * @param {number} uuid - The uuid of the sprite to delete
     * @returns {ERROR|void} - Returns ERROR.NOT_FOUND if the sprite was not found
     */
    remove: function (uuid) {
        for (let i = 0; i < Sprite.List.length; i++) {
            if (Sprite.List[i].uuid == uuid) {
                Sprite.List.splice(i, 1);
                return;
            }
        }
        // If no sprite was found, emit an error
        Error.emit(CONFIG.DEBUG_SPRITE, `Sprite with uuid ${uuid} not found.`);
        return ERROR.NOT_FOUND;
    },
    remove_all: function () {
        Sprite.List = [];
    },
    /**
     * Update a sprite
     * @param {Sprite} sprite - The sprite to update
     * @returns {void}
     */
    update: function (sprite) {
        sprite.timer -= 1;
        if (sprite.timer <= 0) {
            sprite.frame += 1;
            sprite.timer = CONFIG.SPRITE_FRAME_DURATION;
        }
    },
    /**
     * Update all sprites
     * @returns {void}
     */
    update_all: function () {
        for (const sprite of Sprite.List) {
            Sprite.update(sprite);
        }
    },
    /**
     * Draw a sprite
     * @param {Sprite} sprite - The sprite to draw
     * @returns {ERROR|void} - Returns ERROR.UNABLE_TO_PROCESS if the sprite could not be drawn
     */
    draw: function (sprite) {
        const screen_position = Display.camera_offset(sprite.Position);
        if (typeof screen_position == 'string') { return ERROR.NOT_FOUND; }
        const result = Display.draw_from_sprite_sheet(
            screen_position,
            sprite.sprite_sheet,
            sprite.animation,
            sprite.frame,
            Display.Camera.zoom
        );
        if (!result) { return; }
        Error.emit(CONFIG.DEBUG_SPRITE, `Unable to draw sprite with uuid ${sprite.uuid}.`);
        return ERROR.UNABLE_TO_PROCESS;
    },
    /**
     * Draw all sprites
     * @returns {ERROR|void} - Returns ERROR.UNABLE_TO_PROCESS if any sprite could not be drawn
     */
    draw_all: function () {
        let result = null;
        for (const sprite of Sprite.List) {
            result = Sprite.draw(sprite) || result;
        }
        if (result) { return result; }
    }
};
const Display = {
    /** @type { HTMLCanvasElement | null } */
    Canvas:     null,
    /** @type { CanvasRenderingContext2D | null } */
    Context:    null,
    /** @type { { Position: Vector.Entity, Target: Vector.Entity, zoom: number } } */
    Camera: {
        Position: {x: 0, y: 0},
        Target:   {x: 0, y: 0},
        zoom:     CONFIG.DISPLAY_MAGNIFICATION,
    },
    /**
     * Get the offset of a position relative to the camera
     * @param {Vector.Entity} position - The position in absolute coordinates
     * @returns { ERROR|Vector.Entity }
     */
    camera_offset: function (position) {
        if (Display.Canvas == null) { 
            Error.emit(CONFIG.DEBUG_DISPLAY, "Display.Canvas is null.");
            return ERROR.NOT_FOUND; 
        }
        return {
            x: (
                position.x 
                - Display.Camera.Position.x                         // Offset by camera position
            ) * Display.Camera.zoom / CONFIG.DISPLAY_MAGNIFICATION  // Scale by relative zoom
            + Display.Canvas.width / 2                              // Center the camera
            ,y: (
                position.y 
                - Display.Camera.Position.y                         // Offset by camera position
            ) * Display.Camera.zoom / CONFIG.DISPLAY_MAGNIFICATION  // Scale by relative zoom
            + Display.Canvas.height / 2                             // Center the camera
        }
    },
    /**
     * Get the position of a point in world space relative to the camera
     * @param {Vector.Entity} position - The position in screen coordinates
     * @returns { ERROR|Vector.Entity }
     */
    camera_interpret: function (position) {
        // Translate a position from screen space to world space
        if (Display.Canvas == null) { 
            Error.emit(CONFIG.DEBUG_DISPLAY, "Display.Canvas is null.");
            return ERROR.NOT_FOUND; 
        }
        return {
            x: (
                position.x 
                - Display.Canvas.width / 2                          // Center the camera
            ) * CONFIG.DISPLAY_MAGNIFICATION / Display.Camera.zoom  // Scale by relative zoom
            + Display.Camera.Position.x                           // Offset by camera position
            ,y: (
                position.y 
                - Display.Canvas.height / 2                         // Center the camera
            ) * CONFIG.DISPLAY_MAGNIFICATION / Display.Camera.zoom  // Scale by relative zoom
            + Display.Camera.Position.y                           // Offset by camera position
        }
    },
    /** @type { () => ERROR|void } */
    initialize: function () {
        // @ts-ignore
        Display.Canvas  = document.getElementById(CONFIG.DISPLAY_ID);
        if (Display.Canvas == null)  { 
            Error.emit(CONFIG.DEBUG_DISPLAY, "Display.Canvas is null.");
            return ERROR.NOT_FOUND; 
        }
        // Configure the Canvas
        Display.Canvas.width  = CONFIG.DISPLAY_WIDTH  * CONFIG.DISPLAY_MAGNIFICATION;
        Display.Canvas.height = CONFIG.DISPLAY_HEIGHT * CONFIG.DISPLAY_MAGNIFICATION;
        Display.Context = Display.Canvas.getContext("2d");
        if (Display.Context == null) { 
            Error.emit(CONFIG.DEBUG_DISPLAY, "Display.Context is null.");
            return ERROR.NOT_FOUND; 
        }
        // This will be pixel art, so disable anti-aliasing
        Display.Context.imageSmoothingEnabled = false;
        // Prevent the canvas from being highlighted
        Display.Canvas.onselectstart = () => false;
        // Allow us to handle right-clicks
        Display.Canvas.oncontextmenu = () => false;
        // Prevent the canvas from showing the cursor
        Display.Canvas.style.cursor = "none";
        // When context is lost reset input
        Display.Canvas.addEventListener("webglcontextlost", Input.Reset);
    },
    /**
     * A function for drawing a circle on the canvas
     * @param {Vector.Entity} position  - The position of the circle center
     * @param {number} radius           - The radius of the circle in pixels
     * @param {string} color            - The color of the circle
     * @param {number} outline          - The thickness of the outline in pixels, 0 for no outline and fill instead
     * @returns {ERROR|void}            - Returns ERROR.NOT_FOUND if Display.Context is null
     */
    draw_circle: function (position, radius, color, outline = 0) {
        const Context = Display.Context;
        if (Context == null) { 
            Error.emit(CONFIG.DEBUG_DISPLAY, "Display.Context is null.");
            return ERROR.NOT_FOUND; 
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
     * @returns {ERROR|void}             - Returns ERROR.NOT_FOUND if Display.Context is null
     */
    draw_rectangle: function (position, dimensions, color, outline = 0) {
        const Context = Display.Context;
        if (Context == null) { 
            Error.emit(CONFIG.DEBUG_DISPLAY, "Display.Context is null.");
            return ERROR.NOT_FOUND; 
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
     * @returns {ERROR|void}            - Returns ERROR.NOT_FOUND if Display.Context is null
     */
    draw_line: function (start, end, color, thickness = 1) {
        const Context = Display.Context;
        if (Context == null) { 
            Error.emit(CONFIG.DEBUG_DISPLAY, "Display.Context is null.");
            return ERROR.NOT_FOUND; 
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
     * @returns {ERROR|void}            - Returns ERROR.NOT_FOUND if Display.Context is null
     */
    draw_text: function (position, text, color, size = 12, font = "Arial") {
        const Context = Display.Context;
        if (Context == null) { 
            Error.emit(CONFIG.DEBUG_DISPLAY, "Display.Context is null.");
            return ERROR.NOT_FOUND; 
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
     * @returns {ERROR|void}            - Returns ERROR.NOT_FOUND if Display.Context is null
     */
    draw_from_sprite_sheet: function (position, sprite_sheet, animation, frame, zoom = 1) {
        const Context = Display.Context;
        if (Context == null) { 
            Error.emit(CONFIG.DEBUG_DISPLAY, "Display.Context is null.");
            return ERROR.NOT_FOUND; 
        }
        const sprite = Sprite_Sheet.List[sprite_sheet];
        if (sprite == null) { 
            if (Sprite_Sheet.Loading[sprite_sheet] == null) { 
                Error.emit(CONFIG.DEBUG_DISPLAY, `Sprite_Sheet.List[${sprite_sheet}] is null.`);
            }
            else {
                Error.emit(CONFIG.DEBUG_DISPLAY, `Sprite_Sheet.List[${sprite_sheet}] is still loading.`);
            }
            return ERROR.NOT_FOUND;
        }
        const frame_length = sprite.Animations[animation].length;
        const frame_data = sprite.Animations[animation][frame % frame_length];
        if (frame_data == null) { 
            Error.emit(CONFIG.DEBUG_DISPLAY, `Sprite_Sheet.List[${sprite_sheet}].Animations[${animation}][${frame}] is null.`);
            return ERROR.NOT_FOUND; 
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
};
const Input = {
    /** @type { { [key: string]: boolean } } */
    Keys: {},
    Mouse: {
        /** @type { Vector.Entity } */
        Position: {x: 0, y: 0},
        Button:   {Left: false, Right: false}
    },
    initialize: function () {
        window.addEventListener("keydown", Input.Key_Press);
        window.addEventListener("keyup",   Input.Key_Release);
        const Canvas = Display.Canvas;
        if (Canvas == null) { 
            Error.emit(CONFIG.DEBUG_INPUT, "Display.Canvas is null.");
            return ERROR.NOT_FOUND; 
        }
        Canvas.addEventListener("mousemove", Input.Mouse_Move);
        Canvas.addEventListener("mousedown", Input.Mouse_Press);
        Canvas.addEventListener("mouseup",   Input.Mouse_Release);
    },
    Key_Press: function (event) {
        if (CONFIG.DEBUG_INPUT) { console.log(event.code); }
        Input.Keys[event.code] = true;
    },
    Key_Release: function (event) {
        if (CONFIG.DEBUG_INPUT) { console.log(event.code); }
        Input.Keys[event.code] = false;
    },
    Mouse_Move: function (event) {
        const Canvas = Display.Canvas;
        if (Canvas == null) { 
            Error.emit(CONFIG.DEBUG_INPUT, "Display.Canvas is null.");
            return ERROR.NOT_FOUND; 
        }
        const Rect = Canvas.getBoundingClientRect();
        Input.Mouse.Position.x = event.clientX - Rect.left;
        Input.Mouse.Position.y = event.clientY - Rect.top;
    },
    Mouse_Press: function (event) {
        if (CONFIG.DEBUG_INPUT) { console.log(event.button); }
        if (event.button == 0) { Input.Mouse.Button.Left  = true; }
        if (event.button == 2) { Input.Mouse.Button.Right = true; }
    },
    Mouse_Release: function (event) {
        if (CONFIG.DEBUG_INPUT) { console.log(event.button); }
        if (event.button == 0) { Input.Mouse.Button.Left  = false; }
        if (event.button == 2) { Input.Mouse.Button.Right = false; }
    },
    Reset: function () {
        Input.Mouse.Button.Left  = false;
        Input.Mouse.Button.Right = false;
        Input.Keys               = {};
    }
};
/** @typedef { { child_scene: Scene | null, parent_scene: Scene | null, State: any, enter: () => ERROR|void, leave: () => ERROR|void, update: () => ERROR|SCENE_CODE|void, render: () => ERROR|SCENE_CODE|void } } Scene */
/** @enum { string } */
const SCENE_CODE = {
    PAUSE:      "SCENE_CODE_PAUSE",
}
const Scene = {
    /** @type { Scene | null } */
    Tail: null,
    /** @type { { [key: string]: Scene } } */
    List: {
       "Test_Initialization": {
           child_scene: null,
           parent_scene: null,
           State: {
               interval: null
           },
           enter: function () {
               Display.initialize();
               Input.initialize();
               const game_loop = function () {
                   Scene.update();
                   Scene.render();
               }
               Scene.enter("Test_Scene");
               Scene.List["Test_Initialization"].State.interval = setInterval(game_loop, 1000 / CONFIG.FRAMES_PER_SECOND);
           },
           leave: function () {},
           update: function () {
               Sprite.update_all();
           },
           render: function () {
               // Clear the screen
               if (Display.Context == null) { 
                   Error.emit(CONFIG.DEBUG_DISPLAY, "Display.Context is null.");
                   return ERROR.NOT_FOUND; 
               }
               if (Display.Canvas == null) { 
                   Error.emit(CONFIG.DEBUG_DISPLAY, "Display.Canvas is null.");
                   return ERROR.NOT_FOUND; 
               }
               Display.Context.clearRect(0, 0, Display.Canvas.width, Display.Canvas.height);
               Display.Context.fillStyle = "black";
               Display.Context.fillRect(0, 0, Display.Canvas.width, Display.Canvas.height);
           },
       },
         /** @type { Scene } */
       "Test_Scene": {
           child_scene: null,
           parent_scene: null,
           State: {
               /** @type { Sprite | null } */
               test_sprite: null
           },
           enter: function () {
               Sprite_Sheet.import(
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
               Scene.List["Test_Scene"].State.test_sprite = test_sprite;
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
               static_sprite_offset.Position     = {x: 100, y: 50};
           },
           leave: function () {},
           update: function () {
               // Map the sprite's position to the mouse position
               const test_sprite = Scene.List["Test_Scene"].State.test_sprite;
               if (test_sprite == null) { 
                   Error.emit(CONFIG.DEBUG_SCENE, "Scenes['Test_Scene'].State.test_sprite is null.");
                   return ERROR.NOT_FOUND; 
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
               if (typeof mouse_world_position == 'string') { return ERROR.NOT_FOUND; }
               test_sprite.Position = mouse_world_position;
           },
           render: function () {
               Sprite.draw_all();
           },
       }
    },
    /**
     * Add a scene to the scene list
     * @param {string} name - The name of the scene
     * @returns {ERROR|void} - Returns ERROR.NOT_FOUND if the scene already exists
     */
    enter: function (name) {
        const scene = Scene.List[name];
        if (!scene) { Error.emit(CONFIG.DEBUG_SCENE, `Scene ${name} doesn't exist.`); return ERROR.NOT_FOUND; };
        const previous_tail = Scene.Tail;
        if (previous_tail) { previous_tail.child_scene = scene; scene.parent_scene = previous_tail; }
        Scene.Tail = scene;
        scene.enter();
    },
    leave: function () {
        const scene = Scene.Tail;
        if (!scene) { Error.emit(CONFIG.DEBUG_SCENE, `No scene to leave.`); return ERROR.NOT_FOUND; };
        const parent = scene.parent_scene;
        scene.leave();
        scene.parent_scene = null;
        Scene.Tail = parent;
        if (parent) { parent.child_scene = null; }
    },
    /**
     * @returns {ERROR|void} - Returns an ERROR if no scenes are found
     */
    update: function () {
        // Start at the Head of the scene tree and render each scene
        let scene = Scene.Tail;
        if (!scene) { Error.emit(CONFIG.DEBUG_SCENE, `No scenes to render.`); return ERROR.NOT_FOUND; }
        while (scene) {
            const result = scene.update();
            if (result == Scene.CODE.PAUSE) { break; }
            scene = scene.parent_scene;
        }
    },
    /**
     * @returns {ERROR|void} - Returns an ERROR if no scenes are found
     */
    render: function () {
        // Start at the Head of the scene tree and render each scene
        let scene = Scene.Tail;
        if (!scene) { Error.emit(CONFIG.DEBUG_SCENE, `No scenes to render.`); return ERROR.NOT_FOUND; }
        while (scene.parent_scene) { scene = scene.parent_scene; }
        while (scene) {
            scene.render();
            scene = scene.child_scene;
        }
    }
};
document.addEventListener("DOMContentLoaded", () => {
    console.log(Display)
    Scene.enter("Test_Initialization");
});

