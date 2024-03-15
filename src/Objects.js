import {defs, tiny} from '../common.js';
import { get_rand_num } from './Utils.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;

export class Maze_Object {
    constructor(scene, model_size, start_pos) {
        this.type = "object";
        this.scene = scene;
        this.model_size = model_size;
        this.pos = start_pos;
        this.mid_pos = vec3(
            this.pos[0] + this.model_size[0] / 2,
            this.pos[1] + this.model_size[1] / 2,
            this.pos[2] + this.model_size[2] / 2
        );
    }

    calculate_model_transform() {
        // Make sure corner of object is at origin before scaling
        let OriginTr = Mat4.translation(1, 1, 1);
        // Scale object down to a 1x1x1 cube before applying other scaling
        let ShrinkSc = Mat4.scale(0.5, 0.5, 0.5);
        // Scale the object by its model size
        let ObjectSc = Mat4.scale(this.model_size[0], this.model_size[1], this.model_size[2]);
        // Translate the object to its final position
        let ObjectTr = Mat4.translation(this.pos[0], this.pos[1], this.pos[2]);

        this.model_transform = ObjectTr.times(ObjectSc).times(ShrinkSc).times(OriginTr);
    }

    draw() {}
}


export class Floor extends Maze_Object {
    constructor(scene, model_size, start_pos) {
        super(scene, model_size, start_pos);
        this.type = "floor";

        this.calculate_model_transform();
    }

    draw(context, program_state) {
        this.scene.shapes.floor.draw(
            context, program_state,
            this.model_transform,
            this.scene.materials.floor
        );
    }
}

export class Wall extends Maze_Object {
    constructor(scene, model_size, start_pos) {
        super(scene, model_size, start_pos);
        this.type = "wall";

        this.calculate_model_transform();
    }

    draw(context, program_state) {
        this.scene.shapes.wall.draw(
            context, program_state,
            this.model_transform, 
            this.scene.materials.wall
        );
    }
}

export class Peg extends Maze_Object {
    constructor(scene, model_size, start_pos) {
        super(scene, model_size, start_pos);
        this.type = "peg";

        this.calculate_model_transform();
    }

    draw(context, program_state) {
        this.scene.shapes.peg.draw(
            context, program_state,
            this.model_transform,
            this.scene.materials.wall
        );
    }
}

export class Cheese extends Maze_Object {
    constructor(scene, model_size) {
        super(scene, model_size, vec3(0, 0, 0));
        this.type = "cheese";

        this.calculate_model_transform();
    }

    randomize_cheese_position(min_x, max_x, min_z, max_z, cell_size, wall_width) {
        this.pos[0] = (min_x + get_rand_num(max_x - min_x) + 0.5) * (cell_size + wall_width);
        this.pos[2] = (min_z + get_rand_num(max_z - min_z) + 0.5) * (cell_size + wall_width);
        
        this.mid_pos = vec3(
            this.pos[0] + this.model_size[0] / 2,
            this.pos[1] + this.model_size[1] / 2,
            this.pos[2] + this.model_size[2] / 2
        );

        this.calculate_model_transform();
    }

    // Generates a random starting position for the cheese in the bottom right of the maze
    starting_cheese_position(N, cell_size, wall_width) {
        let N2f = Math.floor(N/2);
        let N2c = Math.ceil(N/2);
        this.randomize_cheese_position(N2f, N2f+N2c, N2f, N2f+N2c, cell_size, wall_width);
    }

    draw(context, program_state) {
        let t = program_state.animation_time / 1000;
        let float_height = .5*Math.sin(Math.PI*t) + 1;
        let FloatTr = Mat4.translation(0, float_height, 0);
        let Rot = Mat4.rotation(t*Math.PI/4.0, 0, 1, 0);
        let OrientationRt = Mat4.rotation(Math.PI/2, 1, 0, 0);

        this.scene.shapes.cheese.draw(
            context, program_state, 
            FloatTr.times(this.model_transform).times(Rot).times(OrientationRt), 
            this.scene.materials.cheese
        );
    }
}
