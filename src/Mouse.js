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
        this.mid_pos = this.pos.to3();
        this.last_pos = start_pos;
        // Mouse viewing angle
        this.angle = 0;
        this.last_angle = 0;
        // Mouse velocity
        this.vel = vec4(0, 0, 0, 0);
        // Mouse rotational velocity
        this.rotv = 0;
        // Mouse movement speed
        this.speed = speed;

        this.model_size = vec3(1, 1, 1);
        this.rotated_model = vec3(1, 1, 1);
    }

    eye_vec() {
        return this.pos.to3().plus(vec3(0.5 * Math.sin(this.angle), 0, 0.5 * Math.cos(this.angle)));
    }

    at_vec() {
        return this.pos.to3().plus(vec3(1 * Math.sin(this.angle), 0, 1 * Math.cos(this.angle)));
    }

    has_collision(maze_object) {
        // There is a collision if the distance between the midpoints of the object and mouse
        // is less than half the size of the object plus half the size of the mouse
        for (let i = 0; i < 3; i++) {
            if (Math.abs(this.mid_pos[i] - maze_object.mid_pos[i]) >= (this.model_size[i]*.707 + maze_object.model_size[i]/2)) {
                return false;
            }
        }

        return true;
    }

    move(dt) {
        this.angle = this.angle + this.rotv * dt;
        let rotated_vel = vec4(
            this.vel[0] * Math.cos(this.angle) + this.vel[2] * Math.sin(this.angle),
            this.vel[1],
            this.vel[2] * Math.cos(this.angle) - this.vel[0] * Math.sin(this.angle));
        this.pos = this.pos.plus(rotated_vel.times(dt));
        this.mid_pos = this.pos.to3();

        // Check for collisions
        for (let i in this.scene.Maze.objects) {
            if (this.has_collision(this.scene.Maze.objects[i])) {
                // If there's a collision then don't let the mouse move
                this.pos = this.last_pos;
                this.angle = this.last_angle;
                break;
            }
        }

        this.last_pos = this.pos;
        this.last_angle = this.angle;
    }

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
