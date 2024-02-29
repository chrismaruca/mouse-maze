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

        this.N = 12; // The board is N x N cells large
        this.CELL_SIZE = 4; // Each cell is CELL_SIZE x CELL_SIZE large
        this.SIZE = this.N * this.CELL_SIZE;
        this.HEIGHT = 3; // The height of the walls

        // Camera overlooking maze
        this.initial_camera_location =  Mat4.look_at(vec3(this.SIZE/2, 70, this.SIZE*3/5), vec3(this.SIZE/2, 0, this.SIZE/2), vec3(0, 1, 0));
        //initialize cheese position vars
        this.randX = 0;
        this.randY = 0;

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
        for (let z = 0; z < this.N; z++) {
            for (let x = 0; x < this.N; x++) {
                out += "+";
                out += (connected[x][z][3] ? " " : "-");
                //out += "+";
            }
            out += "+\n";
            for (let x = 0; x < this.N; x++) {
                out += (connected[x][z][2] ? " " : "|");
                out += " ";
                //out += (connected[x][z][0] ? " " : "|");
            }
            /*
            out += "\n";
            for (let x = 0; x < this.N; x++) {
                out += "+";
                out += (connected[x][z][1] ? " " : "-");
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

    draw_maze(context, program_state) {
        let peg_model_transform = Mat4.identity();
        let x_wall_model_transform = Mat4.identity();
        let z_wall_model_transform = Mat4.identity();

        // Transformations
        let OriginTr = Mat4.translation(1, 1, 1);
        let TrUp = Mat4.translation(0, 1, 0);
        let TrXDir = Mat4.translation(this.CELL_SIZE, 0, 0);
        let TrZDir = Mat4.translation(0, 0, this.CELL_SIZE);

        // For the pegs
        let PegSc = Mat4.scale(0.5, this.HEIGHT, 0.5);
        peg_model_transform = peg_model_transform.times(TrUp).times(PegSc).times(OriginTr);

        // Draw pegs
        for (let i = 0; i <= this.N; i++) {
            let curr_model_transform = peg_model_transform;
            for (let j = 0; j <= this.N; j++) {
                this.shapes.cube.draw(context, program_state, curr_model_transform, this.materials.wood);
                curr_model_transform = TrZDir.times(curr_model_transform);
            }
            peg_model_transform = TrXDir.times(peg_model_transform);
        }

        // Translations for the walls
        let XWallSc = Mat4.scale((this.CELL_SIZE-1)*0.5, this.HEIGHT, 0.5);
        let ZWallSc = Mat4.scale(0.5, this.HEIGHT, (this.CELL_SIZE-1)*0.5);
        let XWallAdj = Mat4.translation(1, 0, 0);
        let ZWallAdj = Mat4.translation(0, 0, 1);
        x_wall_model_transform = x_wall_model_transform.times(XWallAdj).times(TrUp).times(XWallSc).times(OriginTr);
        z_wall_model_transform = z_wall_model_transform.times(ZWallAdj).times(TrUp).times(ZWallSc).times(OriginTr);
        
        // Draw walls
        let TotalZTr = Mat4.identity();
        for (let z = 0; z < this.N; z++) {
            let TotalXZTr = TotalZTr;
            for (let x = 0; x < this.N; x++) {
                if (!this.maze[x][z][3])
                    this.shapes.cube.draw(context, program_state, TotalXZTr.times(x_wall_model_transform), this.materials.light_wood);
                if (!this.maze[x][z][2])
                    this.shapes.cube.draw(context, program_state, TotalXZTr.times(z_wall_model_transform), this.materials.light_wood);
                TotalXZTr = TrXDir.times(TotalXZTr);
            }
            this.shapes.cube.draw(context, program_state, TotalXZTr.times(z_wall_model_transform), this.materials.light_wood);
            TotalZTr = TrZDir.times(TotalZTr);
        }
        // Draw bottom wall
        let TotalXZTr = TotalZTr;
        for (let x = 0; x < this.N; x++) {
            this.shapes.cube.draw(context, program_state, TotalXZTr.times(x_wall_model_transform), this.materials.light_wood);
            TotalXZTr = TrXDir.times(TotalXZTr);
        }
    }

    draw_floor(context, program_state) {
        let floor_model_transform = Mat4.identity();

        let OriginTr = Mat4.translation(1, 1, 1);
        let FloorSc = Mat4.scale(this.SIZE/2, 0.5, this.SIZE/2);
        //let FloorTr = Mat4.translation(0, -1, 0);
        
        floor_model_transform = floor_model_transform.times(FloorSc).times(OriginTr);
        this.shapes.cube.draw(context, program_state, floor_model_transform, this.materials.dark_wood);
        /*
        // Outer walls
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
        */
    }


    //generates cheese position only onc
    randomCheesePosition(){
        this.randX = this.get_rand_num(this.SIZE);
        this.randY = this.get_rand_num(this.SIZE);
    }


    display(context, program_state) {
        // Initial setup
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            program_state.set_camera(this.initial_camera_location);
            this.randomCheesePosition(); //new cheese position every time refreshed
            
            this.maze = this.generate_maze_connections();
            this.log_maze(this.maze);
        }
        // Projection matrix
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);
        
        // Lights
        program_state.lights = [];
        
        this.draw_floor(context, program_state);
        this.draw_maze(context, program_state);



        //x and z random change. y == 1 held constant. random position cheese

        //TO DO: make sure randomCheesePosition() called when other player touches it
        //TO DO: make sure cheese doesn't spawn in wall
        //TO DO:



      //draw cheese
        let test_transform = Mat4.identity();
       let randomPositionCheese = test_transform.times(Mat4.translation(this.randX,1,this.randY));
        this.shapes.cube.draw(context, program_state, randomPositionCheese, this.materials.wood.override({color: hex_color('#FFFF00')}));


    }
}