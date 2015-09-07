"use strict";
var gl;

var _points;
var _vBuffer;
var _colors;
var _cBuffer;
var _normals;
var _nBuffer;
var _indexes;
var _indexBuffer;

var _vMatrix;
var _locUvMatrix;
var _nMatrix;
var _locUnMatrix;

var _mouseDown = false;

var _index;
var _indexesNum;
var _strokes;
var _maxLength;
var _ctrl = false;

var _angleY = 0.0;
var _worldMatrix;
var _rotation = false;

var _drawingColor;
var _lineWidth;

var _mousePos = {
		x: 0,
		y: 0
};
var _winToClip = {
		x: 0,
		y: 0
};
var _canvasRect;

window.onload = function init() {
		//color picker
		var palette = document.getElementById("pal-canvas");
		var palCtx = palette.getContext("2d");
		var colorPal;
		for (var i = 0; i < palette.width; ++i) {
				for (var j = 0; j < palette.height; ++j) {
						colorPal = getColor(i, j, palette.width, palette.height);
						palCtx.fillStyle = "rgb(" + parseInt(colorPal[0] * 255) + "," + parseInt(colorPal[1] * 255) + "," + parseInt(colorPal[2] * 255) + ")";
						palCtx.fillRect(i, j, 1, 1);
				}
		}
		palette.addEventListener('click', colorChoose, false)

		var canvas = document.getElementById("gl-canvas");

		gl = WebGLUtils.setupWebGL(canvas);
		if (!gl) {
				alert("WebGL isn't available");
		}

		_index = 0;
		_maxLength = 1000;
		_points = [];
		_colors = [];
		_normals = [];
		_indexes = [];
		_indexesNum = _index.length;
		_strokes = [];
		_strokes.push([]);

		_drawingColor = vec3(1.0, 0.0, 0.0);

		setCanvasSize(canvas);
		_lineWidth = 1.0 * _winToClip.x;

		gl.clearColor(.0, .0, .0, 1.0);
		// enable hidden-surface removal
		gl.enable(gl.DEPTH_TEST);

		//  Load shaders and initialize attribute buffers

		var program = initShaders(gl, "vertex-shader", "fragment-shader");
		gl.useProgram(program);

		// Load the data into the GPU
		//Color
		_cBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, _cBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, 12 * _maxLength, gl.STATIC_DRAW);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(_colors));

		// Associate out shader variables with our data buffer
		var aColor = gl.getAttribLocation(program, "aColor");
		gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(aColor);

		//Normal
		_nBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, _nBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, 12 * _maxLength, gl.STATIC_DRAW);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(_normals));

		// Associate out shader variables with our data buffer
		var aNormal = gl.getAttribLocation(program, "aNormal");
		gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(aNormal);

		//index
		_indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, _indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, 12 * _maxLength, gl.STATIC_DRAW);

		//Vertex
		_vBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, _vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, 12 * _maxLength, gl.STATIC_DRAW);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(_points));

		// Associate out shader variables with our data buffer
		var aPosition = gl.getAttribLocation(program, "aPosition");
		gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(aPosition);

		//EVENTS LISTENERS

		canvas.addEventListener("touchstart", downHandler, false);
		canvas.addEventListener("touchmove", touchMoveHandler, false);
		window.addEventListener("touchend", upHandler, false);

		canvas.addEventListener("mousedown", downHandler, false);
		canvas.addEventListener("mousemove", moveHandler, false);
		window.addEventListener("mouseup", upHandler, false);

		window.onresize = function(event) {
				setCanvasSize(document.getElementById("gl-canvas"));
		}

		window.addEventListener("keydown", keyDownHandler, false);
		window.addEventListener("keyup", keyUpHandler, false);

		document.getElementById("strokeWidth").addEventListener("change", widthChangeHandler, false);
		document.getElementById("undo").addEventListener("click", undo, false);
		document.getElementById("rotation").addEventListener("click", rotationHandler, false);

		_locUvMatrix = gl.getUniformLocation(program, "uVertexMatrix");
		gl.uniform3f(gl.getUniformLocation(program, "uLight"), -1.0, 1.0, -1.0);
		rotation();
};

