import {defs, tiny} from '../common.js';
import {Text_Line} from './Text_Line.js';
import {Maze} from './Maze.js';
import {Mouse} from './Mouse.js';
import { Cheese } from './Objects.js';
import { Wedge } from './Shapes.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;

export class Mouse_Maze extends Scene {
    constructor() {
        super();

        // Shapes
        this.shapes = {
            cube: new defs.Cube(),
            cheese: new Wedge(),
            grass: new defs.Cube(),
            peg: new defs.Cube(),
            wall: new defs.Cube(),
            floor: new defs.Cube(),
            text: new Text_Line(35),
            timer: new Text_Line(35),
            best_score_text: new Text_Line(35),
            cylinder: new defs.Capped_Cylinder(1, 30, [[0, 2], [0, 1]]),
            rounded_cylinder: new defs.Rounded_Capped_Cylinder(1, 20, [[0, 2], [0, 1]]),
            bg_sphere: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(4),
            sphere: new defs.Subdivision_Sphere(4),
            blocky_sphere: new defs.Subdivision_Sphere(2),
            cone: new defs.Cone_Tip(1, 30, [[0, 2], [0, 1]])
        };

        // Shaders
        let phong = new defs.Phong_Shader();
        let textured_phong = new defs.Textured_Phong();
        let bump_map = new defs.Fake_Bump_Map();

        // Materials
        this.materials = {
            blank: new Material(phong, {ambient: .8, diffusivity: .8, color: color(1,1,1,1)}),
            background: new Material(phong, {
                ambient: 1, diffusivity: 0, specularity: 0,
                color: hex_color('#87CEEB')
            }),
            grass: new Material(textured_phong, {
                ambient: 1, diffusivity: 0, specularity: 0,
                color: hex_color('#000000'),
                texture: new Texture('../assets/grass.jpg')
            }),
            table: new Material(textured_phong, {
                ambient: .8, diffusivity: .8, specularity: .2,
                texture: new Texture('../assets/oak.jpg')
            }),
            wood: new Material(bump_map, {ambient: .2, color: hex_color('#cdaa7d')}),
            mouse: new Material(phong, {
                ambient: .8, diffusivity: 0.2, specularity: 0,
                color: hex_color('#c0c0c0')
            }),
            mouse_2: new Material(phong, {
                ambient: .8, diffusivity: 0.2, specularity: 0,
                color: hex_color('#c29c93')
            }),
            mouse_eye: new Material(phong, {
                ambient: .8, diffusivity: 0.2, specularity: 0.6,
                color: hex_color('#000000')
            }),
            wall: new Material(bump_map, {
                ambient: .8, diffusivity: .8, specularity: .2,
                texture: new Texture('../assets/wall.jpg')
            }),
            floor: new Material(bump_map, {
                ambient: .8, diffusivity: .6, specularity: .1,
                color: color(0, 0, 0, 1),
                texture: new Texture('../assets/floor_alt.jpg')
            }),
            cheese: new Material(textured_phong, {
                ambient: .8, diffusivity: 1, specularity: 0,
                texture: new Texture('../assets/cheese.jpg')
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
        let MAZE_START_POS = vec3(0, 0, 0);

        this.Maze = new Maze(this, N, CELL_SIZE, WALL_WIDTH, WALL_HEIGHT, MAZE_START_POS);
        
        // Create the cheese
        this.Cheese = new Cheese(this, vec3(1, 1, 1));
        this.Cheese.starting_cheese_position(N, CELL_SIZE, WALL_WIDTH);

        // Mouse variables
        let start_loc = (CELL_SIZE+WALL_WIDTH) * 0.5 + 0.25;
        let mouse_start_pos = vec4(start_loc, 1, start_loc, 1);
        let mouse_speed = 10;
        this.Mouse = new Mouse(this, mouse_start_pos, mouse_speed);

        // Adjust textures for shapes
        this.shapes.floor.arrays.texture_coord.forEach((v, i, l) => {
            v[0] = v[0] * N;
            v[2] = v[2] * N;
        });
        
        this.shapes.peg.arrays.texture_coord.forEach((v, i, l) => {
            v[0] = v[0] * WALL_WIDTH / CELL_SIZE;
            v[2] = v[2] * WALL_WIDTH / CELL_SIZE;
        });

        this.shapes.cheese.arrays.texture_coord.forEach((v, i, l) => {
            v[0] = v[0] * 0.5;
            v[2] = v[2] * 0.5;
        });

        this.shapes.grass.arrays.texture_coord.forEach((v, i, l) => {
            v[0] = v[0] * 10;
            v[1] = v[1] * 10;
            v[2] = v[2] * 10;
        });

        // Camera overlooking maze
        this.top_down_camera = Mat4.look_at(vec3(SIZE/2, 70, SIZE*3/5), vec3(SIZE/2, 0, SIZE/2), vec3(0, 1, 0));
        this.top_down_enabled = false;
        this.third_person_enabled = 0;
        
        this.pressedStart = false;

        // Game length
        this.GAME_LENGTH = 300;

        //start game functionality
        this.startMenu = document.getElementById("start-menu");
        this.welcomeText = document.getElementById("welcome-message");
        this.start_button = document.getElementById("start-button");

        //text inside message
        this.welcomeText.textContent = "Mouse Maze";
        this.welcomeText.style.color = "white";
        this.start_button.textContent = "New Game";

        this.start_button.onclick = () => {
            this.pressedStart = true;
            this.startMenu.style.display = 'none';
        };

        //play again button
        this.playAgain_button = document.getElementById("startAgain-button");
        this.playAgain_button.onclick = () => {
            this.pressedStart = true;
            this.endGame = false;
            this.startMenu.style.display = 'none';
            this.gameDoneMenu.style.display = 'none';
            this.count = 0; //reset the count
            this.high_score = false;
            this.Mouse.reset();
            this.Maze.randomize_maze();
            this.Cheese.starting_cheese_position(N, CELL_SIZE, WALL_WIDTH);
        };

        //quit game button
        this.quit_button = document.getElementById("quit-button");
        this.quit_button.onclick = () => {
            this.pressedStart = false;
            this.endGame = false;
            this.startMenu.style.display = 'block';
            this.gameDoneMenu.style.display = 'none';
            this.count = 0 //reset the count
            this.high_score = false;
            this.Mouse.reset();
            this.Maze.randomize_maze();
            this.Cheese.starting_cheese_position(N, CELL_SIZE, WALL_WIDTH);
        };
        //end game menu
        this.gameDoneMenu = document.getElementById("gameDone-menu");
        this.gameDoneMessage = document.getElementById("gameDone-message");
        this.gameTime = document.getElementById("timer");
        this.gamePersonalScore = document.getElementById("personal-Score");
        this.gameHighScore = document.getElementById("high-score");


        this.gameDoneMessage.textContent = "Game over";
        this.gameDoneMessage.style.color = "white";
        this.gameTime.style.color = "white";
        this.gamePersonalScore.style.color = "yellow";
        this.gameHighScore.textContent = "Your score: ";

        //initially make it not show
        //COME BACK TO: WEIRD RENDERING
        this.gameDoneMenu.style.display = 'none';
        this.endGame = false;


        //count how many cheese currently obtained
        this.count = 20;
        // How much the mouse slows down every time it eats a piece of cheese
        this.slow_factor = 0.2;
        this.best = 0;
        this.high_score = false;

        this.mouse_camera = null;
        //this.blending_factor = [1, 0.01, 1, 1];

        this.objects = [];
    }

    make_control_panel() {
        this.key_triggered_button("Randomize maze", ['r'], () => {
            this.Maze.randomize_maze();
            this.Maze.log_maze();
        });
        this.key_triggered_button("Randomize cheese position", ['c'], () => {
            this.Cheese.randomize_cheese_position(0, this.Maze.N, 0, this.Maze.N, this.Maze.CELL_SIZE, this.Maze.WALL_WIDTH);
        });
        this.new_line();
        // Mouse controls
        this.key_triggered_button("Move forward", ['w'], () => {
            this.Mouse.vel[2] = this.Mouse.speed - this.count*this.slow_factor;
        }, undefined, () => {
            this.Mouse.vel[2] = 0;
        });
        this.key_triggered_button("Move backward", ['s'], () => {
            this.Mouse.vel[2] = -this.Mouse.speed - this.count*this.slow_factor;
        }, undefined, () => {
            this.Mouse.vel[2] = 0;
        });
        this.key_triggered_button("Move left", ['a'], () => {
            this.Mouse.vel[0] = this.Mouse.speed - this.count*this.slow_factor;
        }, undefined, () => {
            this.Mouse.vel[0] = 0;
        });
        this.key_triggered_button("Move right", ['d'], () => {
            this.Mouse.vel[0] = -this.Mouse.speed - this.count*this.slow_factor;
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
        this.key_triggered_button("Third person view", ['v'], () => {
            this.third_person_enabled = (this.third_person_enabled + 1) % 3;
        });
        this.key_triggered_button("Top down view", ['m'], () => {
            this.top_down_enabled = !this.top_down_enabled;
        });
        this.key_triggered_button("Fullscreen", ['f'], () => {
            document.getElementsByTagName('canvas')[0].requestFullscreen();
        });
        this.key_triggered_button("Quit game", ['p'], () => {
            this.total_time = (this.t - this.start_time).toFixed(1);
            this.pressedStart = false;
            this.endGame = true;
        })
        //added for start menu
        // this.key_triggered_button("Start Game", ['S'], () => {
        //    // pressed;
        // }, undefined, () => {
        //     this.pressedStart = true;
        // });
    }
    
    // Draws a solid-color background around the maze and some other objects
    draw_background(context, program_state) {
        this.shapes.bg_sphere.draw(
            context, program_state,
            Mat4.translation(this.Maze.SIZE/2, 0, this.Maze.SIZE/2)
            .times(Mat4.scale(70, 80, 70)),
            this.materials.background
        )

        // Grass
        this.shapes.grass.draw(
            context, program_state, 
            Mat4.translation(0, -3, 0).times(Mat4.scale(100, 1, 100)), 
            this.materials.grass
        );

        // Table
        this.shapes.cylinder.draw(
            context, program_state,
            Mat4.translation(this.Maze.SIZE/2, -2, this.Maze.SIZE/2).times(Mat4.scale(this.Maze.SIZE*4/5, 1, this.Maze.SIZE*4/5)).times(Mat4.rotation(Math.PI/2, 1, 0, 0)),
            this.materials.table
        );
    }

    display(context, program_state) {
        // Projection matrix
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);
        
        this.t = program_state.animation_time / 1000;
        const dt = program_state.animation_delta_time / 1000;

        // Lights
        program_state.lights = [];

        let cheese_float_height = .5*Math.sin(Math.PI*this.t) + 1;

        //console.log(this.Cheese.mid_pos[0], this.Cheese.mid_pos[1], this.Cheese.mid_pos[2]);
        let cheese_light_pos = vec4(this.Cheese.mid_pos[0], this.Cheese.mid_pos[1] + cheese_float_height, this.Cheese.mid_pos[2], 1);
        let global_light_pos = vec4(this.Maze.SIZE/2, this.Maze.pos[1] + 100, this.Maze.SIZE/2, 1);
        program_state.lights.push(new Light(cheese_light_pos, hex_color('#FFFF00'), 100));
        program_state.lights.push(new Light(global_light_pos, color(1, 1, 1, 1), 100000));

       if (this.pressedStart) {
            // this.shapes.cube.draw(
            //     context, program_state, Mat4.translation(Maze.SIZE/2, 0, Maze.SIZE/2).times(Mat4.scale(50, 1000, 50)), this.materials.background
            // );
            this.draw_background(context, program_state);
            this.Maze.draw_maze(context, program_state);
            //this.Maze.draw_cheese(context, program_state);
            // this.shapes.wedge.draw(context, program_state, Mat4.translation(3, 2, 3).times(Mat4.scale(0.5, 0.5, 0.5)), this.materials.cheese);
            this.Cheese.draw(context, program_state);
            this.Mouse.move(dt);
            this.Mouse.draw_mouse(context, program_state);
            this.mouse_camera = Mat4.look_at(this.Mouse.eye_vec(), this.Mouse.at_vec(), vec3(0, 1, 0));
            this.third_person_mouse_camera = Mat4.look_at(this.Mouse.third_person_eye_vec(), this.Mouse.at_vec(), vec3(0, 1, 0));
            this.front_mouse_camera = Mat4.look_at(this.Mouse.front_eye_vec(), this.Mouse.front_at_vec(), vec3(0, 1, 0));

            if (this.top_down_enabled) {
                //program_state.set_camera(this.top_down_camera.map((x, i) => Vector.from(program_state.camera_inverse[i]).mix(x, this.blending_factor[i])));
                program_state.set_camera(this.top_down_camera);
            } else if (this.third_person_enabled == 1) {
                program_state.set_camera(this.third_person_mouse_camera)
            } else if (this.third_person_enabled == 2) {
                program_state.set_camera(this.front_mouse_camera);
            } else {
                //program_state.set_camera(this.mouse_camera.map((x, i) => Vector.from(program_state.camera_inverse[i]).mix(x, this.blending_factor)));
                program_state.set_camera(this.mouse_camera);
            }

            //make timer count down
            var currentTime = (this.GAME_LENGTH - (this.t - this.start_time)).toFixed(1);
            let timerDisplay = "Time remaining: " + currentTime;

            let timer_transform = Mat4.inverse(program_state.camera_inverse)
                .times(Mat4.translation(-11.0/16, 6.0/16, -1))
                .times(Mat4.scale(1.0/64, 1.0/64, 1.0/64));
            this.shapes.timer.set_string(timerDisplay, context.context);
            this.shapes.timer.draw(context, program_state, timer_transform, this.materials.text_image);

            // Visually display the counter in the top left of the screen
            let countDisplay = "Cheese eaten: " + this.count;
            this.shapes.text.set_string(countDisplay, context.context);
            let counter_transform = Mat4.inverse(program_state.camera_inverse)
                .times(Mat4.translation(6.0/16, 6.0/16, -1))
                .times(Mat4.scale(1.0/64, 1.0/64, 1.0/64));
            this.shapes.text.draw(context, program_state, counter_transform, this.materials.text_image);

            let bestDisplay = "High score: " + this.best;
            this.shapes.best_score_text.set_string(bestDisplay, context.context);
            let best_transform = Mat4.inverse(program_state.camera_inverse)
                .times(Mat4.translation(6.0/16, 5.0/16, -1))
                .times(Mat4.scale(1.0/64, 1.0/64, 1.0/64));
            this.shapes.best_score_text.draw(context, program_state, best_transform, this.materials.text_image);

            

            //if mouse touched the cheese -> randomize cheese object & increase count
            if(Math.abs(this.Mouse.mid_pos[0] - this.Cheese.mid_pos[0]) <= 1 && Math.abs(this.Mouse.mid_pos[2] - this.Cheese.mid_pos[2]) <= 1 ) {
                this.Cheese.randomize_cheese_position(0, this.Maze.N, 0, this.Maze.N, this.Maze.CELL_SIZE, this.Maze.WALL_WIDTH);
                this.count += 1;
                if (this.count > this.best) {
                    this.best = this.count;
                    this.high_score = true;
                }
                console.log(this.count);
            }

            //if currentTime less than or equal to 0.  END GAME
           if (currentTime <= 0) {
                this.total_time = this.GAME_LENGTH;
               this.pressedStart = false;
               this.endGame = true;
           }
       }
       else {
        this.start_time = this.t;
       }

       //if the game finished
       if(this.endGame){
            //end game functionality
            this.gameDoneMenu.style.display = 'block';
            this.gameTime.textContent = "Game length: " + this.total_time + " seconds";
            this.gamePersonalScore.textContent = "Score: " + this.count +  (this.high_score ? " (new best)" : "");
            this.gamePersonalScore.style.color = this.high_score ? "gold" : "lightyellow";
            this.gameHighScore.textContent = "High score: " + this.best;
            this.gameHighScore.style.color = this.high_score ? "gold" : "lightyellow";

            //console.log("count: ", this.count);
       }
    }
}
