"use strict";
var gl;

window.onload = function init() {
	
	var canvas = document.getElementById("gl-canvas");

	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) {
			alert("WebGL isn't available");
	}
	
	var vertices = [
		vec3(0.0, 1.0, 1.5),
		vec3(-1.0, -1.0, 1.5),
		vec3(1.0, -1.0, 1.5)
	];
		
	// Set the viewport to the canvas width and height
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	
		// Clear the depth buffer. The value specified is clamped to the range [0,1].
	// More info about depth buffers: http://en.wikipedia.org/wiki/Depth_buffer
	gl.clearDepth(1.0);
	// Enable depth testing. This is a technique used for hidden surface removal.
	// It assigns a value (z) to each pixel that represents the distance from this
	// pixel to the viewer. When another pixel is drawn at the same location the z
	// values are compared in order to determine which pixel should be drawn.
	gl.enable(gl.DEPTH_TEST);
	// Specify which function to use for depth buffer comparisons. It compares the
	// value of the incoming pixel against the one stored in the depth buffer.
	// Possible values are (from the OpenGL documentation):
	// GL_NEVER - Never passes.
	// GL_LESS - Passes if the incoming depth value is less than the stored depth value.
	// GL_EQUAL - Passes if the incoming depth value is equal to the stored depth value.
	// GL_LEQUAL - Passes if the incoming depth value is less than or equal to the stored depth value.
	// GL_GREATER - Passes if the incoming depth value is greater than the stored depth value.
	// GL_NOTEQUAL - Passes if the incoming depth value is not equal to the stored depth value.
	// GL_GEQUAL - Passes if the incoming depth value is greater than or equal to the stored depth value.
	// GL_ALWAYS - Always passes.
	gl.depthFunc(gl.LEQUAL);
	
	// Load the vertex shader that's defined in a separate script
	// block at the top of this page.
	// More info about shaders: http://en.wikipedia.org/wiki/Shader_Model
	// More info about GLSL: http://en.wikipedia.org/wiki/GLSL
	// More info about vertex shaders: http://en.wikipedia.org/wiki/Vertex_shader

	// Grab the script element
	var vertexShaderScript = document.getElementById("vertex-shader");
	// Create a vertex shader object
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	// Load the shader with the source strings from the script element
	gl.shaderSource(vertexShader, vertexShaderScript.text);
	// Compile the shader source code string
	gl.compileShader(vertexShader);
	// Check if the shader has compiled without errors
	if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		alert("Couldn't compile the vertex shader");
		// Clean up
		gl.deleteShader(vertexShader);
		return;
	}

	// Load the fragment shader that's defined in a separate script
	// block at the top of this page.
	// More info about fragment shaders: http://en.wikipedia.org/wiki/Fragment_shader
	var fragmentShaderScript = document.getElementById("fragment-shader");
	// Create a fragment shader object
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	// Load the shader with the source strings from the script element
	gl.shaderSource(fragmentShader, fragmentShaderScript.text);
	// Compile the shader source code string
	gl.compileShader(fragmentShader);
		// Check if the shader has compiled without errors
		if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		alert("Couldn't compile the fragment shader");
		// Clean up
		gl.deleteShader(fragmentShader);
		return;
	}

	// Create a shader program. From the OpenGL documentation:
	// A program object is an object to which shader objects can be attached.
	// This provides a mechanism to specify the shader objects that will be linked to
	// create a program. It also provides a means for checking the compatibility of the
	// shaders that will be used to create a program (for instance, checking the
	// compatibility between a vertex shader and a fragment shader).
	gl.program = gl.createProgram();
	// Attach the vertex shader to the program
	gl.attachShader(gl.program, vertexShader);
	// Attach the fragment shader to the program
	gl.attachShader(gl.program, fragmentShader);
	// Before we can use the shaders for rendering, we have to link the program
	// object.
	gl.linkProgram(gl.program);
	// Check the status of the link operation to see if it was linked without
	// errors.
	if (!gl.getProgramParameter(gl.program, gl.LINK_STATUS)) {
		alert("Unable to initialise shaders");
		// Clean up
		gl.deleteProgram(gl.program);
		gl.deleteProgram(vertexShader);
		gl.deleteProgram(fragmentShader);
		return;
	}
	// Install the program as part of the current rendering state
	gl.useProgram(gl.program);

	
	// First create a vertex buffer in which we can store our data.
	var vBuffer = gl.createBuffer();
	// Bind the buffer object to the ARRAY_BUFFER target.
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);		
	// Creates a new data store for the vertices array which is bound to the ARRAY_BUFFER.
	// The third paramater indicates the usage pattern of the data store. Possible values are
	// (from the OpenGL documentation):
	// The frequency of access may be one of these:
	// STREAM - The data store contents will be modified once and used at most a few times.
	// STATIC - The data store contents will be modified once and used many times.
	// DYNAMIC - The data store contents will be modified repeatedly and used many times.
	// The nature of access may be one of these:
	// DRAW - The data store contents are modified by the application, and used as the source for
	// GL drawing and image specification commands.
	// READ - The data store contents are modified by reading data from the GL, and used to return
	// that data when queried by the application.
	// COPY - The data store contents are modified by reading data from the GL, and used as the source
	// for GL drawing and image specification commands.
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW); 
	
	
	// Get the vertexPosition attribute from the linked shader program
	var vPosition = gl.getAttribLocation(gl.program, "vertexPosition");
	// Specify the location and format of the vertex position attribute
	gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
	// Enable the vertexPosition vertex attribute array. If enabled, the array
	// will be accessed an used for rendering when calls are made to commands like
	// gl.drawArrays, gl.drawElements, etc.
	gl.enableVertexAttribArray(vPosition);	

	// Clear the color buffer and the depth buffer
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// Define the viewing frustum parameters
	// More info: http://en.wikipedia.org/wiki/Viewing_frustum
	// More info: http://knol.google.com/k/view-frustum
	var fieldOfView = 75.0;
	var aspectRatio = canvas.width / canvas.height;
	var nearPlane = 1.0;
	var farPlane = 10000.0;
	var top = nearPlane * Math.tan(fieldOfView * Math.PI / 360.0);
	var bottom = -top;
	var right = top * aspectRatio;
	var left = -right;

	// Create the perspective matrix. The OpenGL function that's normally used for this,
	// glFrustum() is not included in the WebGL API. That's why we have to do it manually here.
	// More info: http://www.cs.utk.edu/~vose/c-stuff/opengl/glFrustum.html
	var a = (right + left) / (right - left);
	var b = (top + bottom) / (top - bottom);
	var c = (farPlane + nearPlane) / (farPlane - nearPlane);
	var d = (2 * farPlane * nearPlane) / (farPlane - nearPlane);
	var x = (2 * nearPlane) / (right - left);
	var y = (2 * nearPlane) / (top - bottom);
	var perspectiveMatrix = [
		x, 0, a, 0,
		0, y, b, 0,
		0, 0, c, d,
		0, 0, -1, 0
	];

	// Create the modelview matrix
	// More info about the modelview matrix: http://3dengine.org/Modelview_matrix
	// More info about the identity matrix: http://en.wikipedia.org/wiki/Identity_matrix
	var modelViewMatrix = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1
	];
	
	// Get the location of the "modelViewMatrix" uniform variable from the
	// shader program
	var uModelViewMatrix = gl.getUniformLocation(gl.program, "modelViewMatrix");
	// Get the location of the "perspectiveMatrix" uniform variable from the
	// shader program
	var uPerspectiveMatrix = gl.getUniformLocation(gl.program, "perspectiveMatrix");
	// Set the values
	gl.uniformMatrix4fv(uModelViewMatrix, false, flatten(perspectiveMatrix));
	gl.uniformMatrix4fv(uPerspectiveMatrix, false, flatten(modelViewMatrix));
	
	// Draw the triangles in the vertex buffer. The first parameter specifies what
	// drawing mode to use. This can be POINTS, LINE_STRIP, LINE_LOOP, LINES, TRIANGLE_STRIP,
	// TRIANGLE_FAN and TRIANGLES
	gl.drawArrays(gl.TRIANGLES, 0, vertices.length);
	//gl.flush();
}