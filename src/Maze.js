import {defs, tiny} from '../common.js';
import {get_rand_num} from './Utils.js';
import { Floor, Wall, Peg, Cheese } from './Objects.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;

export class Maze {
    constructor(scene, cell_n, cell_size, wall_width, wall_height, start_pos) {
        this.scene = scene;
        this.N = cell_n; // The board is N x N cells large
        this.CELL_SIZE = cell_size; // Each cell is CELL_SIZE x CELL_SIZE large
        this.WALL_WIDTH = wall_width;
        this.SIZE = this.N * (this.CELL_SIZE + this.WALL_WIDTH) + this.WALL_WIDTH; // Size of the entire maze
        this.HEIGHT = wall_height; // The height of the walls
        this.pos = start_pos;

        // Array of maze objects
        this.objects = [];

        this.randomize_maze();
        this.log_maze();
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
        
        // Construct the maze and store it in the objects array
        this.construct_maze();
    }

    // Print the maze configuration to the console
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

    // Constructs a maze and stores it in the objects array
    construct_maze() {
        // Reset the maze
        this.objects = [];

        // Create floor
        this.objects.push(new Floor(this.scene, vec3(this.SIZE, 1, this.SIZE), vec3(0, -1, 0)));

        // Draw pegs
        let z_pos = this.pos[2];
        for (let z = 0; z <= this.N; z++) {
            let x_pos = this.pos[0];

            for (let x = 0; x <= this.N; x++) {
                this.objects.push(new Peg(this.scene, vec3(this.WALL_WIDTH, this.HEIGHT, this.WALL_WIDTH), vec3(x_pos, 0, z_pos)));
                x_pos += this.WALL_WIDTH + this.CELL_SIZE;
            }

            z_pos += this.WALL_WIDTH + this.CELL_SIZE;
        }
        
        // Draw walls
        z_pos = this.pos[2];
        for (let z = 0; z < this.N; z++) {
            let x_pos = this.pos[0];

            // Draw x-axis aligned walls
            for (let x = 0; x < this.N; x++) {
                x_pos += this.WALL_WIDTH;
                if (!this.maze_connections[x][z][3]) {
                    this.objects.push(new Wall(this.scene, vec3(this.CELL_SIZE, this.HEIGHT, this.WALL_WIDTH), vec3(x_pos, 0, z_pos)));
                }
                x_pos += this.CELL_SIZE;
            }

            z_pos += this.WALL_WIDTH;
            
            // Draw z-axis aligned walls
            x_pos = this.pos[0];
            for (let x = 0; x <= this.N; x++) {
                if (x == this.N || !this.maze_connections[x][z][2]) {
                    this.objects.push(new Wall(this.scene, vec3(this.WALL_WIDTH, this.HEIGHT, this.CELL_SIZE), vec3(x_pos, 0, z_pos)));
                }

                x_pos += this.WALL_WIDTH + this.CELL_SIZE;
            }

            z_pos += this.CELL_SIZE;
        }

        // Draw bottom walls
        let x_pos = this.pos[0];
        for (let x = 0; x < this.N; x++) {
            x_pos += this.WALL_WIDTH;
            this.objects.push(new Wall(this.scene, vec3(this.CELL_SIZE, this.HEIGHT, this.WALL_WIDTH), vec3(x_pos, 0, z_pos)));
            x_pos += this.CELL_SIZE;
        }
    }

    // Draws all of the objects in the maze objects array
    draw_maze(context, program_state) {
        for (let i in this.objects) {
            this.objects[i].draw(context, program_state);
        }
    }
}
