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

    third_person_eye_vec() {
        return this.pos.to3().plus(vec3(-3.0 * Math.sin(this.angle), 1.2, -3.0 * Math.cos(this.angle)));
    }

    front_eye_vec() {
        return this.pos.to3().plus(vec3(4.0 * Math.sin(this.angle), 1.2, 4.0 * Math.cos(this.angle)));
    }

    at_vec() {
        return this.pos.to3().plus(vec3(1 * Math.sin(this.angle), 0, 1 * Math.cos(this.angle)));
    }

    front_at_vec() {
        return this.pos.to3().plus(vec3(-1 * Math.sin(this.angle), 0, -1 * Math.cos(this.angle)));
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
        // Make mouse size 1x1x1
        let ShrinkSc = Mat4.scale(0.5, 0.5, 0.5);
        // Rotate mouse by its angle
        let AngleRot = Mat4.rotation(this.angle, 0, 1, 0);
        // Translate mouse to its position
        let PosTr = Mat4.translation(this.pos[0], this.pos[1]-0.25, this.pos[2]);
        // General mouse position matrix
        let mouse_matrix = PosTr.times(AngleRot);

        // Mouse main body
        let MainBodySc = Mat4.scale(1, 1, 1.25);
        let MainBodyTr = Mat4.translation(0, 0, -.05675);
        this.scene.shapes.sphere.draw(
            context, program_state,
            mouse_matrix.times(MainBodySc).times(MainBodyTr).times(ShrinkSc),
            this.scene.materials.mouse
        );

        let CylinderSc = Mat4.scale(.95, .95, 0.5);
        let CylinderTr = Mat4.translation(0, 0, 0);
        this.scene.shapes.cylinder.draw(
            context, program_state,
            mouse_matrix.times(CylinderSc).times(CylinderTr).times(ShrinkSc),
            this.scene.materials.mouse
        );
        
        // Mouse nose
        let ConeSc = Mat4.scale(.96, 0.96, 0.8);
        let ConeTr = Mat4.translation(0, 0, 0.80);
        let cone_matrix = mouse_matrix.times(ConeSc).times(ConeTr).times(ShrinkSc);
        this.scene.shapes.cone.draw(
            context, program_state,
            cone_matrix,
            this.scene.materials.mouse
        );

        // Nose tip
        let NubSc = Mat4.scale(0.125, 0.125, 0.125);
        let NubTr = Mat4.translation(0, 0, 1);
        let nub_matrix = mouse_matrix.times(NubTr).times(NubSc).times(ShrinkSc);
        this.scene.shapes.blocky_sphere.draw(
            context, program_state,
            nub_matrix,
            this.scene.materials.mouse_2
        );

        // Eyes
        let EyeSc = Mat4.scale(1.0/16.0, 1.0/16.0, 1.0/16.0);
        let LeftEyeTr = Mat4.translation(-0.1875, 0.125, .75);
        let RightEyeTr = Mat4.translation(0.1875, 0.125, .75);
        let left_eye_matrix = mouse_matrix.times(LeftEyeTr).times(EyeSc).times(ShrinkSc);
        let right_eye_matrix = mouse_matrix.times(RightEyeTr).times(EyeSc).times(ShrinkSc);
        this.scene.shapes.blocky_sphere.draw(
            context, program_state,
            left_eye_matrix,
            this.scene.materials.mouse_eye
        );
        this.scene.shapes.blocky_sphere.draw(
            context, program_state,
            right_eye_matrix,
            this.scene.materials.mouse_eye
        );

        // Ears
        let EarSc = Mat4.scale(5.0/16.0, 5.0/16.0, 1.0/16.0);
        let LeftEarTr = Mat4.translation(-0.35, 0.35, .5);
        let RightEarTr = Mat4.translation(0.35, 0.35, .5);
        let left_ear_matrix = mouse_matrix.times(LeftEarTr).times(EarSc).times(ShrinkSc);
        let right_ear_matrix = mouse_matrix.times(RightEarTr).times(EarSc).times(ShrinkSc);
        this.scene.shapes.blocky_sphere.draw(
            context, program_state,
            left_ear_matrix,
            this.scene.materials.mouse_2
        );
        this.scene.shapes.blocky_sphere.draw(
            context, program_state,
            right_ear_matrix,
            this.scene.materials.mouse_2
        );

        // Tail
        let TailSc = Mat4.scale(1.0/16.0, 1.0/16.0, .5);
        let TailTr = Mat4.translation(0, -0.375, -0.6);
        let tail_matrix = mouse_matrix.times(TailTr).times(TailSc).times(ShrinkSc);
        this.scene.shapes.blocky_sphere.draw(
            context, program_state,
            tail_matrix,
            this.scene.materials.mouse_2
        )
    }

    reset() {
        this.pos = this.start_pos;
        this.angle = 0;
    }
}
