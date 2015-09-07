"use strict";
var gl;
var points;
var vertices;
var tesselation;
var twistAngle = 0.0;
var twistLoc;
var degToRad =Math.PI/180.0;

window.onload = function init() {
		var canvas = document.getElementById("gl-canvas");

		gl = WebGLUtils.setupWebGL(canvas);
		if (!gl) {
				alert("WebGL isn't available");
		}

		//various starting triangles
		var circleRay = 0.8; //sqrt(3)/3
		var stepAngle = 2*Math.PI/3;
		var angleA = Math.PI*.5;
		var angleB = angleA + stepAngle;
		var angleC = angleB + stepAngle;
		vertices = [
			vec2(Math.cos(angleA)*circleRay, Math.sin(angleA)*circleRay), 
			vec2(Math.cos(angleB)*circleRay, Math.sin(angleB)*circleRay), 
			vec2(Math.cos(angleC)*circleRay, Math.sin(angleC)*circleRay)
		];
		
		twistAngle = 180*degToRad;
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
		// 8 bits per vertices
		// 3 triangles tesselated in 4 triangles with 7 iterations of the recursion process
		gl.bufferData(gl.ARRAY_BUFFER, 8*3*Math.pow(4, 7), gl.STATIC_DRAW); 
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));

		// Associate out shader variables with our data buffer

		var vPosition = gl.getAttribLocation(program, "vPosition");
		gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(vPosition);

		//define twist variable for vShader and fShader
		twistLoc = gl.getUniformLocation(program, "twist");

		//Events listeners
		document.getElementById("twistSlider").onclick = function(event) {
				var target = event.target || event.srcElement;
				twistAngle = parseFloat(target.value) * degToRad;
				render();
		};

		document.getElementById("tesselationSlider").onchange = function(event) {
				var target = event.target || event.srcElement;
				tesselation = parseFloat(target.value); //read tesselation value
				defineStartingTriangles(); //redefine vertices
				gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points)); //update array buffer
				render();
		};			

		render();
};

function render() {
		// pass variable to shader
		gl.uniform1f(twistLoc, twistAngle);
	
		// erase and redraw
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLES, 0, points.length);
}

function defineStartingTriangles() {
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
}