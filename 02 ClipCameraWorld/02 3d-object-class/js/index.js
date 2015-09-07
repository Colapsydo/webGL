"use strict";

var gl;

var _uModelMatrix;
var _uModelMatrixLoc;
var _uViewMatrix;
var _uViewMatrixLoc;
var _uProjectionMatrix;
var _uProjectionMatrixLoc;

var _aPosition;
var _aColor;

var _camera = {
		r: 1.5,
		theta: -0.75,
		phi: 1.57
};

var _cubeModel = {
		vertexNum: 8,
		vertices: [vec3(-.5, -.5, -.5), vec3(-.5, .5, -.5), vec3(-.5, .5, .5), vec3(-.5, -.5, .5),
				vec3(.5, -.5, -.5), vec3(.5, .5, -.5), vec3(.5, .5, .5), vec3(.5, -.5, .5)
		],
		indexNum: 36,
		indexTriangle: [0, 3, 2, 0, 2, 1, 3, 7, 6, 3, 6, 2, 7, 4, 5, 7, 5, 6, 4, 0, 1, 4, 1, 5, 1, 2, 6, 1, 6, 5, 4, 7, 3, 4, 3, 0],
		indexLine: [0, 1, 0, 2, 0, 3, 0, 4, 0, 5, 0, 7, 1, 2, 1, 5, 1, 6, 2, 3, 2, 6, 2, 7, 3, 7, 4, 5, 4, 6, 4, 7, 5, 6, 6, 7]
};

var _sphereModel = {
		vertexNum: 0,
		vertices: [],
		indexNum: 0,
		indexTriangle: []
};

var _cylindreModel = {
		vertexNum: 0,
		vertices: [],
		indexNum: 0,
		indexTriangle: [],
		indexLine: []
};

var _coneModel = {
		vertexNum: 0,
		vertices: [],
		indexNum: 0,
		indexTriangle: []
};

var _objects = [{
		model: _cubeModel,
		instances: []
}, {
		model: _sphereModel,
		instances: []
}, {
		model: _cylindreModel,
		instances: []
}, {
		model: _coneModel,
		instances: []
}];

var _canvasRect;
var _ctrl = false;
var _mouseDown = false;
var _mousePos = {
		x: 0,
		y: 0
};

window.onload = function init() {
		var canvas = document.getElementById("gl-canvas");

		gl = WebGLUtils.setupWebGL(canvas);
		if (!gl) {
				alert("WebGL isn't available");
		}

		gl.clearColor(.0, .0, .0, 1.0);
		//not drawing back faces
		gl.enable(gl.CULL_FACE);
		// enable hidden-surface removal
		gl.enable(gl.DEPTH_TEST);

		//  Load shaders and initialize attribute buffers
		var program = initShaders(gl, "vertex-shader", "fragment-shader");
		gl.useProgram(program);

		_aPosition = gl.getAttribLocation(program, "aPosition");
		gl.enableVertexAttribArray(_aPosition);
		_aColor = gl.getAttribLocation(program, "aColor");
		gl.enableVertexAttribArray(_aColor);

		//UNIFORMS
		_uModelMatrixLoc = gl.getUniformLocation(program, "uModelMatrix");
		_uViewMatrixLoc = gl.getUniformLocation(program, "uViewMatrix");
		_uProjectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");

		_uViewMatrix = lookAt(vec3(_camera.r * Math.sin(_camera.theta) * Math.cos(_camera.phi),
				_camera.r * Math.sin(_camera.theta) * Math.sin(_camera.phi),
				_camera.r * Math.cos(_camera.theta)), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0));
		gl.uniformMatrix4fv(_uViewMatrixLoc, false, flatten(_uViewMatrix));

		_uProjectionMatrix = perspective(75, canvas.width / canvas.height, .1, 100.0);
		gl.uniformMatrix4fv(_uProjectionMatrixLoc, false, flatten(_uProjectionMatrix));

		//EVENTS LISTENERS
		window.onresize = function(event) {
				setCanvasSize(document.getElementById("gl-canvas"));
		}
		
		canvas.addEventListener("touchstart", downHandler, false);
		canvas.addEventListener("touchmove", touchMoveHandler, false);
		window.addEventListener("touchend", upHandler, false);

		canvas.addEventListener("mousedown", downHandler, false);
		canvas.addEventListener("mousemove", moveHandler, false);
		window.addEventListener("mouseup", upHandler, false);

		window.addEventListener("keydown", keyDownHandler, false);
		window.addEventListener("keyup", keyUpHandler, false);
		
		//initilization
		initModels();
		initModelBuffers();
	
		for(var i=0; i<16;++i){
			createObject(i%4);
		}

		setCanvasSize(canvas);
		render();
};

