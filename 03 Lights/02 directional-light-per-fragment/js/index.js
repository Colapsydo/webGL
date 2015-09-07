"use strict";

var gl;

var _uModelMatrixLoc;
var _uNormalMatrix;
var _uNormalMatrixLoc;
var _uViewMatrix;
var _uViewMatrixLoc;
var _uProjectionMatrix;
var _uProjectionMatrixLoc;

var _uAmbientLoc;
var _uDiffuseLoc;
var _uSpecularLoc;
var _uLightDirLoc;
var _uShininessLoc;

var _aPosition;
var _aNormal;

var _directionalLight = {
		direction: vec4(0.0, 1.0, 0.0, 0.0),
		ambient: vec4(0.2, 0.2, 0.2, 1.0),
		diffuse: vec4(1.0, 1.0, 1.0, 1.0),
		specular: vec4(1.0, 1.0, 1.0, 1.0)
};

var _camera = {
		r: 4.0,
		theta: 0.0,
		phi: 0.0
};

var _cubeModel = {
		vertexNum: 24,
		vertices: [
				vec3(-1.0, -1.0, 1.0), vec3(1.0, -1.0, 1.0), vec3(1.0, 1.0, 1.0), vec3(-1.0, 1.0, 1.0),
				vec3(-1.0, -1.0, -1.0), vec3(-1.0, 1.0, -1.0), vec3(1.0, 1.0, -1.0), vec3(1.0, -1.0, -1.0),
				vec3(-1.0, 1.0, -1.0), vec3(-1.0, 1.0, 1.0), vec3(1.0, 1.0, 1.0), vec3(1.0, 1.0, -1.0),
				vec3(-1.0, -1.0, -1.0), vec3(1.0, -1.0, -1.0), vec3(1.0, -1.0, 1.0), vec3(-1.0, -1.0, 1.0),
				vec3(1.0, -1.0, -1.0), vec3(1.0, 1.0, -1.0), vec3(1.0, 1.0, 1.0), vec3(1.0, -1.0, 1.0),
				vec3(-1.0, -1.0, -1.0), vec3(-1.0, -1.0, 1.0), vec3(-1.0, 1.0, 1.0), vec3(-1.0, 1.0, -1.0)				
		],
		normals: [
				vec3(0.0, 0.0, 1.0), vec3(0.0, 0.0, 1.0), vec3(0.0, 0.0, 1.0), vec3(0.0, 0.0, 1.0),
				vec3(0.0, 0.0, -1.0), vec3(0.0, 0.0, -1.0), vec3(0.0, 0.0, -1.0), vec3(0.0, 0.0, -1.0),
				vec3(0.0, 1.0, 0.0), vec3(0.0, 1.0, 0.0), vec3(0.0, 1.0, 0.0), vec3(0.0, 1.0, 0.0),
				vec3(0.0, -1.0, 0.0), vec3(0.0, -1.0, 0.0), vec3(0.0, -1.0, 0.0), vec3(0.0, -1.0, 0.0),
				vec3(1.0, 0.0, 0.0), vec3(1.0, 0.0, 0.0), vec3(1.0, 0.0, 0.0), vec3(1.0, 0.0, 0.0),
				vec3(-1.0, 0.0, 0.0), vec3(-1.0, 0.0, 0.0), vec3(-1.0, 0.0, 0.0), vec3(-1.0, 0.0, 0.0)
		],
		indexNum: 36,
		indexTriangle: [ 
						0, 1, 2,0, 2, 3,
            4, 5, 6, 4, 6, 7,
            8, 9, 10, 8, 10, 11,
            12, 13, 14, 12, 14, 15,
            16, 17, 18, 16, 18, 19,
            20, 21, 22, 20, 22, 23
		]
};

var _sphereModel = {
		vertexNum: 0,
		vertices: [],
		normals: [],
		indexNum: 0,
		indexTriangle: []
};

var _cylindreModel = {
		vertexNum: 0,
		vertices: [],
		normals: [],
		indexNum: 0,
		indexTriangle: []
};

