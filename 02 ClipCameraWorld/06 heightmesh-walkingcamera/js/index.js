"use strict";

/*Todo:
- light
- run with shift
- fixed background
- spherical shader (planet effect)
- seamless noise
- clusters
*/


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

var _posBuffer;
var _indexBuffer;
var _indexLength;

var _gradients;
var _grid;

var _vertices;

var _gridSize;
var _meshSize;
var _scale;

var _onGround;
var _jump;

var _camera = {
		pos: vec3(0.0,10.0,-1.5),
		theta: 0.0,
		phi: 0.8,
		lookAt: vec3(0.0,0.0,0.0)
};

var _canvasRect;
var _ctrl = false;
var _mouseDown = false;
var _mousePos = {
		x: 0,
		y: 0
};

//movement
var _left = false;
var _up = false;
var _right = false;
var _down = false;
var _lastTime=0.0;


window.onload = function init() {
		var canvas = document.getElementById("gl-canvas");

		gl = WebGLUtils.setupWebGL(canvas);
		if (!gl) {
				alert("WebGL isn't available");
		}

		gl.clearColor(.0, .0, .0, 1.0);
		// enable hidden-surface removal
		//gl.enable(gl.CULL_FACE);
		gl.enable(gl.DEPTH_TEST);

		//  Define unique program
		var program = initShaders(gl, "vertex-shader", "fragment-shader");
		gl.useProgram(program);

		//Store Attributes location and enable vertex Arrays
		_aPosition = gl.getAttribLocation(program, "aPosition");
		gl.enableVertexAttribArray(_aPosition);

		//UNIFORMS
		_uModelMatrixLoc = gl.getUniformLocation(program, "uModelMatrix");
		_uViewMatrixLoc = gl.getUniformLocation(program, "uViewMatrix");
		_uProjectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");

		_uViewMatrix = lookAt(_camera.pos, 
													_camera.pos, 
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
	
		document.getElementById("poly").addEventListener("change", changeSettings, false);
		document.getElementById("noise").addEventListener("change", changeSettings, false);
		document.getElementById("altitude").addEventListener("input", changeSettings, false);
	
		document.getElementById("landscape").addEventListener("click", newLandscape, false);
	
		setCanvasSize(canvas);
	
		_gridSize = 6;
		_meshSize = 100;
		_scale = [4.0,2.0,4.0];
	
		_onGround=false;
		_jump=0.0;
		
		newLandscape();
		_lastTime = new Date().getTime();
		move();
};

//EVENTS
function setCanvasSize(canvas) {
		canvas.width = window.innerWidth - document.getElementById("settings").offsetWidth-55;
		canvas.height = window.innerHeight - 25;
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
		
		_camera.theta = (_camera.theta-moveX*0.01)%6.28;
		_camera.phi += moveY*0.01;
		_camera.phi = _camera.phi>1.57 ? 1.57 : _camera.phi;
		_camera.phi = _camera.phi<-1.57 ? -1.57 : _camera.phi;
		
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
		event.preventDefault();
		switch(event.keyCode) {
			case 17:
				_ctrl = true;
			break;
			case 32:
				if(_onGround==true){
					_jump = 0.005;
					_onGround = false;
				}
			break;
			case 37:
				_left = true;
			break;
			case 81:
				_left = true;
			break;
			case 65:
				_left = true;
			break;
			case 38:
				_up = true;
			break;
			case 90:
				_up = true;
			break;
			case 87:
				_up = true;
			break;
			case 39:
				_right = true;
			break;
			case 68:
				_right = true;
			break;
			case 40:
				_down = true;
			break;
			case 83:
				_down = true;
			break;			
		}
}

function keyUpHandler(event) {
		switch(event.keyCode) {
			case 17:
				_ctrl = false;
			break;
			case 37:
				_left = false;
			break;
			case 81:
				_left = false;
			break;
			case 65:
				_left = false;
			break;
			case 38:
				_up = false;
			break;
			case 90:
				_up = false;
			break;
			case 87:
				_up = false;
			break;
			case 39:
				_right = false;
			break;
			case 68:
				_right = false;
			break;
			case 40:
				_down = false;
			break;
			case 83:
				_down = false;
			break;			
		}
}

function changeSettings(event){
	switch(event.target.id){
				case "poly":
        	_meshSize = parseInt(event.target.value);
					initModel();
				break;
			
				case "noise":
        	_gridSize = parseInt(event.target.value);					
					_grid = createPerlinGrid(_gridSize,_gridSize);
					initModel();
				break;
				
				case "altitude":
					_scale[1] = parseFloat(event.target.value);					 
        	var modelMatrix = scaleMatrix(_scale[0], _scale[1], _scale[2]);
					gl.uniformMatrix4fv(_uModelMatrixLoc, false, flatten(modelMatrix));
				break;
	}
	
	render();
}

function newLandscape(event){
		defineGradients();
		_grid = createPerlinGrid(_gridSize,_gridSize);
		initModel();
		
		render();
}

//FUNCTIONS

//INIT
function initModel(){
	_vertices = [];
	var indices = [];
	var step = 2/_meshSize;
	var x,y,z;
	for(var i=0; i<_meshSize;++i){
		for(var j=0; j<_meshSize ;++j){
			x = -1+i*step;
			z = -1+j*step;
			y = noise((1+x)*(_gridSize-1)*.5,(1+z)*(_gridSize-1)*.5);
			
			_vertices.push(vec3(x,y,z));					
			
			if(i>0){
				if(j==0){
					indices.push(i*_meshSize+j);	
				}else{
					indices.push((i-1)*_meshSize+j-1);
				}
				indices.push(i*_meshSize+j);
				if(j==_meshSize-1){
					indices.push((i-1)*_meshSize+j);
					indices.push((i-1)*_meshSize+j);
				}
			}
		}
	}
	
	_indexLength = indices.length;
	
	_posBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, _posBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(_vertices), gl.STATIC_DRAW);	
			
	_indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, _indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
	
	var modelMatrix = scaleMatrix(_scale[0], _scale[1], _scale[2]);
	gl.uniformMatrix4fv(_uModelMatrixLoc, false, flatten(modelMatrix));
}

