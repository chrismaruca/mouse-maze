import {defs, tiny} from '../common.js';
import {Text_Line} from './Text_Line.js';
import {Maze} from './Maze.js'

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;

export class Mouse_Maze extends Scene {
    constructor() {
        super();

        // Shapes
        this.shapes = {
            cube: new defs.Cube(),
            text: new Text_Line(35)
        };

        // Materials
        this.materials = {
            blank: new Material(new defs.Phong_Shader(), {ambient: 1, color: color(1,1,1,1)}),
            light_wood: new Material(new defs.Phong_Shader(), {ambient: 1, color: hex_color('deb887')}),
            wood: new Material(new defs.Phong_Shader(), {ambient: 1, color: hex_color('cdaa7d')}),
            dark_wood: new Material(new defs.Phong_Shader(), {ambient: 1, color: hex_color('8b6914')}),
            text_image: new Material(new defs.Textured_Phong(1), {
                ambient: 1, diffusivity: 0, specularity: 0,
                texture: new Texture("assets/text.png")
            })
        };

        let N = 12; // The board is N x N cells large
        let CELL_SIZE = 3; // Each cell is CELL_SIZE x CELL_SIZE large
        let WALL_WIDTH = 0.5;
        let SIZE = N * (CELL_SIZE + WALL_WIDTH) + WALL_WIDTH; // Size of the entire maze
        let WALL_HEIGHT = 3; // The height of the walls

        this.Maze = new Maze(this, N, CELL_SIZE, WALL_WIDTH, WALL_HEIGHT);

        // Camera overlooking maze
        this.initial_camera_location = Mat4.look_at(vec3(SIZE/2, 70, SIZE*3/5), vec3(SIZE/2, 0, SIZE/2), vec3(0, 1, 0));
    }

    make_control_panel() {
        this.key_triggered_button("Regenerate maze", ["m"], () => {
            this.Maze.randomize_maze();
            this.Maze.log_maze();
        });
        this.key_triggered_button("Randomize cheese position", ["m"], () => this.Maze.randomize_cheese_position());
    }


    display(context, program_state) {
        // Initial setup
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            program_state.set_camera(this.initial_camera_location);
        }
        // Projection matrix
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);
        
        // Lights
        program_state.lights = [];
        
        this.Maze.draw_maze(context, program_state, Mat4.identity());
        this.Maze.draw_cheese(context, program_state);
    }
}