var _coneModel = {
		vertexNum: 0,
		vertices: [],
		normals: [],
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

var _system = {
		vertices: [vec3(-2, 0, 0), vec3(200, 0, 0), vec3(0, -2, 0), vec3(0, 200, 0), vec3(0, 0, -2), vec3(0, 0, 200)],
		normals: [vec3(0, 1, 1), vec3(0, 1, 1), vec3(1, 0, 1), vec3(1, 0, 1), vec3(1, 1, 0), vec3(1, 1, 0)],
		ambient: vec4(1.0, 0.0, 0.0, 1.0)
}

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
		_aNormal = gl.getAttribLocation(program, "aNormal");
		gl.enableVertexAttribArray(_aNormal);

		//UNIFORMS
		_uModelMatrixLoc = gl.getUniformLocation(program, "uModelMatrix");
		_uNormalMatrixLoc = gl.getUniformLocation(program, "uNormalMatrix");
		_uViewMatrixLoc = gl.getUniformLocation(program, "uViewMatrix");
		_uProjectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");

		_uLightDirLoc = gl.getUniformLocation(program, "uLightDir");
		_uAmbientLoc = gl.getUniformLocation(program, "uAmbient");
		_uDiffuseLoc = gl.getUniformLocation(program, "uDiffuse");
		_uSpecularLoc = gl.getUniformLocation(program, "uSpecular");
		_uShininessLoc = gl.getUniformLocation(program, "uShininess");

		_uViewMatrix = lookAt(vec3(_camera.r * Math.cos(_camera.theta) * Math.cos(_camera.phi),
						_camera.r * Math.sin(_camera.theta),
						_camera.r * Math.cos(_camera.theta) * Math.sin(_camera.phi)),
				vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0));
		gl.uniformMatrix4fv(_uViewMatrixLoc, false, flatten(_uViewMatrix));

		_uProjectionMatrix = perspective(75, canvas.width / canvas.height, .1, 100.0);
		gl.uniformMatrix4fv(_uProjectionMatrixLoc, false, flatten(_uProjectionMatrix));

		_uNormalMatrix = mat3();

		gl.uniform4fv(_uLightDirLoc, flatten(_directionalLight.direction));

		//EVENTS LISTENERS
		window.onresize = function(event) {
				setCanvasSize(document.getElementById("gl-canvas"));
		}

		setCanvasSize(canvas);

		canvas.addEventListener("touchstart", downHandler, false);
		canvas.addEventListener("touchmove", touchMoveHandler, false);
		window.addEventListener("touchend", upHandler, false);

		canvas.addEventListener("mousedown", downHandler, false);
		canvas.addEventListener("mousemove", moveHandler, false);
		window.addEventListener("mouseup", upHandler, false);

		window.addEventListener("keydown", keyDownHandler, false);
		window.addEventListener("keyup", keyUpHandler, false);
		window.addEventListener("mousewheel", mouseWheelHandler, false);

		//initilization
		initModels();
		initModelBuffers();

		for (var i = 0; i < 20; ++i) {
				createObject(i%4);
		}
	
		//createObject(0);

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
		//render();
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
		moveCamera(touches[touches.length - 1].pageX - _canvasRect.left, touches[touches.length - 1].pageY - _canvasRect.top);
}

function moveHandler(event) {
		event.preventDefault();

		moveCamera(event.clientX - _canvasRect.left, event.clientY - _canvasRect.top);
}

function moveCamera(newX, newY) {
		if (_mouseDown == true) {
				var moveX = newX - _mousePos.x;
				var moveY = newY - _mousePos.y;
				if (_ctrl == true) {
						_camera.r += moveY * 0.01;
						_camera.r = _camera.r < 1.5 ? 1.5 : _camera.r;
				} else {
						_camera.phi = (_camera.phi + moveX * 0.01) % 6.28;
						_camera.theta += moveY * 0.01;
						_camera.theta = _camera.theta > 1.57 ? 1.57 : _camera.theta;
						_camera.theta = _camera.theta < -1.57 ? -1.57 : _camera.theta;
				}
				updateCamera();

				_mousePos.x = newX;
				_mousePos.y = newY;
		}
}

