precision highp float;

varying vec2 texCoords;

// uniforms
uniform float interpolationCount;
uniform int palleteCount;
uniform sampler2D textureSampler;
uniform vec3 source_colors[200];

float getNumberOfBuckets() {
    return pow(2.0, interpolationCount) + 1.0;
}

vec3 get_color_towards(vec3 from_color, vec3 to_color, float fraction) {
    return from_color + (to_color - from_color) * fraction;
}

float lerp(float val, float lb, float ub, float lv, float uv) {
    return lv + (uv-lv)*(val-lb)/(ub-lb);
}

/*
* 'standard' refers to the actual palette color for the given index and 'x' value
* For example, if the palette wants white at the left and black at the right -> standard at x=0.5 is gray
*/
vec3 get_standard(int index, float x_01) {
    for(int i = 0; i < 65535; ++i) {
        if(i == palleteCount) break;
        if(i == index) {
            return get_color_towards(source_colors[i * 2], source_colors[i * 2 + 1], x_01);
        }
    }
    return vec3(0.0, 0.0, 0.0);
}

/*
* Returns the color associated with the given grayscale and 'x' value from source_colors
*/
vec3 get_interpolated_color(float grayscale, float x_01) {
    int N = palleteCount;
    
    // The grayscale can represent one of N palette colors
    
    // combination_start_index = [0, N-1] : int
    // It represents the index of the palette color
    // The other palette color will be (combination_start_index + 1)
    int combination_start_index = int(lerp(grayscale, 0.0, 1.0, 0.0, float(N) - 1.0));
    
    /**
        * Each color needs to be interpolated to the next by a certain amount
        * This amount is a float 'fr' = [0.0, 1.0]
        * fr is quantized in values based on INTERPOLATION_COUNT
        * 
        * IC=0 : fr=[0, 1] -> 2 buckets
        * IC=1 : fr=[0, 0.5,  1] -> 3 buckets
        * IC=2 : fr=[0, 0.25, 0.5, 0.75, 1] -> 5 buckets
        * IC=3 : fr=[0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1] -> 9 buckets
        * 
        * # buckets = 2^(IC) + 1
    */

    // STEP 1 - Set fr with infinite quantizations
    // ------
    // Set fr to [0.0, 1.0] based on the grayscale
    // grayscale will be between the 2 fractional indices of the palette
    // eg: gs=0.6, indices are 1(~0.5) and 2(~1.0) => fr=0.2
    float unit = 1.0 / (float(N) - 1.0);
    float fr = lerp(grayscale, float(combination_start_index) * unit, (float(combination_start_index) + 1.0) * unit, 0.0, 1.0);

    // STEP 2 - Quantize fr
    // ------
    // Now we need to quantize fr based on INTERPOLATION_COUNT
    // eg: fr=0.33, IC=1 => fr=0.5
    // eg: fr=0.2, IC=2 => fr=0.25
    float numberOfBuckets = getNumberOfBuckets();
    float bucket_index = min(numberOfBuckets, floor(fr * numberOfBuckets));
    float bucket_multiplier = 1.0 / pow(2.0, interpolationCount);
    fr = bucket_multiplier * bucket_index;

    // Set constraints
    fr = min(1.0, fr);
    
    // Get the actual palette colors at the specified 'x' value
    vec3 color_1 = get_standard(combination_start_index, x_01);
    vec3 color_2 = get_standard(combination_start_index + 1, x_01);
    
    return get_color_towards(color_1, color_2, fr);
}

void main() {
    vec4 tex_color = texture2D(textureSampler, texCoords);
    
    float gs = (tex_color.r + tex_color.g + tex_color.b) / 3.0;
    
    // Get the interpolated color's RGB values and give alpha=1.0
    gl_FragColor = vec4(get_interpolated_color(gs, texCoords.x), 1.0);
}