//EVENTS
function setCanvasSize(canvas) {
		canvas.width = window.innerWidth - 20;
		canvas.height = window.innerHeight - 20;
		_canvasRect = canvas.getBoundingClientRect();
		gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
		_uProjectionMatrix = perspective(75, canvas.clientWidth / canvas.clientHeight, .1, 100.0);
		gl.uniformMatrix4fv(_uProjectionMatrixLoc, false, flatten(_uProjectionMatrix));
		render();
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
}

function touchMoveHandler(event) {
		event.preventDefault();
		var touches = event.changedTouches;
		moveCamera(touches[touches.length - 1].pageX - _canvasRect.left,touches[touches.length - 1].pageY - _canvasRect.top);
}

function moveHandler(event) {
		event.preventDefault();
		
		moveCamera(event.clientX - _canvasRect.left,event.clientY - _canvasRect.top);
}

function moveCamera(newX, newY){
	if(_mouseDown==true){
		var moveX = newX-_mousePos.x;
		var moveY = newY - _mousePos.y;
		if(_ctrl==true){
			_camera.r+=moveY*0.01;
			_camera.r = _camera.r<1.5?1.5:_camera.r;
		}else{
			_camera.phi = (_camera.phi+moveX*0.01)%6.28;
			_camera.theta += moveY*0.01;
			_camera.theta = _camera.theta>1.57 ? 1.57 : _camera.theta;
			_camera.theta = _camera.theta<-1.57 ? -1.57 : _camera.theta;
		}
		updateCamera();
		
		_mousePos.x = newX;
		_mousePos.y = newY;
	}
}

function upHandler(event) {
		if (_mouseDown == true) {
				_mouseDown = false;
		}
}

function keyDownHandler(event) {
		if (event.keyCode == 17) {
				_ctrl = true;
		}
}

function keyUpHandler(event) {
		if (event.keyCode == 17) {
				_ctrl = false;
		}
}

//FUNCTIONS

function initModels() {
		var latMax = 24;
		var longMax = 24;
		var ray = .5;

		_cylindreModel.vertices.push(vec3(0.0, ray, 0.0), vec3(0.0, -ray, 0.0));
		_coneModel.vertices.push(vec3(0.0, ray, 0.0), vec3(0.0, -ray, 0.0));

		for (var latNum = 0; latNum <= latMax; ++latNum) {
				var theta = latNum * Math.PI / latMax;
				var sinTheta = Math.sin(theta);
				var cosTheta = Math.cos(theta);

				for (var longNum = 0; longNum <= longMax; ++longNum) {
						var phi = longNum * 2 * Math.PI / longMax;
						var sinPhi = Math.sin(phi);
						var cosPhi = Math.cos(phi);

						var x = cosPhi * sinTheta;
						var y = cosTheta;
						var z = sinPhi * sinTheta;

						//sphere
						//vertices
						_sphereModel.vertices.push(vec3(x * ray, y * ray, z * ray));

						//indices
						if (latNum < latMax && longNum < longMax) {
								var first = (latNum * (longMax + 1)) + longNum;
								var second = first + longMax + 1;
								_sphereModel.indexTriangle.push(second, first, first + 1, second + 1, second, first + 1);
						}

						if (latNum == 0) {
								//cylindre
								//vertices
								_cylindreModel.vertices.push(vec3(cosPhi * ray, ray, sinPhi * ray), vec3(cosPhi * ray, -ray, sinPhi * ray));
								_coneModel.vertices.push(vec3(cosPhi * ray, ray, sinPhi * ray));
								//indices
								if (longNum > 1) {
										var even = longNum * 2;
										var odd = longNum * 2 + 1;
										_cylindreModel.indexTriangle.push(
												0, even, even - 2,
												1, odd - 2, odd,
												even - 2, odd, odd - 2,
												odd, even - 2, even);
										_cylindreModel.indexLine.push(
												0, even,
												1, odd,
												odd, even,
												odd - 2, even - 2,
												even, even - 2,
												odd, odd - 2);
										_coneModel.indexTriangle.push(0,longNum+2,longNum+1,
																									longNum+2,1,longNum+1);

										if (longNum == longMax) {
												_cylindreModel.indexTriangle.push(
														0, 2, even,
														1, odd, 3,
														even, 3, odd,
														3, even, 2);
												_cylindreModel.indexLine.push(
														0, 2,
														1, 3,
														2, 3,
														even, odd,
														even, 2,
														odd, 3);
											_coneModel.indexTriangle.push(0,3,2,
																									3,1,2);
										}
								}
						}
				}
		}
}

