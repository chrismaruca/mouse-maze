import {defs, tiny} from '../common.js';
import {Text_Line} from './Text_Line.js';
import {Maze} from './Maze.js';
import {Mouse} from './Mouse.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;

export class Mouse_Maze extends Scene {
    constructor() {
        super();

        // Shapes
        this.shapes = {
            cube: new defs.Cube(),
            peg: new defs.Cube(),
            wall: new defs.Cube(),
            floor: new defs.Cube(),
            text: new Text_Line(35)
        };

        // Shaders
        let phong = new defs.Phong_Shader();
        let textured_phong = new defs.Textured_Phong();

        // Materials
        this.materials = {
            blank: new Material(phong, {ambient: .8, diffusivity: .8, color: color(1,1,1,1)}),
            wood: new Material(phong, {ambient: .2, color: hex_color('#cdaa7d')}),
            mouse: new Material(phong, {
                ambient: .8, diffusivity: .8, specularity: .2,
                color: hex_color('#808080')
            }),
            wall: new Material(textured_phong, {
                ambient: .8, diffusivity: .8, specularity: .2,
                texture: new Texture('../assets/wall.jpg')
            }),
            floor: new Material(textured_phong, {
                ambient: .8, diffusivity: .8, specularity: .2,
                texture: new Texture('../assets/floor.jpg')}),
            cheese: new Material(phong, {
                ambient: .8, diffusivity: 1, specularity: 1,
                color: hex_color('#FFFF00')
            }),
            text_image: new Material(textured_phong, {
                ambient: 1, diffusivity: 0, specularity: 0,
                texture: new Texture('../assets/text.png')
            })
        };

        // Maze size variables
        let N = 8; // The board is N x N cells large
        let CELL_SIZE = 5; // Each cell is CELL_SIZE x CELL_SIZE large
        let WALL_WIDTH = 0.5;
        let SIZE = N * (CELL_SIZE + WALL_WIDTH) + WALL_WIDTH; // Size of the entire maze
        let WALL_HEIGHT = 3; // The height of the walls

        this.Maze = new Maze(this, N, CELL_SIZE, WALL_WIDTH, WALL_HEIGHT);
        
        // Mouse variables
        let start_loc = (CELL_SIZE+WALL_WIDTH) * 0.5 + 0.25;
        let mouse_start_pos = vec4(start_loc, 1, start_loc, 1);
        let mouse_speed = 8;
        this.Mouse = new Mouse(this, mouse_start_pos, mouse_speed);

        // Adjust textures for floor and pegs
        this.shapes.floor.arrays.texture_coord.forEach((v, i, l) => {
            v[0] = v[0] * N;
            v[2] = v[2] * N;
        });
        
        this.shapes.peg.arrays.texture_coord.forEach((v, i, l) => {
            v[0] = v[0] * WALL_WIDTH / CELL_SIZE;
            v[2] = v[2] * WALL_WIDTH / CELL_SIZE;;
        });

        // Camera overlooking maze
        this.top_down_camera = Mat4.look_at(vec3(SIZE/2, 70, SIZE*3/5), vec3(SIZE/2, 0, SIZE/2), vec3(0, 1, 0));
        this.top_down_enabled = false;
    }

    make_control_panel() {
        this.key_triggered_button("Randomize maze", ['r'], () => {
            this.Maze.randomize_maze();
            this.Maze.log_maze();
        });
        this.key_triggered_button("Randomize cheese position", ['c'], () => this.Maze.randomize_cheese_position());
        this.new_line();
        // Mouse controls
        this.key_triggered_button("Move forward", ['w'], () => {
            this.Mouse.vel[2] = this.Mouse.speed;
        }, undefined, () => {
            this.Mouse.vel[2] = 0;
        });
        this.key_triggered_button("Move backward", ['s'], () => {
            this.Mouse.vel[2] = -this.Mouse.speed;
        }, undefined, () => {
            this.Mouse.vel[2] = 0;
        });
        this.key_triggered_button("Move left", ['a'], () => {
            this.Mouse.vel[0] = this.Mouse.speed;
        }, undefined, () => {
            this.Mouse.vel[0] = 0;
        });
        this.key_triggered_button("Move right", ['d'], () => {
            this.Mouse.vel[0] = -this.Mouse.speed;
        }, undefined, () => {
            this.Mouse.vel[0] = 0;
        });
        this.key_triggered_button("Turn left", ['q'], () => {
            this.Mouse.rotv = Math.PI;
        }, undefined, () => {
            this.Mouse.rotv = 0;
        });
        this.key_triggered_button("Turn right", ['e'], () => {
            this.Mouse.rotv = -Math.PI;
        }, undefined, () => {
            this.Mouse.rotv = 0;
        });
        this.key_triggered_button("Top down view", ['m'], () => {
            this.top_down_enabled = true;
        }, undefined, () => {
            this.top_down_enabled = false;
        });
    }

    display(context, program_state) {
        // Initial setup
        if (!context.scratchpad.controls) {
            //this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
        }
        // Projection matrix
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);
        
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;

        // Lights
        program_state.lights = [];

        let maze_x = 0, maze_y = 0, maze_z = 0;
        let maze_model_transform = Mat4.translation(maze_x, maze_y, maze_z);

        let cheese_float_height = .5*Math.sin(Math.PI*t) + 0.5;

        let cheese_light_pos = vec4(this.Maze.cheese_x, maze_y + cheese_float_height, this.Maze.cheese_z, 1);
        let global_light_pos = vec4(this.Maze.SIZE/2, maze_y + 100, this.Maze.SIZE/2, 1);
        program_state.lights.push(new Light(cheese_light_pos, hex_color('#FFFF00'), 100));
        program_state.lights.push(new Light(global_light_pos, color(1, 1, 1, 1), 100000));
        
        this.Maze.draw_maze(context, program_state, maze_model_transform);
        this.Maze.draw_cheese(context, program_state);
        this.Mouse.move(dt);
        this.Mouse.draw_mouse(context, program_state);
        
        if (this.top_down_enabled) {
            program_state.set_camera(this.top_down_camera);
        } else {
            program_state.set_camera(
                Mat4.look_at(this.Mouse.eye_vec(), this.Mouse.at_vec(), vec3(0, 1, 0))
            );
        }
    }
}