function mouseWheelHandler(event){
	_camera.r-=event.wheelDelta*0.001;
	_camera.r = _camera.r<1.5?1.5:_camera.r;
	updateCamera();
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
		var ray = 1.0;

		_cylindreModel.vertices.push(vec3(0.0, ray, 0.0), vec3(0.0, -ray, 0.0));
		_cylindreModel.normals.push(vec3(0.0, 1.0, 0.0), vec3(0.0, -1.0, 0.0));
		
		_coneModel.vertices.push(vec3(0.0, ray, 0.0), vec3(0.0, -ray, 0.0));
		_coneModel.normals.push(vec3(0.0, 1.0, 0.0), vec3(0.0, -1.0, 0.0));


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
						_sphereModel.normals.push(vec3(x * ray, y * ray, z * ray));

						//indices
						if (latNum < latMax && longNum < longMax) {
								var first = (latNum * (longMax + 1)) + longNum;
								var second = first + longMax + 1;
								_sphereModel.indexTriangle.push(second, first, first + 1, second + 1, second, first + 1);
						}

						if (latNum == 0) {
								//cylindre
								//vertices top/down with normal for cap, top/down with normal for body
								_cylindreModel.vertices.push(vec3(cosPhi * ray, ray, sinPhi * ray), vec3(cosPhi * ray, -ray, sinPhi * ray),vec3(cosPhi * ray, ray, sinPhi * ray), vec3(cosPhi * ray, -ray, sinPhi * ray));
								_cylindreModel.normals.push(vec3(0.0, 1.0, 0.0), vec3(0.0,-1.0,0.0),vec3(cosPhi * ray, 0, sinPhi * ray), vec3(cosPhi * ray, 0, sinPhi * ray));
								
								//Cone
								//vertices
								_coneModel.vertices.push(vec3(cosPhi * ray, ray, sinPhi * ray),vec3(cosPhi * ray, ray, sinPhi * ray));
								_coneModel.normals.push(vec3(0.0,1.0,0.0),vec3(cosPhi * ray, 0.0, sinPhi * ray));
								
								//indices
								if (longNum > 0) {
										//cylinder
										var even = 2 + longNum * 4;
										var odd = 3 + longNum * 4;
										_cylindreModel.indexTriangle.push(
												0, even, even - 4, //top cap												
											  1, odd - 4, odd, //bottom
												//body
												even - 2, odd+2, odd - 2,
												odd+2, even - 2, even+2
										);
										//cone
										even = 2 + longNum*2;
										_coneModel.indexTriangle.push(
												0,even,even-2, //top cap
												even+1,1,even-1 //body
										);
								}
						}
				}
		}
}

function initModelBuffers() {
		_objects.forEach(function(type) {
				type.model.vertexNum = type.model.vertices.length;
				type.model.indexNum = type.model.indexTriangle.length;

				type.model.posBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, type.model.posBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, flatten(type.model.vertices), gl.STATIC_DRAW);

				type.model.normalBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, type.model.normalBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, flatten(type.model.normals), gl.STATIC_DRAW);

				type.model.indexTriBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, type.model.indexTriBuffer);
				gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(type.model.indexTriangle), gl.STATIC_DRAW);
		});

		_system.posBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, _system.posBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(_system.vertices), gl.STATIC_DRAW);
		_system.normalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, _system.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(_system.normals), gl.STATIC_DRAW);
		_system.verticesLength = _system.vertices.length;
}

function createObject(type) {
		var object = new Object();
		object.init(_objects[type].model);
		var color = vec4(Math.random(), Math.random(), Math.random(), 1.0);
		object.setMaterialAmbient(vec4(1.0 - color[0], 1.0 - color[1], 1.0 - color[2, 1.0]));
		object.setMaterialDiffuse(color);
		object.setMaterialSpecular(color);
		object.setMaterialShininess(28.0 + Math.random() * 100);

		object.rotation = [Math.random() * 3.14, Math.random() * 3.14, Math.random() * 3.14];
		object.translation = [2.0 - Math.random() * 4.0, 2.0 - Math.random() * 4.0, 2.0 - Math.random() * 4.0];
		object.scale = [.1 + Math.random() * .5, .1 + Math.random() * .5, .1 + Math.random() * .5];

		_objects[type].instances.push(object);
}

function updateCamera() {
		_uViewMatrix = lookAt(vec3(_camera.r * Math.cos(_camera.theta) * Math.cos(_camera.phi),
						_camera.r * Math.sin(_camera.theta),
						_camera.r * Math.cos(_camera.theta) * Math.sin(_camera.phi)),
				vec3(0.0, 0.0, 0.0),
				vec3(0.0, 1.0, 0.0));
		gl.uniformMatrix4fv(_uViewMatrixLoc, false, flatten(_uViewMatrix));
		//render();
}

