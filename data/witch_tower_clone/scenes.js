//@ts-check
import * as std from "../../main.js";
const Display = std.Display;
const Input = std.Input;
import * as Sprite from "../../lib/display/sprite/main.js";
const Sprite_Sheet = std.Sprite_Sheet;
import * as Scene from "../../lib/scene.js";
const Error = std.Error;
const CONFIG = std.CONFIG;
const Vector = std.Vector;
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
                    size: 16,
                    speed: 0.25
                }
                enemy.Sprite.sprite_sheet = "Placeholder 16x16";
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
                    sprite.Position.y += enemy.speed;
                    if (sprite.Position.y < base.Threshold) { continue; }
                    base.Health.current -= enemy.health;
                    Enemy_Logic.remove(enemy);
                }
            },
            get_random: function () {
                const Enemy_Logic = Vertical_Slice.State.Enemy_Logic;
                const enemies = Enemy_Logic.List;
                return enemies[Math.floor(Math.random() * enemies.length)];
            }
        },
        Projectile_Logic: {
            List: [],
            create: function () {
                const projectile = {
                    Sprite: Sprite.create(),
                    Velocity: {x: 0, y: 0},
                    damage: 1,
                    size: 8,
                    duration: 120,
                }
                projectile.Sprite.sprite_sheet = "Placeholder 8x8";
                Vertical_Slice.State.Projectile_Logic.List.push(projectile);
                return projectile;
            },
            remove: function (projectile) {
                const index = Vertical_Slice.State.Projectile_Logic.List.indexOf(projectile);
                if (index == -1) { Error.emit(CONFIG.DEBUG_SCENE, "Projectile not found."); return Error.CODE.NOT_FOUND; }
                Vertical_Slice.State.Projectile_Logic.List.splice(index, 1);
                const sprite = projectile.Sprite;
                Sprite.remove(sprite);
            },
            update: function () {
                const Projectile_Logic = Vertical_Slice.State.Projectile_Logic;
                const projectiles = Projectile_Logic.List;
                const enemies     = Vertical_Slice.State.Enemy_Logic.List;
                for ( const projectile of projectiles ) {
                    projectile.duration -= 1;
                    if (projectile.duration  <= 0) { Projectile_Logic.remove(projectile); continue;}
                    const sprite = projectile.Sprite;
                    sprite.Position.x += projectile.Velocity.x;
                    sprite.Position.y += projectile.Velocity.y;
                    for ( const enemy of enemies ) {
                        const enemy_sprite = enemy.Sprite;
                        if (Vector.distance(sprite.Position, enemy_sprite.Position) > (enemy.size + projectile.size) / 2) { continue; }
                        enemy.health -= projectile.damage;
                        Projectile_Logic.remove(projectile);
                        break;
                    }
                }
            }
        },
        Turret_Logic: {
            List: [],
            create: function () {
                const turret = {
                    Sprite: Sprite.create(),
                    fire_rate: {current: 0, max: 5},
                    size: 32,
                }
                turret.Sprite.sprite_sheet = "Placeholder 32x32";
                Vertical_Slice.State.Turret_Logic.List.push(turret);
                return turret;
            },
            remove: function (turret) {
                const index = Vertical_Slice.State.Turret_Logic.List.indexOf(turret);
                if (index == -1) { Error.emit(CONFIG.DEBUG_SCENE, "Turret not found."); return Error.CODE.NOT_FOUND; }
                Vertical_Slice.State.Turret_Logic.List.splice(index, 1);
                const sprite = turret.Sprite;
                Sprite.remove(sprite);
            },
            update: function () {
                const Turret_Logic = Vertical_Slice.State.Turret_Logic;
                const turrets = Turret_Logic.List;
                for ( const turret of turrets ) {
                    if (turret.fire_rate.current < turret.fire_rate.max) { turret.fire_rate.current++; continue; }
                    const sprite = turret.Sprite;
                    const enemy = Turret_Logic.get_closest_enemy(turret);
                    if (enemy == null) { continue; }
                    const enemy_sprite = enemy.Sprite;
                    const direction = Vector.normalize(Vector.subtract(enemy_sprite.Position, sprite.Position));
                    const projectile = Vertical_Slice.State.Projectile_Logic.create();
                    projectile.Sprite.Position.x = sprite.Position.x;
                    projectile.Sprite.Position.y = sprite.Position.y;
                    projectile.Velocity = Vector.scale(direction, 5);
                    turret.fire_rate.current = 0;
                }            
            },
            get_closest_enemy: function (turret) {
                const enemies = Vertical_Slice.State.Enemy_Logic.List;
                let closest = null;
                let distance = Infinity;
                for ( const enemy of enemies ) {
                    const enemy_sprite = enemy.Sprite;
                    const d = Vector.distance(turret.Sprite.Position, enemy_sprite.Position);
                    if (d < distance) { closest = enemy; distance = d; }
                }
                return closest;
            }
        }
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
        const turret = this.State.Turret_Logic.create();
        turret.Sprite.Position.x = CONFIG.DISPLAY_WIDTH  * 1/2;
        turret.Sprite.Position.y = CONFIG.DISPLAY_HEIGHT * 3/4;        
        // Create cursor
        this.State.cursor = Sprite.create();
        const cursor = this.State.cursor;
        cursor.sprite_sheet = "Placeholder 8x8";
        cursor.animation = "Idle";
        cursor.Position  = Input.Mouse.Position;
    },
    leave: function () {},
    update: function () {
        if (Input.Keys["KeyW"]) { Display.Camera.Position.y -= 1; }
        if (Input.Keys["KeyA"]) { Display.Camera.Position.x -= 1; }
        if (Input.Keys["KeyS"]) { Display.Camera.Position.y += 1; }
        if (Input.Keys["KeyD"]) { Display.Camera.Position.x += 1; }
        // Zoom with q and e
        if (Input.Keys["KeyQ"]) { Display.Camera.zoom *= 1.1; }
        if (Input.Keys["KeyE"]) { Display.Camera.zoom *= 0.9; }
        this.State.Enemy_Logic.update();
        this.State.Turret_Logic.update();
        // Update the cursor position
        const cursor    = this.State.cursor;
        cursor.Position = Display.camera_interpret(Input.Mouse.Position);
        this.State.Projectile_Logic.update();
    },
    render: function () {
        std.Sprite.draw_all();
    }
}