"use strict";
var gl;

var _points;
var _vBuffer;
var _colors;
var _cBuffer;
var _indexes;
var _iBuffer;

var _uModelMatrix;
var _uModelMatrixLoc;
var _uViewMatrix;
var _uViewMatrixLoc;
var _uProjectionMatrix;
var _uProjectionMatrixLoc;

var _angleY = 0.0;

var _drawingColor;

var _canvasRect;

window.onload = function init() {
		var canvas = document.getElementById("gl-canvas");

		gl = WebGLUtils.setupWebGL(canvas);
		if (!gl) {
				alert("WebGL isn't available");
		}

		_points = [];
		_colors = [];
		_indexes = [];

		_drawingColor = vec3(1.0, 0.0, 0.0);

		createCube();

		gl.clearColor(.0, .0, .0, 1.0);
		//not drawing back faces
		gl.enable(gl.CULL_FACE);
		// enable hidden-surface removal
		gl.enable(gl.DEPTH_TEST);

		//  Load shaders and initialize attribute buffers

		var program = initShaders(gl, "vertex-shader", "fragment-shader");
		gl.useProgram(program);

		// Load the data into the GPU
		//Color
		_cBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, _cBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(_colors), gl.STATIC_DRAW);

		// Associate out shader variables with our data buffer
		var aColor = gl.getAttribLocation(program, "aColor");
		gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(aColor);

		//Vertex
		_vBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, _vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(_points), gl.STATIC_DRAW);

		// Associate out shader variables with our data buffer
		var aPosition = gl.getAttribLocation(program, "aPosition");
		gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(aPosition);

		//index
		_iBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, _iBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(_indexes), gl.STATIC_DRAW);

		_uModelMatrixLoc = gl.getUniformLocation(program, "uModelMatrix");
		_uViewMatrixLoc = gl.getUniformLocation(program, "uViewMatrix");
		_uProjectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");
	
		_uViewMatrix = lookAt(vec3(0.0,-1.,1.5),vec3(0.0,0.0,0.0),vec3(0.0,1.0,0.0));
		gl.uniformMatrix4fv(_uViewMatrixLoc, false, flatten(_uViewMatrix));
		
		_uProjectionMatrix = perspective(75,canvas.width/canvas.height,.1,100.0);
		gl.uniformMatrix4fv(_uProjectionMatrixLoc, false, flatten(_uProjectionMatrix));
	
		rotation();
};

// function that create an object (vertices, colors, normals, indexes) and multiply by a matrix that change its position, size, orientation.
// keep in memory buffer indexes to rewrite it position when moved.
//find a way to create JS object for better optimisation

var Cube = function() {
		this.startingVertex=0;
		this.startingColor=0;
		this.startingIndex=0
		
		this.faceNum = 6;
		this.vertNum = 24;
		this.indexNum = 36;

		this.vertices = [vec3(-.5, -.5, -.5), vec3(-.5, .5, -.5), vec3(-.5, .5, .5), vec3(-.5, -.5, .5),
				vec3(.5, .5, -.5), vec3(-.5, .5, -.5), vec3(.5, -.5, -.5),  vec3(-.5, -.5, -.5),
				vec3(.5, .5, .5), vec3(.5, .5, -.5), vec3(.5, -.5, .5), vec3(.5, -.5, -.5),
				vec3(-.5, -.5, .5), vec3(-.5, .5, .5), vec3(.5, -.5, .5), vec3(.5, .5, .5),
				vec3(-.5, -.5, -.5), vec3(-.5, -.5, .5), vec3(.5, -.5, -.5), vec3(.5, -.5, .5),
				vec3(.5, .5, .5), vec3(-.5, .5, .5), vec3(.5, .5, -.5), vec3(-.5, .5, -.5),
										 
				vec3(-.5, -.5, -.5), vec3(-.5, .5, -.5), vec3(-.5, .5, .5), vec3(-.5, -.5, .5),
				vec3(.5, -.5, -.5), vec3(.5, .5, -.5), vec3(.5, .5, .5), vec3(.5, -.5, .5)										 
		];

		this.indexes = [0, 3, 2, 0, 2, 1,
				4, 6, 5, 5, 6, 7,
				8, 10, 9, 9, 10, 11,
				12, 14, 13, 13, 14, 15,
				16, 18, 17, 17, 18, 19,
				20, 22, 21, 21, 22, 23,
				
				24,25,24,26,24,27,24,28,24,29,24,31,
				25,26,25,29,25,30,
				26,27,26,30,26,31,
				27,31,
				28,29,28,30,28,31,
				29,30,
				30,31
		];

		this.colors = [	vec3(1.0, 0.0, 0.0),vec3(1.0, 0.0, 0.0),vec3(1.0, 0.0, 0.0),vec3(1.0, 0.0, 0.0),
									 	vec3(0.0, 1.0, 0.0),vec3(0.0, 1.0, 0.0),vec3(0.0, 1.0, 0.0),vec3(0.0, 1.0, 0.0),
									 	vec3(0.0, 0.0, 1.0),vec3(0.0, 0.0, 1.0),vec3(0.0, 0.0, 1.0),vec3(0.0, 0.0, 1.0),									 
										vec3(1.0, 1.0, 0.0),vec3(1.0, 1.0, 0.0),vec3(1.0, 1.0, 0.0),vec3(1.0, 1.0, 0.0),
									 	vec3(0.0, 1.0, 1.0),vec3(0.0, 1.0, 1.0),vec3(0.0, 1.0, 1.0),vec3(0.0, 1.0, 1.0),
									 	vec3(0.6, 0.0, 0.6),vec3(0.6, 0.0, 0.6),vec3(0.6, 0.0, 0.6),vec3(0.6, 0.0, 0.6),
									 
									 vec3(0.1, 0.1, 0.1),vec3(0.1, 0.1, 0.1),vec3(0.1, 0.1, 0.1),vec3(0.1, 0.1, 0.1),
									 vec3(0.1, 0.1, 0.1),vec3(0.1, 0.1, 0.1),vec3(0.1, 0.1, 0.1),vec3(0.1, 0.1, 0.1)
		];
}

function createCube() {
		var cubeTest = new Cube();
		_points = cubeTest.vertices;
		_indexes = cubeTest.indexes;
		_colors= cubeTest.colors;
}

function rotation() {
		_angleY = (_angleY + 0.01) % 6.28;
		
		//ModelMatrix =	scaleMatrix(1,1,1);
		
		_uModelMatrix =	mult(rotateRad(_angleY,1,0,0),scaleMatrix(.5,.5,.5));		
		_uModelMatrix =	mult(rotateRad(_angleY,0,1,0),_uModelMatrix);
		_uModelMatrix = mult(translate(0,0,0), _uModelMatrix);
		
		render();
		requestAnimationFrame(rotation);
}

function render() {		
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.uniformMatrix4fv(_uModelMatrixLoc, false, flatten(_uModelMatrix));
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, _iBuffer);
		gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
		gl.drawElements(gl.LINES, _indexes.length-36, gl.UNSIGNED_SHORT, 72);
}