function render() {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		/*gl.uniform4fv(_uAmbientLoc, flatten(_system.ambient));
		gl.bindBuffer(gl.ARRAY_BUFFER, _system.posBuffer);
		gl.vertexAttribPointer(_aPosition, 3, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, _system.normalBuffer);
		gl.vertexAttribPointer(_aNormal, 3, gl.FLOAT, false, 0, 0);
		gl.uniformMatrix4fv(_uModelMatrixLoc, false, flatten(mat4(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)));
		gl.drawArrays(gl.LINES, 0, _system.verticesLength);*/

		_objects.forEach(function(type) {
				//console.log(type.model)
				gl.bindBuffer(gl.ARRAY_BUFFER, type.model.posBuffer);
				gl.vertexAttribPointer(_aPosition, 3, gl.FLOAT, false, 0, 0);

				gl.bindBuffer(gl.ARRAY_BUFFER, type.model.normalBuffer);
				gl.vertexAttribPointer(_aNormal, 3, gl.FLOAT, false, 0, 0);

				type.instances.forEach(function(object) {
						object.render();
				});
		});

		requestAnimationFrame(render);
}

//CLASSES

var Object = function() {
		function init(model) {
				this.model = model;

				this.translation = [.0, .0, .0];
				this.rotation = [.0, .0, .0];
				this.scale = [.5, .5, .5];
				this.modelMatrix = [];

				this.setMaterialAmbient(vec4(1.0, 0.2, 1.0, 1.0));
				this.setMaterialDiffuse(vec4(1.0, 0.8, 0.0, 1.0));
				this.setMaterialSpecular(vec4(1.0, 0.8, 0.2, 1.0));
				this.setMaterialShininess(100.0);
		}

		function setMaterialAmbient(ambient) {
				this.materialAmbient = ambient;
				this.productAmbient = mult(_directionalLight.ambient, this.materialAmbient);
		};

		function setMaterialDiffuse(diffuse) {
				this.materialDiffuse = diffuse;
				this.productDiffuse = mult(_directionalLight.diffuse, this.materialDiffuse);
		};

		function setMaterialSpecular(specular) {
				this.materialSpecular = specular;
				this.productSpecular = mult(_directionalLight.specular, this.materialSpecular);
		};

		function setMaterialShininess(shininess) {
				this.materialShininess = shininess;
		};

		function render() {
				//Calculate model matrix
				this.modelMatrix = mult(rotateRad(this.rotation[0], 1, 0, 0), scaleMatrix(this.scale[0], this.scale[1], this.scale[2]));
				this.modelMatrix = mult(rotateRad(this.rotation[1], 0, 1, 0), this.modelMatrix);
				this.modelMatrix = mult(rotateRad(this.rotation[2], 0, 0, 1), this.modelMatrix);
				this.modelMatrix = mult(translate(this.translation[0], this.translation[1], this.translation[2]), this.modelMatrix);
				//normal
				_uNormalMatrix = toInverseMat3(mult(_uViewMatrix, this.modelMatrix));
				transpose(_uNormalMatrix);
				gl.uniformMatrix3fv(_uNormalMatrixLoc, false, flatten(_uNormalMatrix));

				//update uniform
				gl.uniformMatrix4fv(_uModelMatrixLoc, false, flatten(this.modelMatrix));

				gl.uniform4fv(_uAmbientLoc, flatten(this.productAmbient));
				gl.uniform4fv(_uDiffuseLoc, flatten(this.productDiffuse));
				gl.uniform4fv(_uSpecularLoc, flatten(this.productSpecular));
				gl.uniform1f(_uShininessLoc, this.materialShininess);

				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.model.indexTriBuffer);
				gl.drawElements(gl.TRIANGLES, this.model.indexNum, gl.UNSIGNED_SHORT, 0);

				this.rotation[0]+=0.01;
				this.rotation[2]+=0.005;
				this.translation[0]+=Math.cos(this.rotation[0])*.01;
				this.translation[2]+=Math.cos(this.rotation[2])*.01;
		};

		return {
				init: init,
				setMaterialAmbient: setMaterialAmbient,
				setMaterialDiffuse: setMaterialDiffuse,
				setMaterialSpecular: setMaterialSpecular,
				setMaterialShininess: setMaterialShininess,
				render: render
		};
};