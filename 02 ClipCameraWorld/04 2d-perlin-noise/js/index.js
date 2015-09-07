var _canvas;
var _context;

var _gradients;
var _gradLength;
var _grid;

window.onload = function init() {
	_canvas = document.getElementById("canvas");
	_context = _canvas.getContext("2d");
	
	defineGradients();
	drawNoise();
}

function drawNoise(){
	var perlinNoise = getPerlinNoiseData(canvas.width, canvas.height,1,2,5,.7);
	var color;
	for(var i=0; i<perlinNoise.length; ++i){
		for(var j=0; j<perlinNoise[i].length; ++j){
			//color = parseInt((1/perlinNoise[i][j]) * 12.75);
			color = parseInt(perlinNoise[i][j] * 255);
			_context.fillStyle = "rgb(" + color + "," + color + "," + color + ")";
			_context.fillRect(i, j, 1, 1);
		}
	}
	
	//requestAnimationFrame(drawNoise);
}

function defineGradients(){
	var angle=0.0;
	var step = 6.28/32;
	_gradients = [];
	while(angle<6.28){
		//random gradients along the unit circle
		_gradients.push([Math.cos(angle),Math.sin(angle)]);
		angle+=Math.random()*step;
	}
	_gradLength = _gradients.length;
}

function getPerlinNoiseData(width, height, freqX, freqY, octave, persistence){
	var freqsX = [];
	var freqsY = [];
	var ocStep = []; 
	var persistences = [];
	
	for(var p=0; p<octave;++p){
		if(p>0){
			freqX*=2;
			freqY*=2;
			persistence*=persistence;
			persistences.push(persistence);
		}else{
			persistences.push(1);
		}
		freqsX.push(freqX);
		freqsY.push(freqY);
		persistences.push(persistence);
		ocStep.push(Math.pow(2,octave-(p+1)));
	}
	
	if(_grid==undefined){
		//Creation of gradient grid
		_grid = createPerlinGrid(freqX+1, freqY+1);
	}else{
		updateGrid();
	}
	
	//Creation of perlin noise for each pixel of the canvas
	var perlinNoise = [];
	var total;
	var stepX;
	var stepY;
	for(var i=0; i<width; ++i){
		var column=[];
		for(var j=0; j<height; ++j){
			total=0.0;
			for(var k=0; k<octave;++k){
				stepX = width/freqsX[k];
				stepY = width/freqsY[k];
				total += persistences[k]*noise(i/stepX,j/stepY,ocStep[k]);
			}
			column.push(total);
		}
		perlinNoise.push(column);
	}
	
	return(perlinNoise)
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

function updateGrid(){
	for(var i=0; i <_grid.length;++i){
		for(var j=0; j<_grid[i].length; ++j){
			_grid[i][j] = (_grid[i][j]+2)%_gradLength;
		}
	}
}

function noise(x, y, ocStep) { //defining noise value at noise point (x,y)
 
    // grid cell coordinates
    var x0 = x>>0;
		var x1 = x0+1;
    var y0 = y>>0;
		var y1 = y0+1;
	
		// position of point into cell
		var dx  = x-x0;
		var dy = y-y0
		
		x0*=ocStep;
		x1*=ocStep;
		y0*=ocStep;
		y1*=ocStep;
	
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
	
		noise *= noise<0 ? -1 : 1;
 
		return noise;
 }

function dotProduct(grad,x,y){
	return(x*grad[0]+y*grad[1]);
}

function interpolate(val){
	return(6*val*val*val*val*val-15*val*val*val*val+10*val*val*val);
}