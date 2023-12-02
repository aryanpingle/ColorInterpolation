"use strict"

let shaderHasBeenInitialized = false;
let vertShader = null;
let fragShader = null;
let vertShaderSource = null;
let fragShaderSource = null;
let program = null;

/**
* Generates the color-interpolated image from the image element on the canvas element
* @param {HTMLImageElement} image_element The image element that acts as a source
* @param {HTMLCanvasElement} canvas The canvas element which needs to be painted
* @param {Array} SOURCE_COLORS An array where every element is of the format: [left_color, right_color] with channels 0-255
*/

async function loadShaderSources() {
	const promiseVertexShaderLoaded = fetch("vertex-shader.glsl").then(d => d.text());
	const promiseFragShaderLoaded = fetch("fragment-shader.glsl").then(d => d.text());

	vertShaderSource = await promiseVertexShaderLoaded;
	fragShaderSource = await promiseFragShaderLoaded;
}

const promiseShadersLoaded = loadShaderSources();

async function webglPaint(image_element, canvas, SOURCE_COLORS, INTERPOLATIONS) {
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

	if(!shaderHasBeenInitialized) {
		await promiseShadersLoaded;

		console.log("%cRecompiling shaders...", "background-color: coral; color: black; font-weight: 900;");

		// Create vertex shader
		vertShader = gl.createShader(gl.VERTEX_SHADER)
		gl.shaderSource(vertShader, vertShaderSource)

		// Create fragment shader
		fragShader = gl.createShader(gl.FRAGMENT_SHADER)
		gl.shaderSource(fragShader, fragShaderSource)
		
		// Compile both
		gl.compileShader(vertShader)
		gl.compileShader(fragShader)
		
		// Create the program and attach shaders to 'em
		program = gl.createProgram()
		gl.attachShader(program, vertShader)
		gl.attachShader(program, fragShader)
		
		// Link that bad boy
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

		shaderHasBeenInitialized = true;
	}
	
	// Set uniforms 
	let uSourceColors = gl.getUniformLocation(program, "source_colors")
	gl.uniform3fv(uSourceColors, SOURCE_COLORS)
	let uInterpolationCount = gl.getUniformLocation(program, "interpolationCount")
	gl.uniform1f(uInterpolationCount, INTERPOLATIONS * 1.0)
	let uPalleteCount = gl.getUniformLocation(program, "palleteCount")
	gl.uniform1i(uPalleteCount, PALLETE_COUNT)

	gl.drawArrays(gl.TRIANGLES, 0, 6)

	// Makes the function synchronous - REMOVE AFTER PERFORMANCE TESTING
	gl.finish();
}