"use strict";
var gl;

var _points;
var _vBuffer;
var _colors;
var _cBuffer;

var _mouseDown = false;

var _index;
var _strokes = [];
var _maxLength;
var _ctrl = false;

var _angleY = 0.0;
var _angleLoc;
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

		_index = -1;
		_maxLength = 1000;
		_points = [];
		_colors = [];

		_drawingColor = vec3(1.0, 0.0, 0.0);

		setCanvasSize(canvas);
		_lineWidth = 1.0 * _winToClip.x;

		gl.clearColor(.0, .0, .0, 1.0);
	// enable hidden-surface removal
    gl.enable(gl.DEPTH_TEST);

		//  Load shaders and initialize attribute buffers

		var program = initShaders(gl, "vertex-shader", "fragment-shader");
		gl.useProgram(program);

		_cBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, _cBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, 12 * _maxLength, gl.STATIC_DRAW);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(_colors));

		// Associate out shader variables with our data buffer
		var vColor = gl.getAttribLocation(program, "vColor");
		gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(vColor);

		// Load the data into the GPU
		_vBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, _vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, 12 * _maxLength, gl.STATIC_DRAW);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(_points));

		// Associate out shader variables with our data buffer
		var vPosition = gl.getAttribLocation(program, "vPosition");
		gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(vPosition);

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

		_angleLoc = gl.getUniformLocation(program, "angleY");
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
		canvas.width = window.innerWidth-300;
		canvas.height = window.innerHeight*.97;
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
		_strokes.push([]);
		_index++;

		draw();
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
		_mouseDown = false;
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
		var length = _strokes[_index].length * 2;
		_colors.splice(_colors.length - length, length);
		_points.splice(_points.length - length, length);
		_strokes[_index] = [];
		_index = _index > 0 ? _index - 1 : _index;
		render();
}

function rotationHandler() {
		_rotation = !_rotation;
		rotation();
}

function rotation() {
		_angleY = (_angleY + 0.01) % 6.28;
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
						var orthVec = vec2(startPoint[1] - endPoint[1], endPoint[0] - startPoint[0]);
						orthVec = normalize(orthVec);
						orthVec[0] *= _lineWidth; //scale by line width
						orthVec[1] *= _lineWidth;
		
						var cosR = Math.cos(6.28-_angleY);
						var sinR = Math.sin(6.28-_angleY);
						var tempPoint;
						
						if (strokeLength == 2) { //init triangle strip
								tempPoint = vec2(startPoint[0] + orthVec[0], startPoint[1] + orthVec[1]);
								_points.push(vec3(tempPoint[0]*cosR,tempPoint[1], -tempPoint[0]*sinR));
								tempPoint = vec2(startPoint[0] - orthVec[0], startPoint[1] - orthVec[1]);
								_points.push(vec3(tempPoint[0]*cosR,tempPoint[1], -tempPoint[0]*sinR));
								_colors.push(_drawingColor, _drawingColor);
						}
						tempPoint = vec2(endPoint[0] + orthVec[0], endPoint[1] + orthVec[1]);
						_points.push(vec3(tempPoint[0]*cosR,tempPoint[1], -tempPoint[0]*sinR));
						tempPoint = vec2(endPoint[0] - orthVec[0], endPoint[1] - orthVec[1]);
						_points.push(vec3(tempPoint[0]*cosR,tempPoint[1], -tempPoint[0]*sinR));
						_colors.push(_drawingColor, _drawingColor);

						if (_maxLength > _points.length) {
								gl.bindBuffer(gl.ARRAY_BUFFER, _cBuffer);
								gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(_colors));
								gl.bindBuffer(gl.ARRAY_BUFFER, _vBuffer);
								gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(_points));
						} else {
								_maxLength = _points.length + 1000;
								gl.bindBuffer(gl.ARRAY_BUFFER, _cBuffer);
								gl.bufferData(gl.ARRAY_BUFFER, 12 * _maxLength, gl.STATIC_DRAW);
								gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(_colors));
								gl.bindBuffer(gl.ARRAY_BUFFER, _vBuffer);
								gl.bufferData(gl.ARRAY_BUFFER, 12 * _maxLength, gl.STATIC_DRAW);
								gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(_points));
						}
				}
		}
		render();
}

function render() {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.uniform1f(_angleLoc, _angleY);
		var drawStart = 0;
		for (var i = 0; i < _strokes.length; ++i) {
				gl.drawArrays(gl.TRIANGLE_STRIP, drawStart, _strokes[i].length * 2);
				drawStart += _strokes[i].length * 2;
		}
}