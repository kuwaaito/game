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
export const Boot = {
    name: "Boot",
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
        enter(Vertical_Slice);
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
    }
}
/** @type { Scene.Entity } */
const Vertical_Slice = {
    name: "Vertical Slice",
    child_scene: null,
    parent_scene: null,
    State: {
        Base: {
            Threshold: 0x0150,
            Health: { current: 20, max: 20 },
        },
        Enemy_Logic: {
            List: [],
            timer: 0,
            create: function () {
                const enemy = {
                    Sprite: Sprite.create(),
                    health: 5,
                }
                Vertical_Slice.State.Enemy_Logic.List.push(enemy);
                return enemy;
            },
            remove: function (enemy) {
                const index = Vertical_Slice.State.Enemy_Logic.List.indexOf(enemy);
                if (index == -1) { Error.emit(CONFIG.DEBUG_SCENE, "Enemy not found."); return Error.CODE.NOT_FOUND; }
                Vertical_Slice.State.Enemy_Logic.List.splice(index, 1);
                const sprite = enemy.Sprite;
                Sprite.remove(sprite);
            },
            update: function () {
                const Enemy_Logic = Vertical_Slice.State.Enemy_Logic;
                Enemy_Logic.timer++;
                switch (true) {
                    case (Enemy_Logic.timer % 60 == 0):
                        const enemy = Enemy_Logic.create();
                        const sprite = enemy.Sprite;
                        sprite.sprite_sheet = "Placeholder 16x16";
                        sprite.Position.x = Math.floor(Math.random() * CONFIG.DISPLAY_WIDTH);
                        break;
                }
                const enemies = Vertical_Slice.State.Enemy_Logic.List;
                const base    = Vertical_Slice.State.Base;
                for ( const enemy of enemies ) {
                    if (enemy.health <= 0) { Enemy_Logic.remove(enemy); continue;}
                    const sprite = enemy.Sprite;
                    sprite.Position.y += 1;
                    if (sprite.Position.y < base.Threshold) { continue; }
                    base.Health.current -= enemy.health;
                    Enemy_Logic.remove(enemy);
                }
            }
        },
        Projectile_Logic: {}
    },
    enter: function () {
        // Load the sprite sheets
        Sprite_Sheet.load(
            "Placeholder 8x8",
            "data/visual/sprite_sheet/placeholder_8x8.png",
            {x: 8, y: 8},
            {"Idle": 1}
        );
        Sprite_Sheet.load(
            "Placeholder 16x16",
            "data/visual/sprite_sheet/placeholder_16x16.png",
            {x: 16, y: 16},
            {"Idle": 1}
        );
        Sprite_Sheet.load(
            "Placeholder 32x32",
            "data/visual/sprite_sheet/placeholder_32x32.png",
            {x: 32, y: 32},
            {"Idle": 1}
        );
        // Set the camera to the middle of the play area
        if (!Display.Canvas) { Error.emit(CONFIG.DEBUG_DISPLAY, "Display.Camera is null."); return Error.CODE.NOT_FOUND; }
        Display.Camera.Position.x = CONFIG.DISPLAY_WIDTH  / 2;
        Display.Camera.Position.y = CONFIG.DISPLAY_HEIGHT / 2;
        // Create shooter
        this.State.shooter = Sprite.create();
        const shooter = this.State.shooter;
        shooter.sprite_sheet = "Placeholder 16x16";
        shooter.animation = "Idle";
        shooter.Position.x = 0x0068;
        shooter.Position.y = 0x0120;
        // Create cursor
        this.State.cursor = Sprite.create();
        const cursor = this.State.cursor;
        cursor.sprite_sheet = "Placeholder 8x8";
        cursor.animation = "Idle";
        cursor.Position  = Input.Mouse.Position;
    },
    leave: function () {},
    update: function () {
        this.State.Enemy_Logic.update();
        // Update the cursor position
        const cursor    = this.State.cursor;
        cursor.Position = Display.camera_interpret(Input.Mouse.Position);
    },
    render: function () {
        std.Sprite.draw_all();
    }
}