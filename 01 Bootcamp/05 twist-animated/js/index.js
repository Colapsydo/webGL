"use strict";
var gl;
var points;
var starting;
var startingIndex
var tesselation;
var animAngle = 0;
var twistAngle = 0.0;
var twistLoc;
var colorLoc;

window.onload = function init() {
		var canvas = document.getElementById("gl-canvas");

		gl = WebGLUtils.setupWebGL(canvas);
		if (!gl) {
				alert("WebGL isn't available");
		}

		//various starting triangles
		starting = [
				[vec2(-.6, -.6), vec2(-.6, .6), vec2(.6, -.6)],
				[vec2(-.6, .6), vec2(0, 0), vec2(.6, .6)],
				[vec2(-.6, .6), vec2(0, -.02), vec2(.6, .6)],
				[vec2(-.6, .4), vec2(.2, -.2), vec2(-.4, -.6)],
				[vec2(-.05, .6), vec2(-.05, -.6), vec2(-.6, -.2)],
				[vec2(-.05, .6), vec2(-.05, -.6), vec2(-1.0, .0)]
		];

		startingIndex = 2; // index of triangle to apply tesselation on
		tesselation = 7; // number of recursion applied to tesselate the starting triangle

		defineStartingTriangles();

		//  Configure WebGL

		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.clearColor(0.0, 0.0, 0.0, 1.0);

		//  Load shaders and initialize attribute buffers

		var program = initShaders(gl, "vertex-shader", "fragment-shader");
		gl.useProgram(program);

		// Load the data into the GPU

		var bufferId = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);		
		// creation of ARRAY_BUFFER of max size
		// 2 times comming from symmetry
		// 8 bits per vertices
		// 3 triangles tesselated in 4 triangles with 7 iterations of the recursion process
		gl.bufferData(gl.ARRAY_BUFFER, 2*8*3*Math.pow(4, 7), gl.STATIC_DRAW); 
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));

		// Associate out shader variables with our data buffer

		var vPosition = gl.getAttribLocation(program, "vPosition");
		gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(vPosition);

		//define twist variable for vShader and fShader
		twistLoc = gl.getUniformLocation(program, "twist");
		colorLoc = gl.getUniformLocation(program, "angleColor");

		//Events listeners
		document.getElementById("startingVertices").onclick = function() {
				startingIndex = (startingIndex + 1) % starting.length;
				defineStartingTriangles(); //redefine vertices with new starting triangle
				gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points)); //update array buffer
		};

		document.getElementById("tesselationSlider").onchange = function(event) {
				var target = event.target || event.srcElement;
				tesselation = parseFloat(target.value); //read tesselation value
				defineStartingTriangles(); //redefine vertices
				gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points)); //update array buffer
		};			

		render();
};

function render() {
		// update twist angle with a cosine easing
		animAngle = (animAngle + 0.005) % 6.28;
		twistAngle += Math.cos(animAngle) * 0.069812;

		// pass variables to both shaders
		gl.uniform1f(twistLoc, twistAngle);
		gl.uniform1f(colorLoc, animAngle * .3185);
		// erase and redraw
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLES, 0, points.length);

		requestAnimationFrame(render);
}

function defineStartingTriangles() {
		var vertices = starting[startingIndex];
		points = [];
		divideTriangle(vertices[0], vertices[1], vertices[2], tesselation);
}

function divideTriangle(a, b, c, iteration) {
		if (iteration === 0) {
				drawTriangle(a, b, c);
		} else {
				iteration--;
				var ab = mix(a, b, .5);
				var bc = mix(b, c, .5);
				var ac = mix(a, c, .5);

				//recursively divide new triangles
				divideTriangle(a, ab, ac, iteration);
				divideTriangle(b, ab, bc, iteration);
				divideTriangle(ab, bc, ac, iteration);
				divideTriangle(c, bc, ac, iteration);
		}
}

function drawTriangle(a, b, c) {
		points.push(a, b, c);
		// Add a central symmetric point in order to get more complex forms
		// Not allowing to tesselate and twist every geometry, just a trick
		points.push(vec2(-a[0], -a[1]), vec2(-b[0], -b[1]), vec2(-c[0], -c[1]));
}