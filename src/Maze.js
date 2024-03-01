import {defs, tiny} from '../common.js';
import {get_rand_num} from './utils.js'

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;

export class Maze {
    constructor(scene, cell_n, cell_size, wall_width, wall_height) {
        this.scene = scene;
        this.N = cell_n; // The board is N x N cells large
        this.CELL_SIZE = cell_size; // Each cell is CELL_SIZE x CELL_SIZE large
        this.WALL_WIDTH = wall_width;
        this.SIZE = this.N * (this.CELL_SIZE + this.WALL_WIDTH) + this.WALL_WIDTH; // Size of the entire maze
        this.HEIGHT = wall_height; // The height of the walls

        this.calculate_cheese_transform();
        this.calculate_floor_transform();
        this.calculate_peg_transform();
        this.calculate_wall_transform();
        this.starting_cheese_position();

        this.randomize_maze();
        this.log_maze();
    }

    calculate_peg_transform() {
        // Make sure corner of object is at origin before scaling
        let OriginTr = Mat4.translation(1, 1, 1);
        // Scale object down to a 1x1x1 cube before applying other scaling
        let ShrinkSc = Mat4.scale(0.5, 0.5, 0.5);
        // Peg scaling matrix
        let PegSc = Mat4.scale(this.WALL_WIDTH, this.HEIGHT, this.WALL_WIDTH);

        this.peg_transform = PegSc.times(ShrinkSc).times(OriginTr)
    }

    calculate_wall_transform() {
        // Make sure corner of wall is at origin before scaling
        let OriginTr = Mat4.translation(1, 1, 1);
        // Scale object down to a 1x1x1 cube before applying other scaling
        let ShrinkSc = Mat4.scale(0.5, 0.5, 0.5);
        // Wall scaling matrix
        let WallScX = Mat4.scale(this.CELL_SIZE, this.HEIGHT, this.WALL_WIDTH);
        let WallScZ = Mat4.scale(this.WALL_WIDTH, this.HEIGHT, this.CELL_SIZE);

        this.wall_transform_x = WallScX.times(ShrinkSc).times(OriginTr);
        this.wall_transform_z = WallScZ.times(ShrinkSc).times(OriginTr);
    }

    calculate_floor_transform() {
        // Make sure corner of floor is at origin before scaling
        let OriginTr = Mat4.translation(1, 1, 1);
        // Scale object down to a 1x1x1 cube before applying other scaling
        let ShrinkSc = Mat4.scale(0.5, 0.5, 0.5);
        // Floor scaling matrix
        let FloorSc = Mat4.scale(this.SIZE, 1, this.SIZE);
        // Translate floor down 1 unit
        let FloorTr = Mat4.translation(0, -1, 0);

        this.floor_transform = FloorTr.times(FloorSc).times(ShrinkSc).times(OriginTr);
    }

    calculate_cheese_transform() {
        let CheeseSc = Mat4.scale(0.5, 0.5, 0.5);
        let CheeseTr = Mat4.translation(this.cheese_x, 0, this.cheese_z);

        this.cheese_transform = CheeseTr.times(CheeseSc);
    }
    
    // Use randomized recursive DFS to generate the maze definition
    recursive_maze_gen(maze, x, z) {
        let neighbor_checked = [false, false, false, false];

        for (let i = 0; i < 4; i++) {
            let r = get_rand_num(4);

            while (neighbor_checked[r]) {
                r = (r + 1) % 4;
            }
            neighbor_checked[r] = true;
            let nx = x, nz = z;

            // directions: 0 == +x, 1 == +z, 2 == -x, 3 == -z
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

            if (!maze.visited[nx][nz]) {
                maze.visited[nx][nz] = true;
                maze.connected[x][z][r] = true;
                maze.connected[nx][nz][(r+2)%4] = true;
                this.recursive_maze_gen(maze, nx, nz);
            }
        }
    }

    // Create a randomized maze
    randomize_maze() {
        let n = this.N;
        let maze = {
            visited: new Array(n).fill(0).map(() => new Array(n).fill(false)),
            connected: new Array(n).fill(0).map(() => new Array(n).fill(0).map(() => new Array(4).fill(false)))
        }
        let start_x = get_rand_num(n), start_z = get_rand_num(n);
        maze.visited[start_x][start_z] = true;
        this.recursive_maze_gen(maze, start_x, start_z);

        this.maze_connections = maze.connected;
    }

    log_maze() {
        let out = "";
        for (let z = 0; z < this.N; z++) {
            for (let x = 0; x < this.N; x++) {
                out += "+";
                out += (this.maze_connections[x][z][3] ? " " : "-");
            }
            out += "+\n";
            for (let x = 0; x < this.N; x++) {
                out += (this.maze_connections[x][z][2] ? " " : "|");
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
        // Draw the peg
        this.scene.shapes.peg.draw(
            context, program_state,
            model_transform.times(this.peg_transform), 
            this.scene.materials.wall
        );
    }

    draw_wall(context, program_state, model_transform, x_dir) {
        // Draw the wall
        if (x_dir) {
            this.scene.shapes.wall.draw(
                context, program_state,
                model_transform.times(this.wall_transform_x), 
                this.scene.materials.wall
            );
        } else {
            this.scene.shapes.wall.draw(
                context, program_state,
                model_transform.times(this.wall_transform_z), 
                this.scene.materials.wall
            );
        }
    }

    draw_floor(context, program_state, model_transform) {    
        this.scene.shapes.floor.draw(
            context, program_state,
            model_transform.times(this.floor_transform),
            this.scene.materials.floor
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
                if (!this.maze_connections[x][z][3])
                    this.draw_wall(context, program_state, x_translation.times(z_translation), true);
                x_translation = x_translation.times(Mat4.translation(this.CELL_SIZE, 0, 0));
            }
            z_translation = z_translation.times(Mat4.translation(0, 0, this.WALL_WIDTH));
            // Draw z-axis aligned walls
            x_translation = Mat4.identity();
            for (let x = 0; x <= this.N; x++) {
                if (x == this.N || !this.maze_connections[x][z][2])
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

    // Generates a random position for the cheese in the area defined by the cell coordinates
    randomize_cheese_position(min_x, max_x, min_z, max_z) {
        this.cheese_x = (min_x + get_rand_num(max_x - min_x) + 0.5) * (this.CELL_SIZE + this.WALL_WIDTH) + 0.25;
        this.cheese_z = (min_z + get_rand_num(max_z - min_z) + 0.5) * (this.CELL_SIZE + this.WALL_WIDTH) + 0.25;
        this.calculate_cheese_transform();
    }

    // Generates a random starting position for the cheese in the bottom right of the maze
    starting_cheese_position() {
        let N2f = Math.floor(this.N/2);
        let N2c = Math.ceil(this.N/2);
        this.randomize_cheese_position(N2f, N2f+N2c, N2f, N2f+N2c);
    }

    draw_cheese(context, program_state) {
        let t = program_state.animation_time / 1000;
        let float_height = .5*Math.sin(Math.PI*t) + 1;
        let FloatTr = Mat4.translation(0, float_height, 0);
        let Rot = Mat4.rotation(t*Math.PI/4.0, 0, 1, 0);

        this.scene.shapes.cheese.draw(
            context, program_state, 
            FloatTr.times(this.cheese_transform).times(Rot), 
            this.scene.materials.cheese
        );
    }
}
