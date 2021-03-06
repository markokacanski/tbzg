// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel

(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());


// Get the canvas
var canvas = document.getElementById('myCanvas');
var context = canvas.getContext('2d');
// Use the whole window area for drawing
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Adjust the canvas size on resize
function onWindowResize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  simulation.camera.width = canvas.width;
  simulation.camera.height = canvas.height;
  if (simulation)
    simulation.onWindowResize();
}
window.addEventListener("resize", onWindowResize, false);

// Clear the screen with black color
function clearScreen() {
	drawRect(0, 0, canvas.width, canvas.height, '#000000');
}

// Render everything
function render() {
  simulation.render();
}

// Update everything
function update() {
  simulation.update();
}

// Draws the loading screen
function drawLoadingScreen() {
  if (simulation) {
    drawProgressBar(canvas.width / 2 - 100, canvas.height / 2 - 8, 200, 16, simulation.resourceManager.getProgress(), "#888888");
    drawRectOutline(canvas.width / 2 - 100, canvas.height / 2 - 8, 200, 16, 1, "#888888")
  }
}

// Draw the loading screen before any map generation
clearScreen();
drawLoadingScreen();

// Create a simulation instance
var simulation = new Simulation();

// FPS counter
var fps = {
  current: 0,
  last: 0,
  lastUpdated: Date.now(),
  update: function() {
		fps.current++;
		if (Date.now() - fps.lastUpdated >= 1000) {
        fps.last = fps.current;
        fps.current = 0;
        fps.lastUpdated = Date.now();
    }
	}
};

// Main loop
function main() {
  requestAnimationFrame(main);

  if (simulation.resourceManager.loaded()) {
    update();
    fps.update();

  	clearScreen();
    render();
    debugText(0, 0, "FPS: " + fps.last);
  } else {
    clearScreen();
    drawLoadingScreen();
  }
}

// Initial main() call
main();
