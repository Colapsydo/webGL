var gl
var verticesNum;

window.onload = function init() {
		var canvas = document.getElementById("gl-canvas");

		gl = WebGLUtils.setupWebGL(canvas);
		if (!gl) {
				alert("WebGL isn't available");
		}

		var recursion = 7;
		var vertices = [-.9, -.9, 0, .9, .9, -0.9];	
		
		while (recursion > 0) {
				vertices = division(vertices);
				recursion--;
		}
	
		verticesNum = Math.floor(vertices.length*.5);

		//  Configure WebGL

		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.clearColor(0.0, 0.0, 0.0, 1.0);

		//  Load shaders and initialize attribute buffers

		var program = initShaders(gl, "vertex-shader", "fragment-shader");
		gl.useProgram(program);

		// Load the data into the GPU

		var bufferId = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

		// Associate out shader variables with our data buffer

		var vPosition = gl.getAttribLocation(program, "vPosition");
		gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(vPosition);

		render();
};

function division(vertices) {
		var length = vertices.length;
		var point1, point2, point3,
				middle1, middle2, middle3;
		var result = [];
		
	for (var i = 0; i < length; i += 6) {
				point1 = {
						x: vertices[i],
						y: vertices[i + 1]
				};
				point2 = {
						x: vertices[i + 2],
						y: vertices[i + 3]
				};
				point3 = {
						x: vertices[i + 4],
						y: vertices[i + 5]
				};
				middle1 = middle(point1, point2);
				middle2 = middle(point1, point3);
				middle3 = middle(point2, point3);
	result.push(point1.x,point1.y,middle1.x,middle1.y,middle2.x,middle2.y,point2.x,point2.y,middle1.x,middle1.y,middle3.x,middle3.y,point3.x,point3.y,middle2.x,middle2.y,middle3.x,middle3.y);
		}
		return (result);
}

function middle(pt1, pt2) {
		return ({
				x: (pt1.x + pt2.x) * .5,
				y: (pt1.y + pt2.y) * .5
		});
}

function render() {
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLES, 0, verticesNum);
}