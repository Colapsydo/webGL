"use strict";

var gl;

//uniforms
var _uModelMatrix;
var _uModelMatrixLoc;
var _uViewMatrix;
var _uViewMatrixLoc;
var _uProjectionMatrix;
var _uProjectionMatrixLoc;

//attributes
var _aPosition;
var _aColor;

var _camera = {
		r: 1.5,
		theta: 0.5,
		phi: 0.7853,
		lookAt: vec3(0.0,0.0,0.0)
};

var _system = {
	vertices: [vec3(-200,0,0),vec3(200,0,0),vec3(0,-200,0),vec3(0,200,0),vec3(0,0,-200),vec3(0,0,200)],
	colors : [vec3(1,0,0),vec3(1,0,0),vec3(0,1,0),vec3(0,1,0),vec3(0,0,1),vec3(0,0,1)]
}
var _showSystem=true;

//models
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

var _workingObject = {
	type:-1,
	index:0
};

var _selectionAnimationList=[];

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
var _moveStates = Object.freeze({
	CAMERA_ROTATION : 1,
	CAMERA_ZOOM: 2
});
var _mouseState=_moveStates.CAMERA_ROTATION;

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

		//  Define unique program
		var program = initShaders(gl, "vertex-shader", "fragment-shader");
		gl.useProgram(program);

		//Store Attributes location and enable vertex Arrays
		_aPosition = gl.getAttribLocation(program, "aPosition");
		gl.enableVertexAttribArray(_aPosition);
		_aColor = gl.getAttribLocation(program, "aColor");
		gl.enableVertexAttribArray(_aColor);

		//UNIFORMS
		_uModelMatrixLoc = gl.getUniformLocation(program, "uModelMatrix");
		_uViewMatrixLoc = gl.getUniformLocation(program, "uViewMatrix");
		_uProjectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");

		_uViewMatrix = lookAt(vec3(_camera.r * Math.cos(_camera.theta) * Math.cos(_camera.phi),
															 _camera.r * Math.sin(_camera.theta), 
															 _camera.r * Math.cos(_camera.theta)* Math.sin(_camera.phi)), 
													_camera.lookAt, 
													vec3(0.0, 1.0, 0.0));
		gl.uniformMatrix4fv(_uViewMatrixLoc, false, flatten(_uViewMatrix));

		_uProjectionMatrix = perspective(75, canvas.width / canvas.height, .1, 100.0);
		gl.uniformMatrix4fv(_uProjectionMatrixLoc, false, flatten(_uProjectionMatrix));

		//EVENTS LISTENERS
	
		//global
		window.onresize = function(event) {
				setCanvasSize(document.getElementById("gl-canvas"));
		}
		
		//canvas
		canvas.addEventListener("touchstart", downHandler, false);
		canvas.addEventListener("touchmove", touchMoveHandler, false);
		window.addEventListener("touchend", upHandler, false);

		canvas.addEventListener("mousedown", downHandler, false);
		canvas.addEventListener("mousemove", moveHandler, false);
		window.addEventListener("mouseup", upHandler, false);

		window.addEventListener("keydown", keyDownHandler, false);
		window.addEventListener("keyup", keyUpHandler, false);
		
		//settings
		//buttons
		document.getElementById("cube").addEventListener("click", addObject, false);
		document.getElementById("sphere").addEventListener("click", addObject, false);
		document.getElementById("cylinder").addEventListener("click", addObject, false);
		document.getElementById("cone").addEventListener("click", addObject, false);
		//sliders
		document.getElementById("scaleX").addEventListener("input", changeSettings, false);
		document.getElementById("scaleY").addEventListener("input", changeSettings, false);
		document.getElementById("scaleZ").addEventListener("input", changeSettings, false);
		document.getElementById("rotationX").addEventListener("input", changeSettings, false);
		document.getElementById("rotationY").addEventListener("input", changeSettings, false);
		document.getElementById("rotationZ").addEventListener("input", changeSettings, false);
		document.getElementById("translationX").addEventListener("input", changeSettings, false);
		document.getElementById("translationY").addEventListener("input", changeSettings, false);
		document.getElementById("translationZ").addEventListener("input", changeSettings, false);
	
		document.getElementById("color").addEventListener("input", changeSettings, false);
		document.getElementById("solid").addEventListener("click", changeSettings, false);
		document.getElementById("mesh").addEventListener("click", changeSettings, false);
		document.getElementById("randomColor").addEventListener("click", changeSettings, false);
	
		document.getElementById("objectList").addEventListener("change", selection, false);
		document.getElementById("delete").addEventListener("click", deletion, false);
	
		document.getElementById("axis").addEventListener("click", changeSettings, false);
		document.getElementById("cameraRotation").addEventListener("change", changeSettings, false);
	document.getElementById("cameraZoom").addEventListener("change", changeSettings, false);
				
		//initilization
		initModels();
		initModelBuffers();

		setCanvasSize(canvas);
		render();
};