function initModelBuffers() {
		_objects.forEach(function(type){
			type.model.vertexNum = type.model.vertices.length;
			type.model.indexNum = type.model.indexTriangle.length;
			
			type.model.posBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, type.model.posBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, flatten(type.model.vertices), gl.STATIC_DRAW);
			
			type.model.indexTriBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, type.model.indexTriBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(type.model.indexTriangle), gl.STATIC_DRAW);
			
			if(type.model.indexLine!=undefined){
				type.model.indexLineBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, type.model.indexLineBuffer);
				gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(type.model.indexLine), gl.STATIC_DRAW);
			}			
		});
}

function createObject(type){
	var object = new Object();
	object.init(_objects[type].model);
	if(Math.random()>.5){
		object.setColorRandom(true);
		if(Math.random()>.5){
			object.mesh=false;
		}
	}else{
		object.setColorTriangle(vec3(Math.random(),Math.random(),Math.random()));
	}
	
	object.rotation = [Math.random() * 3.14, Math.random() * 3.14, Math.random() * 3.14];
	object.translation = [1.0 - Math.random() * 2., 1.0 - Math.random() * 2.0, 1.0 - Math.random() * 2.0];
	//object.scale = [.1 + Math.random() * .5, .1 + Math.random() * .5, .1 + Math.random() * .5];

	_objects[type].instances.push(object);
}

function updateCamera() {
		_uViewMatrix = lookAt(vec3(_camera.r * Math.cos(_camera.theta) * Math.cos(_camera.phi),
															 _camera.r * Math.sin(_camera.theta), 
															 _camera.r * Math.cos(_camera.theta)* Math.sin(_camera.phi)), 
													vec3(0.0, 0.0, 0.0), 
													vec3(0.0, 1.0, 0.0));
		gl.uniformMatrix4fv(_uViewMatrixLoc, false, flatten(_uViewMatrix));
		render();
}

function render() {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		_objects.forEach(function(type) {
				//console.log(type.model)
				gl.bindBuffer(gl.ARRAY_BUFFER, type.model.posBuffer);
				gl.vertexAttribPointer(_aPosition, 3, gl.FLOAT, false, 0, 0);

				type.instances.forEach(function(object) {
						object.render();
				});
		});
}

//CLASSES

