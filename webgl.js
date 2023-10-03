"use strict"

/**
* Generates the color-interpolated image from the image element on the canvas element
* @param {HTMLImageElement} image_element The image element that acts as a source
* @param {HTMLCanvasElement} canvas The canvas element which needs to be painted
* @param {Array} SOURCE_COLORS An array where every element is of the format: [left_color, right_color] with channels 0-255
*/

function webglPaint(image_element, canvas, SOURCE_COLORS, INTERPOLATIONS) {
	const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true })

	if(INTERPOLATIONS == undefined) INTERPOLATIONS = 0

	// Flatten SOURCE_COLORS
	SOURCE_COLORS = SOURCE_COLORS.flat(999)
	// Normalize SOURCE_COLORS
	SOURCE_COLORS = SOURCE_COLORS.map(value => value / 255)
	const PALLETE_COUNT = SOURCE_COLORS.length / 6
	
	canvas.width = image_element.naturalWidth
	canvas.height = image_element.naturalHeight
	
	gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
	gl.clearColor(1.0, 0.0, 0.0, 1.0)
	gl.clear(gl.COLOR_BUFFER_BIT)
	
	const vertShaderSource = `
	attribute vec2 position;
	
	varying vec2 texCoords;
	
	void main() {
		texCoords = (position + 1.0) / 2.0;
		texCoords.y = 1.0 - texCoords.y;
		gl_Position = vec4(position, 0, 1.0);
	}
	`
	
	const fragShaderSource = `
	precision highp float;
	
	varying vec2 texCoords;

	uniform float interpolationCount;
	
	uniform sampler2D textureSampler;
	
	uniform vec3 source_colors[${PALLETE_COUNT * 2}];

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
		for(int i = 0; i < ${PALLETE_COUNT}; ++i) {
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
		int N = ${PALLETE_COUNT};
		
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
	`
	
	const vertShader = gl.createShader(gl.VERTEX_SHADER)
	const fragShader = gl.createShader(gl.FRAGMENT_SHADER)
	
	gl.shaderSource(vertShader, vertShaderSource)
	gl.shaderSource(fragShader, fragShaderSource)
	
	gl.compileShader(vertShader)
	gl.compileShader(fragShader)
	
	const program = gl.createProgram()
	gl.attachShader(program, vertShader)
	gl.attachShader(program, fragShader)
	
	gl.linkProgram(program)
	
	gl.useProgram(program)
	
	const vertices = new Float32Array([
		-1, -1,
		-1, 1,
		1, 1,
		
		-1, -1,
		1, 1,
		1, -1,
	]);
	
	const vertexBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
	
	const positionLocation = gl.getAttribLocation(program, 'position')
	
	gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(positionLocation)

	const texture = gl.createTexture()
	gl.activeTexture(gl.TEXTURE0)
	gl.bindTexture(gl.TEXTURE_2D, texture)
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image_element)
	
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
	
	let uSourceColors = gl.getUniformLocation(program, "source_colors")
	gl.uniform3fv(uSourceColors, SOURCE_COLORS)
	let uInterpolationCount = gl.getUniformLocation(program, "interpolationCount")
	gl.uniform1f(uInterpolationCount, INTERPOLATIONS * 1.0)
	// let uPalleteCount = gl.getUniformLocation(program, "interpolationCount")
	// gl.uniform1f(uPalleteCount, INTERPOLATIONS * 1.0)
	
	gl.drawArrays(gl.TRIANGLES, 0, 6)

	// Makes the function synchronous - REMOVE AFTER PERFORMANCE TESTING
	gl.finish();
}