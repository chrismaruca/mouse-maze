import {defs, tiny} from '../common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;

export class Mouse {
    constructor(scene, start_pos, speed) {
        this.scene = scene;
        // Position of the mouse
        this.start_pos = start_pos;
        this.pos = start_pos;
        // Mouse viewing angle
        this.angle = 0;
        // Mouse velocity
        this.vel = vec4(0, 0, 0, 0);
        // Mouse rotational velocity
        this.rotv = 0;
        // Mouse movement speed
        this.speed = speed;

        this.model_size = vec3(1, 1, 1);
    }

    eye_vec() {
        return this.pos.to3().plus(vec3(0.5 * Math.sin(this.angle), 0, 0.5 * Math.cos(this.angle)));
    }

    at_vec() {
        return this.pos.to3().plus(vec3(1 * Math.sin(this.angle), 0, 1 * Math.cos(this.angle)));
    }

    move(dt) {
        this.angle = this.angle + this.rotv * dt;
        let rotated_vel = vec4(
            this.vel[0] * Math.cos(this.angle) + this.vel[2] * Math.sin(this.angle),
            this.vel[1],
            this.vel[2] * Math.cos(this.angle) - this.vel[0] * Math.sin(this.angle));
        this.pos = this.pos.plus(rotated_vel.times(dt));
    }
   //get current position of mouse
   //  currentPos() {
   //      return this.pos;
   //  }

    draw_mouse(context, program_state) {
        // Make mouse a 1x1x1 cube
        let ShrinkSc = Mat4.scale(0.5, 0.5, 0.5);
        // Translate mouse to its position
        let PosTr = Mat4.translation(this.pos[0], this.pos[1], this.pos[2]);
        // Rotate mouse by its angle
        let AngleRot = Mat4.rotation(this.angle, 0, 1, 0);

        let mouse_matrix = PosTr.times(AngleRot).times(ShrinkSc);
        this.scene.shapes.cube.draw(
            context, program_state,
            mouse_matrix,
            this.scene.materials.mouse
        );
    }

    reset() {
        this.pos = this.start_pos;
        this.angle = 0;
    }
}
