import {defs, tiny} from './common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;

// From text-demo.js
class Text_Line extends Shape {                           // **Text_Line** embeds text in the 3D world, using a crude texture
                                                                 // method.  This Shape is made of a horizontal arrangement of quads.
                                                                 // Each is textured over with images of ASCII characters, spelling
                                                                 // out a string.  Usage:  Instantiate the Shape with the desired
                                                                 // character line width.  Then assign it a single-line string by calling
                                                                 // set_string("your string") on it. Draw the shape on a material
                                                                 // with full ambient weight, and text.png assigned as its texture
                                                                 // file.  For multi-line strings, repeat this process and draw with
                                                                 // a different matrix.
    constructor(max_size) {
        super("position", "normal", "texture_coord");
        this.max_size = max_size;
        var object_transform = Mat4.identity();
        for (var i = 0; i < max_size; i++) {                                       // Each quad is a separate Square instance:
            defs.Square.insert_transformed_copy_into(this, [], object_transform);
            object_transform.post_multiply(Mat4.translation(1.5, 0, 0));
        }
    }

    set_string(line, context) {           // set_string():  Call this to overwrite the texture coordinates buffer with new
        // values per quad, which enclose each of the string's characters.
        this.arrays.texture_coord = [];
        for (var i = 0; i < this.max_size; i++) {
            var row = Math.floor((i < line.length ? line.charCodeAt(i) : ' '.charCodeAt()) / 16),
                col = Math.floor((i < line.length ? line.charCodeAt(i) : ' '.charCodeAt()) % 16);

            var skip = 3, size = 32, sizefloor = size - skip;
            var dim = size * 16,
                left = (col * size + skip) / dim, top = (row * size + skip) / dim,
                right = (col * size + sizefloor) / dim, bottom = (row * size + sizefloor + 5) / dim;

            this.arrays.texture_coord.push(...Vector.cast([left, 1 - bottom], [right, 1 - bottom],
                [left, 1 - top], [right, 1 - top]));
        }
        if (!this.existing) {
            this.copy_onto_graphics_card(context);
            this.existing = true;
        } else
            this.copy_onto_graphics_card(context, ["texture_coord"], false);
    }
}

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

        this.N = 12; // The board is N x N cells large
        this.CELL_SIZE = 4; // Each cell is CELL_SIZE x CELL_SIZE large
        this.WALL_WIDTH = 0.5;
        this.SIZE = this.N * (this.CELL_SIZE + this.WALL_WIDTH) + this.WALL_WIDTH; // Size of the entire maze
        this.HEIGHT = 3; // The height of the walls

        // Camera overlooking maze
        this.initial_camera_location =  Mat4.look_at(vec3(this.SIZE/2, 70, this.SIZE*3/5), vec3(this.SIZE/2, 0, this.SIZE/2), vec3(0, 1, 0));
        this.maze = null;
    }

    make_control_panel() {
        this.key_triggered_button("Regenerate maze", ["m"], this.randomize_maze);
        this.key_triggered_button("Randomize cheese position", ["m"], this.randomize_cheese_position);
    }

    // Returns number between 0 to max-1
    get_rand_num(max) {
        return Math.floor(Math.random() * max);
    }

    // Use randomized recursive DFS to generate the maze definition
    recursive_maze_gen(Maze, x, z) {
        let neighbor_checked = [false, false, false, false];

        for (let i = 0; i < 4; i++) {
            let r = this.get_rand_num(4);

            while (neighbor_checked[r]) {
                r = (r + 1) % 4;
            }
            neighbor_checked[r] = true;
            let nx = x, nz = z;

            switch(r) {
                case 0:
                    nx += 1;
                    if (nx >= this.N) {
                        continue;
                    }
                    break;
                case 1:
                    nz += 1;
                    if (nz >= this.N) {
                        continue;
                    }
                    break;
                case 2:
                    nx -= 1;
                    if (nx < 0) {
                        continue;
                    }
                    break;
                case 3:
                    nz -= 1;
                    if (nz < 0) {
                        continue;
                    }
                    break;
            }

            if (!Maze.visited[nx][nz]) {
                Maze.visited[nx][nz] = true;
                Maze.connected[x][z][r] = true;
                Maze.connected[nx][nz][(r+2)%4] = true;
                this.recursive_maze_gen(Maze, nx, nz);
            }
        }
    }

    // Create a randomized maze
    randomize_maze() {
        let n = this.N;
        let Maze = {
            visited: new Array(n).fill(0).map(() => new Array(n).fill(false)),
            connected: new Array(n).fill(0).map(() => new Array(n).fill(0).map(() => new Array(4).fill(false)))
        }
        // directions: 0 == +x, 1 == +z, 2 == -x, 3 == -z
        Maze.visited[0][0] = true;
        this.recursive_maze_gen(Maze, 0, 0);

        this.maze = Maze.connected;
    }

    log_maze() {
        let out = "";
        for (let z = 0; z < this.N; z++) {
            for (let x = 0; x < this.N; x++) {
                out += "+";
                out += (this.maze[x][z][3] ? " " : "-");
            }
            out += "+\n";
            for (let x = 0; x < this.N; x++) {
                out += (this.maze[x][z][2] ? " " : "|");
                out += " ";
            }
            out += "|\n";
        }
        for (let i = 0; i < this.N; i++) {
            out += "+-";
        }
        out += "+\n";
        console.log(out);
    }

    draw_peg(context, program_state, model_transform) {
        // Make sure corner of peg is at origin before scaling
        let OriginTr = Mat4.translation(1, 1, 1);
        // Scale object down to a 1x1x1 cube before applying other scaling
        let ShrinkSc = Mat4.scale(0.5, 0.5, 0.5);
        // Peg scaling matrix
        let PegSc = Mat4.scale(this.WALL_WIDTH, this.HEIGHT, this.WALL_WIDTH);
        
        // Draw the peg
        this.shapes.cube.draw(
            context, program_state,
            model_transform.times(PegSc).times(ShrinkSc).times(OriginTr), 
            this.materials.wood
        );
    }

    draw_wall(context, program_state, model_transform, x_dir) {
        // Make sure corner of wall is at origin before scaling
        let OriginTr = Mat4.translation(1, 1, 1);
        // Scale object down to a 1x1x1 cube before applying other scaling
        let ShrinkSc = Mat4.scale(0.5, 0.5, 0.5);
        // Wall scaling matrix
        let WallSc;
        if (x_dir) {
            WallSc = Mat4.scale(this.CELL_SIZE, this.HEIGHT, this.WALL_WIDTH);
        } else {
            WallSc = Mat4.scale(this.WALL_WIDTH, this.HEIGHT, this.CELL_SIZE);
        }

        // Draw the wall
        this.shapes.cube.draw(
            context, program_state,
            model_transform.times(WallSc).times(ShrinkSc).times(OriginTr), 
            this.materials.light_wood
        );
    }

    draw_floor(context, program_state, model_transform) {
        // Make sure corner of floor is at origin before scaling
        let OriginTr = Mat4.translation(1, 1, 1);
        // Scale object down to a 1x1x1 cube before applying other scaling
        let ShrinkSc = Mat4.scale(0.5, 0.5, 0.5);
        // Floor scaling matrix
        let FloorSc = Mat4.scale(this.SIZE, 1, this.SIZE);
        // Translate floor down 1 unit
        let FloorTr = Mat4.translation(0, -1, 0);
        
        this.shapes.cube.draw(
            context, program_state,
            model_transform.times(FloorTr).times(FloorSc).times(ShrinkSc).times(OriginTr),
            this.materials.dark_wood
        );
    }

    draw_maze(context, program_state, model_transform) {
        // Draw floor
        this.draw_floor(context, program_state, model_transform);

        // Draw pegs
        let z_translation = model_transform;
        for (let z = 0; z <= this.N; z++) {
            let x_translation = Mat4.identity();
            for (let x = 0; x <= this.N; x++) {
                this.draw_peg(context, program_state, x_translation.times(z_translation));
                x_translation = x_translation.times(Mat4.translation(this.WALL_WIDTH + this.CELL_SIZE, 0, 0));
            }
            z_translation = z_translation.times(Mat4.translation(0, 0, this.WALL_WIDTH + this.CELL_SIZE));
        }
        
        // Draw walls
        z_translation = model_transform;
        for (let z = 0; z < this.N; z++) {
            let x_translation = Mat4.identity();
            // Draw x-axis aligned walls
            for (let x = 0; x < this.N; x++) {
                x_translation = x_translation.times(Mat4.translation(this.WALL_WIDTH, 0, 0));
                if (!this.maze[x][z][3])
                    this.draw_wall(context, program_state, x_translation.times(z_translation), true);
                x_translation = x_translation.times(Mat4.translation(this.CELL_SIZE, 0, 0));
            }
            z_translation = z_translation.times(Mat4.translation(0, 0, this.WALL_WIDTH));
            // Draw z-axis aligned walls
            x_translation = Mat4.identity();
            for (let x = 0; x <= this.N; x++) {
                if (x == this.N || !this.maze[x][z][2])
                    this.draw_wall(context, program_state, x_translation.times(z_translation), false);
                x_translation = x_translation.times(Mat4.translation(this.WALL_WIDTH + this.CELL_SIZE, 0, 0));
            }
            z_translation = z_translation.times(Mat4.translation(0, 0, this.CELL_SIZE));
        }

        // Draw bottom walls
        let x_translation = Mat4.identity();
        for (let x = 0; x < this.N; x++) {
            x_translation = x_translation.times(Mat4.translation(this.WALL_WIDTH, 0, 0));
            this.draw_wall(context, program_state, x_translation.times(z_translation), true);
            x_translation = x_translation.times(Mat4.translation(this.CELL_SIZE, 0, 0));
        }
    }

    // Generates a random position for the cheese
    randomize_cheese_position(){
        this.cheese_x = (this.N/2 + this.get_rand_num(this.N/2) + 0.5) * (this.CELL_SIZE + this.WALL_WIDTH) + 0.25;
        this.cheese_z = (this.N/2 + this.get_rand_num(this.N/2) + 0.5) * (this.CELL_SIZE + this.WALL_WIDTH) + 0.25;
    }

    draw_cheese(context, program_state) {
        let cheese_transform = Mat4.identity();
        let CheeseSc = Mat4.scale(0.5, 0.5, 0.5);
        let randomPositionCheese = Mat4.translation(this.cheese_x, 1, this.cheese_z);

        cheese_transform = cheese_transform.times(randomPositionCheese).times(CheeseSc);

        this.shapes.cube.draw(context, program_state, cheese_transform, this.materials.wood.override({color: hex_color('#FFFF00')}));
    }

    display(context, program_state) {
        // Initial setup
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            program_state.set_camera(this.initial_camera_location);

            this.randomize_cheese_position(); //new cheese position every time refreshed

            this.randomize_maze();
            this.log_maze();
        }
        // Projection matrix
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);
        
        // Lights
        program_state.lights = [];
        
        this.draw_maze(context, program_state, Mat4.identity());
        this.draw_cheese(context, program_state);
    }
}