function getColor(posX, posY, canWidth, canHeight) {
		var colorStep = 1 / canWidth;
		var intensityStep = 2.0 / canHeight;
		var twoPi = 6.28;
		var red = 0.5 * Math.cos(twoPi * (colorStep * posX));
		var green = 0.5 * Math.cos(twoPi * (colorStep * posX + .33));
		var blue = 0.5 * Math.cos(twoPi * (colorStep * posX + .67));
		var intens = 1.5 - posY * intensityStep;
		return (vec3(red + intens, green + intens, blue + intens));
}

function colorChoose(event) {
		var canvasRect = event.target.getBoundingClientRect();
		_drawingColor = getColor(parseInt(event.clientX - canvasRect.left), parseInt(event.clientY - canvasRect.top), canvasRect.width, canvasRect.height);
}

function setCanvasSize(canvas) {
		canvas.width = window.innerWidth - 300;
		canvas.height = window.innerHeight * .97;
		_canvasRect = canvas.getBoundingClientRect();
		_winToClip.x = 2 / canvas.width;
		_winToClip.y = 2 / canvas.height;
		gl.viewport(0, 0, canvas.width, canvas.height);
}

function widthChangeHandler(event) {
		_lineWidth = parseInt(event.target.value) * _winToClip.x;
}

function downHandler(event) {
		event.preventDefault();
		setCanvasSize(document.getElementById("gl-canvas"));
		_mouseDown = true;

		var touches = event.changedTouches;
		if (touches == undefined) {
				_mousePos.x = event.clientX - _canvasRect.left;
				_mousePos.y = event.clientY - _canvasRect.top;
		} else {
				_mousePos.x = touches[touches.length - 1].pageX - _canvasRect.left;
				_mousePos.y = touches[touches.length - 1].pageY - _canvasRect.top;
		}

		while (_strokes[_index].length > 0) {
				_index++;
				if (_index == _strokes.length) {
						_strokes.push([]);
				}
		}
}

function touchMoveHandler(event) {
		event.preventDefault();
		var touches = event.changedTouches;
		_mousePos.x = touches[touches.length - 1].pageX - _canvasRect.left;
		_mousePos.y = touches[touches.length - 1].pageY - _canvasRect.top;
		draw();
}

function moveHandler(event) {
		event.preventDefault();
		_mousePos.x = event.clientX - _canvasRect.left;
		_mousePos.y = event.clientY - _canvasRect.top;
		draw();
}

function upHandler(event) {
		if (_mouseDown == true) {
				_mouseDown = false;
				if (_strokes[_index].length > 1) {
						
						var tempPoint;
						//End face
						var index = _points.length;
						var strokeLength = _strokes[_index].length;
						var startPoint = _strokes[_index][strokeLength - 2]; //prev point
						var endPoint = _strokes[_index][strokeLength - 1]; //actual point
						var line = vec2(endPoint[0] - startPoint[0], endPoint[1] - startPoint[1]);
						addFace(_points[index - 6], _points[index - 5], _points[index - 1], _points[index - 3], normalize(product(_worldMatrix, vec3(line[0], line[1], 0.0))));
					
						updateBuffers();
				} else {
						_strokes[_index] = [];
				}
		}
}

function keyDownHandler(event) {
		if (event.keyCode == 17) {
				_ctrl = true;
		}
		if (_ctrl == true && event.keyCode == 90) {
				event.preventDefault();
				undo();
		}
}

function keyUpHandler(event) {
		if (event.keyCode == 17) {
				_ctrl = false;
		}
}

function undo() {
		if (_mouseDown == false) {
				var length = Math.floor((_strokes[_index].length-.5) * 16);
				_colors.splice(_colors.length - length, length);
				_normals.splice(_normals.length - length, length);
				_points.splice(_points.length - length, length);
			
				length = Math.floor(length*1.5);
				_indexes.splice(_indexes.length-length,length);
				_strokes[_index] = [];
				_index = _index > 0 ? _index - 1 : _index;
				render();
		}
}

