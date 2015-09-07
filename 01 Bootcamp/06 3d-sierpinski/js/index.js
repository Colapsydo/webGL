"use strict";

var gl;
var tesselation;
var colorList;
var points;
var colors;
var animAngle = 0;
var twistLoc;
var twist;

window.onload = function init() {
		var canvas = document.getElementById("gl-canvas");

		gl = WebGLUtils.setupWebGL(canvas);
		if (!gl) {
				alert("WebGL isn't available");
		}

		colorList=[	vec3(1.0,1.0,.0),
								vec3(1.0,.4,.0),
								vec3(.8,.2,.0),
								vec3(.3,.3,.3)];
		
		var sideLength = 1.6329;
		var circleRay = sideLength * 0.5773; //sqrt(3)/3
		var stepAngle = 2*Math.PI/3;
		var angleA = Math.PI*.5;
		var angleB = angleA + stepAngle;
		var angleC = angleB + stepAngle;
		
		var vertices = [
			vec3(0.0,0.0,-1.0),
			vec3(Math.cos(angleA)*circleRay,Math.sin(angleA)*circleRay,0.8165*sideLength-1), //sqrt(6)/3
			vec3(Math.cos(angleB)*circleRay,Math.sin(angleB)*circleRay,0.8165*sideLength-1),
			vec3(Math.cos(angleC)*circleRay,Math.sin(angleC)*circleRay,0.8165*sideLength-1)
									 ];
	
		tesselation = 3;
		points=[];
		colors=[];
		twist=0.0;
	
		divideTetra(vertices[0],vertices[1],vertices[2],vertices[3],tesselation);

		//  Configure WebGL

		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.clearColor(.0, .0, .0, 1.0);
	
	 	// enable hidden-surface removal
    gl.enable(gl.DEPTH_TEST);

		//  Load shaders and initialize attribute buffers

		var program = initShaders(gl, "vertex-shader", "fragment-shader");
		gl.useProgram(program);

		// colorBuffer
		var cBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);		
		gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW); 

		// Associate out shader variables with our data buffer
		var fColor = gl.getAttribLocation(program, "fColor");
		gl.vertexAttribPointer(fColor, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(fColor);
	
		// Load the data into the GPU
		var vBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);		
		gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW); 

		// Associate out shader variables with our data buffer
		var vPosition = gl.getAttribLocation(program, "vPosition");
		gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(vPosition);
	
		twistLoc = gl.getUniformLocation(program, "twist");

		render();
};

function divideTetra(a,b,c,d,iteration){
	if(iteration===0){
		addTetra(a,b,c,d);
	}else{
		//divide Tetra in 4 new tetra
		iteration--;
		var ab = mix(a,b,.5);
		var ac = mix(a,c,.5);
		var ad = mix(a,d,.5);
		var bc = mix(b,c,.5);
		var bd = mix(b,d,.5);
		var cd = mix(c,d,.5);
		divideTetra(a,ab,ac,ad,iteration);
		divideTetra(ab,b,bc,bd,iteration);
		divideTetra(ac,bc,c,cd,iteration);
		divideTetra(ad,bd,cd,d,iteration);
		//divideTetra(ad,bd,cd,d,iteration);
	}
}

function addTetra(a,b,c,d){
	addTriangle(a,c,d,0);
	addTriangle(a,b,c,1);
	addTriangle(a,b,d,2);
	addTriangle(b,c,d,3);
}

function addTriangle(a, b, c, color) {
		points.push(a, b, c);
		colors.push(colorList[color],colorList[color],colorList[color]);
}

function render() {
		// update twist angle with a cosine easing
		animAngle = (animAngle + 0.02) % 6.28;
		twist += Math.cos(animAngle) * 0.015;
		// erase and redraw
		gl.uniform1f(twistLoc, twist);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLES, 0, points.length);

		requestAnimationFrame(render);
}