//OBJECTS CREATION / SELECTION / DELETION
function defineGradients(){
	var angle=0.0;
	var step = 6.28/32;
	_gradients = [];
	while(angle<6.28){
		//random gradients along the unit circle
		_gradients.push([Math.cos(angle),Math.sin(angle)]);
		angle+=Math.random()*step;
	}
}

function createPerlinGrid(baseX, baseY){
	var grid=[];
	for (var i=0; i <baseX; ++i){
		var column=[];
		for (var j=0; j<baseY; ++j){
			column.push(parseInt((Math.random()*_gradients.length)));
		}
		grid.push(column);
	}
	return(grid);
}

function noise(x, y) { //defining noise value at noise point (x,y)
 
    // grid cell coordinates
    var x0 = x>>0;
		var x1 = x0+1;
    var y0 = y>>0;
		var y1 = y0+1;
	
		// position of point into cell
		var dx  = x-x0;
		var dy = y-y0
	
		//dot product between gradient and vector from grid point to noise point
		var s = dotProduct(_gradients[_grid[x0][y0]],dx,dy);
		var t = dotProduct(_gradients[_grid[x1][y0]],dx-1,dy); //
		var u = dotProduct(_gradients[_grid[x0][y1]],dx,dy-1);
		var v = dotProduct(_gradients[_grid[x1][y1]],dx-1,dy-1);
		
		// applying an easing function to smooth the contribution
		// closer to a grid point, higher its contribution
		var easeX = interpolate(dx);
		var easeY = interpolate(dy);
		
		var averageST = s + (t-s)*easeX;
		var averageUV = u + (v-u)*easeX;
		var noise = averageST + (averageUV-averageST)*easeY;
	
		noise *= noise<0 ?.5:1;
 
		return noise;
 }

function dotProduct(grad,x,y){
	return(x*grad[0]+y*grad[1]);
}

function interpolate(val){
	return(6*val*val*val*val*val-15*val*val*val*val+10*val*val*val);
}

//MOVEMENTS
function move(){
	var nowTime = new Date().getTime();
	var elapsedTime = nowTime - _lastTime;
	
	var frontSpeed = 0.0;
	var sideSpeed = 0.0;
	var timeNow = new Date().getTime();	
	
	if(_up === true){frontSpeed +=0.001; }
	if(_down === true){frontSpeed -=0.001; }
	
	if(_left === true){
		if(_mouseDown===true){
			sideSpeed -=0.001; 
		}else{
			_camera.theta = (_camera.theta+0.0025*elapsedTime)%6.28;
		}
	}
	if(_right === true){
		if(_mouseDown===true){
			sideSpeed +=0.001; 
		}else{
			_camera.theta = (_camera.theta-0.0025*elapsedTime)%6.28;
		}
	}
	
	var cosT = Math.cos(_camera.theta);
	var sinT = Math.sin(_camera.theta);
	
	//rotation around Y
	_camera.pos[0] += (sinT*frontSpeed - cosT*sideSpeed)*elapsedTime;
	_camera.pos[2] += (cosT*frontSpeed + sinT*sideSpeed)*elapsedTime;
	
	var targetY = detectGround(_camera.pos[0],_camera.pos[2]);
	if(_onGround==true){
		_camera.pos[1] += (targetY-_camera.pos[1])*.2;
	}else{
		_camera.pos[1] += _jump*elapsedTime;
		_jump -= 0.00001*elapsedTime;
		if(_camera.pos[1]-targetY < 0.0001){
			_onGround = true ;
			_camera.pos[1] = targetY;
		}
	}
	
	var cosP = Math.cos(_camera.phi);
	var sinP = Math.sin(_camera.phi);
	
	//rotation along X then along Y, then translation
	_camera.lookAt[0] = sinT*cosP*5.0 + _camera.pos[0];
	_camera.lookAt[1] = -sinP*5.0 + _camera.pos[1];
	_camera.lookAt[2] = cosT*cosP*5.0 + _camera.pos[2];
	
	updateCamera();
	
	_lastTime = nowTime;
	requestAnimationFrame(move);
}

//CAMERA
function updateCamera() {
		_uViewMatrix = lookAt(_camera.pos, 
													_camera.lookAt, 
													vec3(0.0, 1.0, 0.0));
		gl.uniformMatrix4fv(_uViewMatrixLoc, false, flatten(_uViewMatrix));
		render();
}

function detectGround(posX, posZ){
	var indexX = (((posX/_scale[0])+1)*_meshSize*.5)>>0;
	var indexZ = (((posZ/_scale[2])+1)*_meshSize*.5)>>0;
	if(indexX>-1 && indexZ>-1 && indexX<_meshSize && indexZ<_meshSize){
		return(_vertices[indexX*_meshSize+indexZ][1]*_scale[1]+.5);
	}
	return(0.2);
}

//RENDER
function render() {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, _posBuffer);
		gl.vertexAttribPointer(_aPosition, 3, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, _indexBuffer);
		gl.drawElements(gl.TRIANGLE_STRIP, _indexLength, gl.UNSIGNED_SHORT, 0);
}

//CLASSES