function rotationHandler() {
		_rotation = !_rotation;
		rotation();
}

function rotation() {
		_angleY = (_angleY + 0.01) % 6.28;
		var c = Math.cos(_angleY);
		var s = Math.sin(_angleY);
		_vMatrix = mat3(vec3(c, 0.0, s), vec3(0.0, 1.0, 0.0), vec3(-s, 0.0, c));
		render();
		if (_rotation === true) {
				requestAnimationFrame(rotation);
		}
}

function draw() {
		if (_mouseDown == true) {
				var newPoint = vec2(-1 + _winToClip.x * _mousePos.x, 1 - _winToClip.y * _mousePos.y); //new point in clip coordinate
				_strokes[_index].push(newPoint); // add to curent stroke
				var strokeLength = _strokes[_index].length;
				if (strokeLength > 1) { //first point Init

						var startPoint = _strokes[_index][strokeLength - 2]; //prev point
						var endPoint = _strokes[_index][strokeLength - 1]; //actual point
						//line
						var line = vec2(endPoint[0] - startPoint[0], endPoint[1] - startPoint[1]);
						// orthVec in 2D
						var orthVec = vec2(startPoint[1] - endPoint[1], endPoint[0] - startPoint[0]);
						orthVec = normalize(orthVec);
						orthVec[0] *= _lineWidth; //scale by line width
						orthVec[1] *= _lineWidth;

						var cosR = Math.cos(6.28 - _angleY); //clip to world operation
						var sinR = Math.sin(6.28 - _angleY);
						_worldMatrix = mat3(vec3(cosR, 0.0, sinR), vec3(0.0, 1.0, 0.0), vec3(-sinR, 0.0, cosR));

						/*	Creation of 8 vertices for Triangle Strip 1234567813
				     4 *-----* 6
					    /|    / |
					   / *3  /  |
					2	*-----* 5 * 8
						|     |  /
						|     | /
					1	*-----* 7
				*/
						var tempPoint;
						var tempVertices = [];
						if (strokeLength == 2) { //init triangle strip
								//1
								tempPoint = vec3(startPoint[0] - orthVec[0], startPoint[1] - orthVec[1], -_lineWidth);
								tempVertices[0] = product(_worldMatrix, tempPoint);
								//2
								tempPoint = vec3(startPoint[0] + orthVec[0], startPoint[1] + orthVec[1], -_lineWidth);
								tempVertices[1] = product(_worldMatrix, tempPoint);
								//5
								tempPoint = vec3(startPoint[0] + orthVec[0], startPoint[1] + orthVec[1], +_lineWidth);
								tempVertices[4] = product(_worldMatrix, tempPoint);
								//7
								tempPoint = vec3(startPoint[0] - orthVec[0], startPoint[1] - orthVec[1], +_lineWidth);
								tempVertices[6] = product(_worldMatrix, tempPoint);
						} else {
								var index = _points.length;
								//1
								tempPoint = _points[index - 6];
								tempVertices[0] = vec3(tempPoint[0], tempPoint[1], tempPoint[2]);
								//2
								tempPoint = _points[index - 5];
								tempVertices[1] = vec3(tempPoint[0], tempPoint[1], tempPoint[2]);
								//5
								tempPoint = _points[index - 3];
								tempVertices[4] = vec3(tempPoint[0], tempPoint[1], tempPoint[2]);
								//7
								tempPoint = _points[index - 1];
								tempVertices[6] = vec3(tempPoint[0], tempPoint[1], tempPoint[2]);
						}
						//3
						tempPoint = vec3(endPoint[0] - orthVec[0], endPoint[1] - orthVec[1], -_lineWidth);
						tempVertices[2] = product(_worldMatrix, tempPoint);
						//4
						tempPoint = vec3(endPoint[0] + orthVec[0], endPoint[1] + orthVec[1], -_lineWidth);
						tempVertices[3] = product(_worldMatrix, tempPoint);
						//6
						tempPoint = vec3(endPoint[0] + orthVec[0], endPoint[1] + orthVec[1], +_lineWidth);
						tempVertices[5] = product(_worldMatrix, tempPoint);
						//8
						tempPoint = vec3(endPoint[0] - orthVec[0], endPoint[1] - orthVec[1], +_lineWidth);
						tempVertices[7] = product(_worldMatrix, tempPoint);
						if (strokeLength == 2) {
								// opening face
								addFace(tempVertices[0], tempVertices[1], tempVertices[6], tempVertices[4], normalize(product(_worldMatrix, vec3(-line[0], -line[1], 0.0))));
						}
						//Bottom face
						addFace(tempVertices[0], tempVertices[2], tempVertices[6], tempVertices[7], normalize(product(_worldMatrix, vec3(-orthVec[0], -orthVec[1], 0.0))));
						//Top face
						addFace(tempVertices[1], tempVertices[3], tempVertices[4], tempVertices[5], normalize(product(_worldMatrix, vec3(orthVec[0], orthVec[1], 0.0))));
						//Back face
						addFace(tempVertices[0], tempVertices[1], tempVertices[2], tempVertices[3], normalize(product(_worldMatrix, vec3(0.0, 0.0, -1.0))));
						//Front face
						addFace(tempVertices[4], tempVertices[5], tempVertices[6], tempVertices[7], normalize(product(_worldMatrix, vec3(0.0, 0.0, 1.0))));
						

						updateBuffers();
				}
				render();
		}
}

