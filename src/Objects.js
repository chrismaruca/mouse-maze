import {defs, tiny} from '../common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;

export class Maze_Object {
    constructor(scene, model_size, start_pos) {
        this.scene = scene;
        this.model_size = model_size;
        this.pos = start_pos;
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