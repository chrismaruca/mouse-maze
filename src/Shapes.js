import {defs, tiny} from '../common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;

export class Isoceles_Triangle extends Shape {
    constructor() {
        super("position", "normal", "texture_coord");

        this.arrays.position = [vec3(-1, -1, 0), vec3(1, -1, 0), vec3(0, 1, 0)];
        
        this.arrays.normal = [vec3(0, 0, 1), vec3(0, 0, 1), vec3(0, 0, 1)];
        
        this.arrays.texture_coord = [Vector.of(0, 0), Vector.of(1, 0), Vector.of(0.5, 1)];
        
        this.indices = [0, 1, 2];
    }
}

// Custom wedge shape for the cheese
export class Wedge extends Shape {
    constructor() {
        super("position", "normal", "texture_coord");

        const top_triangle_transform = Mat4.identity();
        Isoceles_Triangle.insert_transformed_copy_into(this, [], top_triangle_transform);
        const bot_triangle_transform = Mat4.translation(0, 0, 2).times(Mat4.rotation(Math.PI, 0, 1, 0));
        Isoceles_Triangle.insert_transformed_copy_into(this, [], bot_triangle_transform);
        const back_square_transform = Mat4.translation(0, -1, 0)
            .times(Mat4.rotation(Math.PI/2, 1, 0, 0)).times(Mat4.translation(0, 1, 0));
        defs.Square.insert_transformed_copy_into(this, [], back_square_transform)
        
        let scale = Math.sqrt(5)/2.0;
        const side_square_transform_1 = Mat4.translation(1, -1, 0)
            .times(Mat4.rotation(0.46364761, 0, 0, 1)).times(Mat4.scale(scale, scale, 1))
            .times(Mat4.translation(0, 1, 1)).times(Mat4.rotation(Math.PI/2, 0, 1, 0));
        defs.Square.insert_transformed_copy_into(this, [], side_square_transform_1);
        const side_square_transform_2 = Mat4.translation(-1, -1, 0)
            .times(Mat4.rotation(-0.46364761, 0, 0, 1)).times(Mat4.scale(scale, scale, 1))
            .times(Mat4.translation(0, 1, 1)).times(Mat4.rotation(Math.PI/2, 0, 1, 0));
        defs.Square.insert_transformed_copy_into(this, [], side_square_transform_2);
    }
}