var Object = function() {
		this.model;
		this.colorTriBuffer;
		this.colorLineBUffer;
		this.colorsTriangle;
		this.colorsLine;
		this.translation;
		this.rotation;
		this.scale;
		this.modelMatrix;
		this.mesh;
		this.solid;
		this.colorRandom;
		this.colorTriangle;
		this.colorLine;

		function init(model) {
				this.model = model;
				this.colorsTriangle = [];
				this.colorsLine = [];

				this.translation = [.0, .0, .0];
				this.rotation = [.0, .0, .0];
				this.scale = [.5, .5, .5];
				this.modelMatrix = [];

				this.mesh = true;
				this.solid = true;
				this.colorRandom = false;
				this.colorTriangle = vec3(.4, .0, .4);
				this.colorLine = vec3(0.0, 0.0, 0.0);

				this.colorTriBuffer = gl.createBuffer();
				this.colorLineBuffer = gl.createBuffer();
				this.setColorTriangle(this.colorTriangle);
				this.setColorLine(this.colorLine);
		}

		function setColorRandom(colorRandom) {
				this.colorRandom = colorRandom;
				if (this.colorRandom == true) {
						for (var i = 0; i < this.model.vertexNum; ++i) {
								this.colorsTriangle[i] = vec3(Math.random() * .7, Math.random() * .7, Math.random() * .7);								
						}
				} else {
						for (var i = 0; i < this.model.vertexNum; ++i) {
								this.colorsTriangle[i] = this.colorTriangle;
						}
				}
				gl.bindBuffer(gl.ARRAY_BUFFER, this.colorTriBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, flatten(this.colorsTriangle), gl.STATIC_DRAW);			
		};

		function setColorTriangle(colorTriangle) {
				this.colorTriangle = colorTriangle;
				for (var i = 0; i < this.model.vertexNum; ++i) {
						this.colorsTriangle[i] = this.colorTriangle;
						this.colorsLine[i] = vec3(1.0-this.colorTriangle[0],1.0-this.colorTriangle[1],1.0-this.colorTriangle[2]);
				}
				gl.bindBuffer(gl.ARRAY_BUFFER, this.colorTriBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, flatten(this.colorsTriangle), gl.STATIC_DRAW);
				gl.bindBuffer(gl.ARRAY_BUFFER, this.colorLineBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, flatten(this.colorsLine), gl.STATIC_DRAW);
		};

		function setColorLine(colorLine) {
				this.colorLine = colorLine;
				for (var i = 0; i < this.model.vertexNum; ++i) {
						this.colorsLine[i] = this.colorLine;
				}
				gl.bindBuffer(gl.ARRAY_BUFFER, this.colorLineBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, flatten(this.colorsLine), gl.STATIC_DRAW);
		};

		function render() {
				if(this.solid==true){
					//Calculate model matrix
				this.modelMatrix = mult(rotateRad(this.rotation[0], 1, 0, 0), scaleMatrix(this.scale[0], this.scale[1], this.scale[2]));
				this.modelMatrix = mult(rotateRad(this.rotation[1], 0, 1, 0), this.modelMatrix);
				this.modelMatrix = mult(rotateRad(this.rotation[2], 0, 0, 1), this.modelMatrix);
				this.modelMatrix = mult(translate(this.translation[0], this.translation[1], this.translation[2]), this.modelMatrix);
				//update uniform
				gl.uniformMatrix4fv(_uModelMatrixLoc, false, flatten(this.modelMatrix));

				gl.bindBuffer(gl.ARRAY_BUFFER, this.colorTriBuffer);
				gl.vertexAttribPointer(_aColor, 3, gl.FLOAT, false, 0, 0);
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.model.indexTriBuffer);
				gl.drawElements(gl.TRIANGLES, this.model.indexNum, gl.UNSIGNED_SHORT, 0);
				}
			
				if (this.mesh == true) {
					this.modelMatrix = mult(rotateRad(this.rotation[0], 1, 0, 0), scaleMatrix(this.scale[0]+.005, this.scale[1]+.005, this.scale[2]+.005));
					this.modelMatrix = mult(rotateRad(this.rotation[1], 0, 1, 0), this.modelMatrix);
					this.modelMatrix = mult(rotateRad(this.rotation[2], 0, 0, 1), this.modelMatrix);
					this.modelMatrix = mult(translate(this.translation[0], this.translation[1], this.translation[2]), this.modelMatrix);
				//update uniform
					gl.uniformMatrix4fv(_uModelMatrixLoc, false, flatten(this.modelMatrix));
					
					gl.bindBuffer(gl.ARRAY_BUFFER, this.colorLineBuffer);
					gl.vertexAttribPointer(_aColor, 3, gl.FLOAT, false, 0, 0);
					gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.model.indexLineBuffer != undefined ? this.model.indexLineBuffer : this.model.indexTriBuffer);
					gl.drawElements(gl.LINES, this.model.indexNum, gl.UNSIGNED_SHORT, 0);
				}
		};

		return {
				init: init,
				setColorRandom: setColorRandom,
				setColorTriangle: setColorTriangle,
				setColorLine: setColorLine,
				render: render
		};
};