//EVENTS
function setCanvasSize(canvas) {
		canvas.width = window.innerWidth - document.getElementById("settings").offsetWidth-55;
		canvas.height = window.innerHeight - 20;
		_canvasRect = canvas.getBoundingClientRect();
		gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
		_uProjectionMatrix = perspective(75, canvas.clientWidth / canvas.clientHeight, .1, 200.0);
		gl.uniformMatrix4fv(_uProjectionMatrixLoc, false, flatten(_uProjectionMatrix));
		render();
}


//mouse/touch Events

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
		
		if((_mouseState === _moveStates.CAMERA_ROTATION)===_ctrl){
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

function changeSettings(event){
	if(_workingObject.type>-1){
		switch(event.target.id){
				case "scaleX":
        	_objects[_workingObject.type].instances[_workingObject.index].scale[0] = parseInt(event.target.value)*.05;
				break;
				case "scaleY":
        	_objects[_workingObject.type].instances[_workingObject.index].scale[1] = parseInt(event.target.value)*.05;
				break;
				case "scaleZ":
        	_objects[_workingObject.type].instances[_workingObject.index].scale[2] = parseInt(event.target.value)*.05;
				break;
				case "rotationX":
        	_objects[_workingObject.type].instances[_workingObject.index].rotation[0] = parseInt(event.target.value)*0.017453;
				break;				
				case "rotationY":
        	_objects[_workingObject.type].instances[_workingObject.index].rotation[1] = parseInt(event.target.value)*0.017453;
				break;
				case "rotationZ":
        	_objects[_workingObject.type].instances[_workingObject.index].rotation[2] = parseInt(event.target.value)*0.017453;
				break;
				case "translationX":
        	_objects[_workingObject.type].instances[_workingObject.index].translation[0] = parseInt(event.target.value)*.05;
				break;
				case "translationY":
        	_objects[_workingObject.type].instances[_workingObject.index].translation[1] = parseInt(event.target.value)*.05;
				break;
				case "translationZ":
        	_objects[_workingObject.type].instances[_workingObject.index].translation[2] = parseInt(event.target.value)*.05;
				break;				
				
				case "color":
					var color = event.target.value;
					var red = parseInt(color.substring(1,3),16)*0.003921;
					var green = parseInt(color.substring(3,5),16)*0.003921;
					var blue = parseInt(color.substring(5,7),16)*0.003921;										_objects[_workingObject.type].instances[_workingObject.index].setColorTriangle(vec3(red,green,blue)); 
				break;
				
				case "solid":				_objects[_workingObject.type].instances[_workingObject.index].solid = event.target.checked;
				if(event.target.checked == false){
					_objects[_workingObject.type].instances[_workingObject.index].mesh = true;
					document.getElementById("mesh").checked=true;
				}
				break;
				
				case "mesh":
					_objects[_workingObject.type].instances[_workingObject.index].mesh = event.target.checked;
					if(event.target.checked == false){
						_objects[_workingObject.type].instances[_workingObject.index].solid = true;
						document.getElementById("solid").checked=true;
					}
				break;
				
				case "randomColor":				_objects[_workingObject.type].instances[_workingObject.index].setColorRandom(event.target.cheked); 
				break;		
				
				case "axis":
					_showSystem = !_showSystem;
				break;
		}
		
		_objects[_workingObject.type].instances[_workingObject.index].updateModelMatrix();
	}		
	switch(event.target.id){
		case "cameraRotation":
				_mouseState = _moveStates.CAMERA_ROTATION;
		break;
		case "cameraZoom":
				_mouseState = _moveStates.CAMERA_ZOOM;
		break;
	}
	render();
}

//FUNCTIONS

//INIT
function initModels() {
		//Definition of vertices and indices for geometric models
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

						//sphere vertices
						_sphereModel.vertices.push(vec3(x * ray, y * ray, z * ray));
						//indices
						if (latNum < latMax && longNum < longMax) {
								var first = (latNum * (longMax + 1)) + longNum;
								var second = first + longMax + 1;
								_sphereModel.indexTriangle.push(second, first, first + 1, second + 1, second, first + 1);
						}

						if (latNum == 0) {
								//cylindre vertices
								_cylindreModel.vertices.push(vec3(cosPhi * ray, ray, sinPhi * ray), vec3(cosPhi * ray, -ray, sinPhi * ray));
								_coneModel.vertices.push(vec3(cosPhi * ray, ray, sinPhi * ray));
								//indices
								if (longNum > 1) {
										var even = longNum * 2;
										var odd = longNum * 2 + 1;
										_cylindreModel.indexTriangle.push(0, even, even - 2, 1, odd - 2, odd, even - 2, odd, odd - 2, odd, even - 2, even);
										_cylindreModel.indexLine.push(0, even, 1, odd, odd, even, odd - 2, even - 2, even, even - 2, odd, odd - 2);
										//cone
										_coneModel.indexTriangle.push(0,longNum+2,longNum+1, longNum+2,1,longNum+1);

										if (longNum == longMax) {
											_cylindreModel.indexTriangle.push( 0, 2, even, 1, odd, 3, even, 3, odd, 3, even, 2);
											_cylindreModel.indexLine.push( 0, 2, 1, 3, 2, 3, even, odd, even, 2, odd, 3);
											_coneModel.indexTriangle.push(0,3,2, 3,1,2);
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
	
		_system.posBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, _system.posBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(_system.vertices), gl.STATIC_DRAW);
		_system.colorBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, _system.colorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(_system.colors), gl.STATIC_DRAW);
		_system.verticesLength = _system.vertices.length;
}

//OBJECTS CREATION / SELECTION / DELETION

function addObject(event){
	_workingObject.type = parseInt(event.target.value); 
	var index = 0;
	while(_objects[_workingObject.type].instances[index]!=undefined){
		index++;
	}
	_workingObject.index = index;
	
	createObject(_workingObject.type);
	
	addSelection();
	selectionUpdate();
}

function createObject(type){
	var object = new Object();
	object.init(_objects[type].model);
	_objects[type].instances[_workingObject.index]=object;
}

function addSelection() {
	var list = document.getElementById("objectList");
  var option = document.createElement("option");
  switch(_workingObject.type){
		case 0:
			option.text = "Cube";
		break;
		case 1:
			option.text = "Sphere";
		break;
		case 2:
			option.text = "Cylinder";
		break;
		case 3:
			option.text = "Cone";
		break;
	}
	var listNum = _workingObject.index+1;
	option.text += " "+ listNum;
	option.value = _workingObject.type+","+_workingObject.index;
  list.add(option);
	list.selectedIndex = list.length-1;
}

function selection(event){
	var data = event.target.value.split(",");
	_workingObject.type = data[0];
	_workingObject.index = data[1];
	selectionUpdate();
}

function selectionAnimation(){
		for(var i=_selectionAnimationList.length-1; i >-1; --i){
			var currentObject = _objects[_selectionAnimationList[i].type].instances[_selectionAnimationList[i].index];
			if(currentObject!=undefined){
				currentObject.selectAngle +=0.13;
				var coeff = 1.0+Math.sin(currentObject.selectAngle)*.2;
				currentObject.scale[0] = currentObject.scaleBck[0]*coeff;
				currentObject.scale[1] = currentObject.scaleBck[1]*coeff;
				currentObject.scale[2] = currentObject.scaleBck[2]*coeff;
				currentObject.updateModelMatrix();
				if(currentObject.selectAngle>=3.14){
					currentObject.select(false);
					_selectionAnimationList.splice(i,1);
				}
			}else{
				_selectionAnimationList.splice(i,1);
			}			
		}
		render();
		if(_selectionAnimationList.length>0){
			requestAnimationFrame(selectionAnimation);
		}
};

function selectionUpdate(){
	document.getElementById("scaleX").value =parseInt(_objects[_workingObject.type].instances[_workingObject.index].scale[0]*20);
	document.getElementById("scaleY").value =parseInt(_objects[_workingObject.type].instances[_workingObject.index].scale[1]*20);
	document.getElementById("scaleZ").value =parseInt(_objects[_workingObject.type].instances[_workingObject.index].scale[2]*20);
	document.getElementById("rotationX").value =parseInt(_objects[_workingObject.type].instances[_workingObject.index].rotation[0]*57.29);
	document.getElementById("rotationY").value =parseInt(_objects[_workingObject.type].instances[_workingObject.index].rotation[1]*57.29);
	document.getElementById("rotationZ").value =parseInt(_objects[_workingObject.type].instances[_workingObject.index].rotation[2]*57.29);
	document.getElementById("translationX").value =parseInt(_objects[_workingObject.type].instances[_workingObject.index].translation[0]*20);
	document.getElementById("translationY").value =parseInt(_objects[_workingObject.type].instances[_workingObject.index].translation[1]*20);
	document.getElementById("translationZ").value =parseInt(_objects[_workingObject.type].instances[_workingObject.index].translation[2]*20);
	var color = _objects[_workingObject.type].instances[_workingObject.index].colorTriangle;
	document.getElementById("color").value = "#"+rgbToHex(color[0]*255,color[1]*255,color[2]*255);
	document.getElementById("solid").checked =_objects[_workingObject.type].instances[_workingObject.index].solid;
	document.getElementById("mesh").checked =_objects[_workingObject.type].instances[_workingObject.index].mesh;
	document.getElementById("randomColor").checked =_objects[_workingObject.type].instances[_workingObject.index].randomColor;
	
	_selectionAnimationList.push({type:_workingObject.type,index:_workingObject.index});
	_objects[_workingObject.type].instances[_workingObject.index].select(true);
	selectionAnimation();
}

function deletion(){
	if(_workingObject.type>-1){
		// erase object
		_objects[_workingObject.type].instances[_workingObject.index] = undefined;
		
		//upodate selection list
		var list = document.getElementById("objectList");
		var newSelectedIndex = list.selectedIndex>1?list.selectedIndex-1:0;
		list.remove(list.selectedIndex);
		list.selectedIndex = newSelectedIndex;
		
		//if list non empty update working object
		if(list.length>0){
			var data = list.item(list.selectedIndex).value.split(",");
			_workingObject.type = data[0];
			_workingObject.index = data[1];
			selectionUpdate();
		}else{
			_workingObject.type = -1;
		}
		render();
	}
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

//RENDER
function render() {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
		if(_showSystem==true){
				gl.bindBuffer(gl.ARRAY_BUFFER, _system.posBuffer);
				gl.vertexAttribPointer(_aPosition, 3, gl.FLOAT, false, 0, 0);
				gl.bindBuffer(gl.ARRAY_BUFFER, _system.colorBuffer);
				gl.vertexAttribPointer(_aColor, 3, gl.FLOAT, false, 0, 0);
				gl.uniformMatrix4fv(_uModelMatrixLoc, false, flatten(mat4(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)));
				gl.drawArrays(gl.LINES, 0, _system.verticesLength);
		}
		_objects.forEach(function(type) {
				gl.bindBuffer(gl.ARRAY_BUFFER, type.model.posBuffer);
				gl.vertexAttribPointer(_aPosition, 3, gl.FLOAT, false, 0, 0);

				type.instances.forEach(function(object) {
						if(object !=undefined){
							object.render();
						}						
				});
		});
}

//CLASSES

var Object = function() {
		function init(model) {
				this.model = model;
				this.colorsTriangle = [];
				this.colorsLine = [];
			
				this.selectAngle=0.0;

				this.translation = [.0, .0, .0];
				this.rotation = [.0, .0, .0];
				this.scale = [.5, .5, .5];
				this.modelMatrix = [];
				this.modelMeshMatrix = [];

				this.mesh = true;
				this.solid = true;
				this.randomColor = false;
				this.colorTriangle = vec3(.4, .0, .4);
				this.colorLine = vec3(0.0, 0.0, 0.0);

				this.colorTriBuffer = gl.createBuffer();
				this.colorLineBuffer = gl.createBuffer();
				this.setColorTriangle(this.colorTriangle);
			
				this.updateModelMatrix();
		};

		function setColorRandom() {
				this.randomColor = !this.randomColor;
				if (this.randomColor == true) {
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
				this.colorLine = vec3(1.0-this.colorTriangle[0],1.0-this.colorTriangle[1],1.0-this.colorTriangle[2]);
				for (var i = 0; i < this.model.vertexNum; ++i) {
						this.colorsTriangle[i] = this.colorTriangle;
						this.colorsLine[i] = this.colorLine;
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
	
		function select(stateON){
			if(stateON===true){
				if(this.selectAngle==0.0){
					this.scaleBck=[this.scale[0],this.scale[1],this.scale[2]];
				}
			}else{
				this.scale[0] = this.scaleBck[0];
				this.scale[1] = this.scaleBck[1];
				this.scale[2] = this.scaleBck[2];
				this.selectAngle=0.0;
			}
		};		
	
		function updateModelMatrix(){
				//Calculate model matrix
				this.modelMatrix = mult(rotateRad(this.rotation[0], 1, 0, 0), scaleMatrix(this.scale[0], this.scale[1], this.scale[2]));
				this.modelMatrix = mult(rotateRad(this.rotation[1], 0, 1, 0), this.modelMatrix);
				this.modelMatrix = mult(rotateRad(this.rotation[2], 0, 0, 1), this.modelMatrix);
				this.modelMatrix = mult(translate(this.translation[0], this.translation[1], this.translation[2]), this.modelMatrix);
			
				//model matrix for mesh
				this.modelMeshMatrix = mult(rotateRad(this.rotation[0], 1, 0, 0), scaleMatrix(this.scale[0]+.005, this.scale[1]+.005, this.scale[2]+.005));
					this.modelMeshMatrix = mult(rotateRad(this.rotation[1], 0, 1, 0), this.modelMeshMatrix);
					this.modelMeshMatrix = mult(rotateRad(this.rotation[2], 0, 0, 1), this.modelMeshMatrix);
					this.modelMeshMatrix = mult(translate(this.translation[0], this.translation[1], this.translation[2]), this.modelMeshMatrix);
		}

		function render() {
				if(this.solid==true){	
					//update uniform
					gl.uniformMatrix4fv(_uModelMatrixLoc, false, flatten(this.modelMatrix));

					gl.bindBuffer(gl.ARRAY_BUFFER, this.colorTriBuffer);
					gl.vertexAttribPointer(_aColor, 3, gl.FLOAT, false, 0, 0);
					gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.model.indexTriBuffer);
					gl.drawElements(gl.TRIANGLES, this.model.indexNum, gl.UNSIGNED_SHORT, 0);
				}
			
				if (this.mesh == true) {
					//update uniform
					gl.uniformMatrix4fv(_uModelMatrixLoc, false, flatten(this.modelMeshMatrix));
					
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
				select: select,
				updateModelMatrix: updateModelMatrix,
				render: render
		};
};