function addFace(vertex1, vertex2, vertex3, vertex4, normal) {
		var index = _points.length;
		_points.push(vertex1, vertex2, vertex3, vertex4);
		_colors.push(_drawingColor, _drawingColor, _drawingColor, _drawingColor);
		_normals.push(normal, normal, normal, normal);
		_indexes.push(index, index + 1, index + 2, index + 1, index + 2, index + 3);
}

function updateBuffers()  { //Dynamic buffer size and update
		if (_maxLength > _points.length) {
				gl.bindBuffer(gl.ARRAY_BUFFER, _cBuffer);
				gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(_colors));
				gl.bindBuffer(gl.ARRAY_BUFFER, _nBuffer);
				gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(_normals));
				gl.bindBuffer(gl.ARRAY_BUFFER, _vBuffer);
				gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(_points));
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, _indexBuffer);
				gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, new Uint16Array(_indexes));
		} else {
				_maxLength = _points.length + 1000;
				gl.bindBuffer(gl.ARRAY_BUFFER, _cBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, 12 * _maxLength, gl.STATIC_DRAW);
				gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(_colors));
				gl.bindBuffer(gl.ARRAY_BUFFER, _nBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, 12 * _maxLength, gl.STATIC_DRAW);
				gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(_normals));
				gl.bindBuffer(gl.ARRAY_BUFFER, _vBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, 12 * _maxLength, gl.STATIC_DRAW);
				gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(_points));
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, _indexBuffer);
				gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, 12 * _maxLength, gl.STATIC_DRAW);
				gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, new Uint16Array(_indexes));
		}
}

function product(matrix, vector) {
		var result = [];
		result.push(matrix[0][0] * vector[0] + matrix[0][1] * vector[1] + matrix[0][2] * vector[2]);
		result.push(matrix[1][0] * vector[0] + matrix[1][1] * vector[1] + matrix[1][2] * vector[2]);
		result.push(matrix[2][0] * vector[0] + matrix[2][1] * vector[1] + matrix[2][2] * vector[2]);
		return (result);
}

function render() {

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.uniformMatrix3fv(_locUvMatrix, false, flatten(_vMatrix));

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, _indexBuffer);
		gl.drawElements(gl.TRIANGLES, _indexes.length, gl.UNSIGNED_SHORT, 0);
}