import {defs, tiny} from './common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class Mouse_Maze extends Scene {
    constructor() {
        super();

        // Shapes
        this.shapes = {
            cube: new defs.Cube(),
        };

        // Materials
        this.materials = {
            blank: new Material(new defs.Phong_Shader(), {ambient: 1, color: color(1,1,1,1)}),
            light_wood: new Material(new defs.Phong_Shader(), {ambient: 1, color: hex_color('deb887')}),
            wood: new Material(new defs.Phong_Shader(), {ambient: 1, color: hex_color('cdaa7d')}),
            dark_wood: new Material(new defs.Phong_Shader(), {ambient: 1, color: hex_color('8b6914')})
        };

        this.N = 12; // Dimensions: 12 x 12
        this.SIZE = this.N * 4;
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

            if (nx >= 0 && nx < this.N && nz >= 0 && nz < this.N && !Maze.visited[nx][nz]) {
                Maze.visited[nx][nz] = true;
                Maze.connected[x][z][r] = true;
                Maze.connected[nx][nz][(r+2)%4] = true;
                this.recursive_maze_gen(Maze, nx, nz);
            }
        }
    }

    // Create a randomized maze
    generate_maze_connections() {
        let n = this.N;
        let Maze = {
            visited: new Array(n).fill(0).map(() => new Array(n).fill(false)),
            connected: new Array(n).fill(0).map(() => new Array(n).fill(0).map(() => new Array(4).fill(false)))
        }
        // directions: 0 == +x, 1 == +z, 2 == -x, 3 == -z
        Maze.visited[0][0] = true;
        this.recursive_maze_gen(Maze, 0, 0);
        return Maze.connected;
    }

    log_maze(connected) {
        let out = "";
        for (let i = 0; i < this.N; i++) {
            for (let j = 0; j < this.N; j++) {
                out += "+";
                out += (connected[i][j][2] ? " " : "-");
                //out += "+";
            }
            out += "+\n";
            for (let j = 0; j < this.N; j++) {
                out += (connected[i][j][3] ? " " : "|");
                out += " ";
                //out += (connected[i][j][1] ? " " : "|");
            }
            /*
            out += "\n";
            for (let j = 0; j < this.N; j++) {
                out += "+";
                out += (connected[i][j][0] ? " " : "-");
                out += "+";
            }*/
            out += "|\n";
        }
        for (let i = 0; i < this.N; i++) {
            out += "+-";
        }
        out += "+\n";
        console.log(out);
    }


    draw_floor(context, program_state) {
        let floor_model_transform = Mat4.identity();

        let OriginTr = Mat4.translation(1, 1, 1);
        let FloorSc = Mat4.scale(this.SIZE/2, 0.5, this.SIZE/2);
        //let FloorTr = Mat4.translation(0, -1, 0);
        
        floor_model_transform = floor_model_transform.times(FloorSc).times(OriginTr);
        this.shapes.cube.draw(context, program_state, floor_model_transform, this.materials.wood);
        
        let plank_model_transform = Mat4.identity();

        let PlankScDown = Mat4.scale(0.5, 0.5, 0.5);
        let PlankSc = Mat4.scale(this.SIZE, 5, 0.5);
        let PlankTrUp = Mat4.translation(0, 1, 0);
        let PlankRt = Mat4.rotation(-Math.PI / 2, 0, 1, 0);
        let PlankXAdj = Mat4.translation(0.5, 0, 0);
        let PlankZAdj = Mat4.translation(0, 0, -0.5);
        let PlankXTr = Mat4.translation(this.SIZE, 0, 0);
        let PlankZTr = Mat4.translation(0, 0, this.SIZE);

        plank_model_transform = plank_model_transform.times(PlankTrUp).times(PlankSc).times(PlankScDown).times(OriginTr);

        // Top wall z = 0
        this.shapes.cube.draw(context, program_state, plank_model_transform, this.materials.light_wood);
        // Left wall x = 0
        this.shapes.cube.draw(context, program_state, PlankXAdj.times(PlankRt).times(plank_model_transform), this.materials.light_wood)
        // Right wall x = SIZE
        this.shapes.cube.draw(context, program_state, PlankXTr.times(PlankRt).times(plank_model_transform), this.materials.light_wood)
        // Bottom wall z = SIZE
        this.shapes.cube.draw(context, program_state, PlankZAdj.times(PlankZTr).times(plank_model_transform), this.materials.light_wood);
    }

    display(context, program_state) {
        // Initial setup
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            program_state.set_camera(Mat4.translation(0, 0, 0));
            
            this.log_maze(this.generate_maze_connections());
        }
        // Projection matrix
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);
        
        // Lights
        program_state.lights = [];
        
        this.draw_floor(context, program_state);
    }
}