// Constants
var SIM_MAP_WIDTH = 64;
var SIM_MAP_HEIGHT = 64;
var SIM_MAP_FIELD_SIZE = 32;

var ST_MV_PLAYER = 0;
var ST_MV_AI = 1;

var VISIBILITY_RANGE = 15;

// Tile colors
var tile_colors = [];
tile_colors[TILE_INTERIOR] = '#FFFFFF';
tile_colors[TILE_WALL] = '#7d0000';
tile_colors[TILE_ROAD] = '#888888';
tile_colors[TILE_PAVEMENT] = '#BBBBBB';
tile_colors[TILE_GRASS] = '#00BB00';
tile_colors[TILE_HEDGE] = '#008800';

var canvas = document.getElementById('myCanvas');

// Simulation class constructor
var Simulation = function() {
  this.resourceManager = new ResourceManager();
  this.loadResources();

  this.map = new TileMapGen(SIM_MAP_WIDTH, SIM_MAP_HEIGHT);
  this.map.generateMap();
  this.turnState = new StateMachine(ST_MV_PLAYER);
  this.camera = new Rect2d(0, 0, canvas.width, canvas.height);
  this.mapFieldSize = SIM_MAP_FIELD_SIZE;
  this.input = new Input();
  this.input.addHandler(inputHandler, this);
  this.turnNumber = 0;

  this.player = null;
  this.enemies = [];
  this.createPlayer(this.findFreeField(new Vector2d(Math.floor(SIM_MAP_WIDTH / 2), Math.floor(SIM_MAP_HEIGHT / 2))));
  this.createRandomEnemies(20);
  this.player.takeTurn();

  this.visibilityMap = create2dArray(SIM_MAP_WIDTH, SIM_MAP_HEIGHT);
  for (var i = 0; i < SIM_MAP_WIDTH; i++) {
    for (var j = 0; j < SIM_MAP_HEIGHT; j++) {
      this.visibilityMap[i][j] = 1.0;
    }
  }

  this.cameraFocus(this.player.getWorldPosition());
  this.updateVisibilityMap();
}

// Main input handler
function inputHandler(input, sim) {
  switch (input) {
  case INPUT_LEFT:
    sim.player.walkAttack(CHR_DIR_LEFT);
    break;
  case INPUT_UP:
    sim.player.walkAttack(CHR_DIR_UP);
    break;
  case INPUT_RIGHT:
    sim.player.walkAttack(CHR_DIR_RIGHT);
    break;
  case INPUT_DOWN:
    sim.player.walkAttack(CHR_DIR_DOWN);
    break;
  case INPUT_SKIP:
    sim.player.doNothing();
    break;
  }
}

// Update the simulation
Simulation.prototype.update = function () {
  if (!this.tileset)
    this.tileset = new Tileset(this.resourceManager.getResource("tileset"), 32, 32);

  this.player.update();
  this.cameraFocus(this.player.getWorldPosition());
  this.updateEnemies();

  if (this.turnState.getState() == ST_MV_PLAYER) {
    if (this.player.isTurnFinished()) {
      this.turnState.setState(ST_MV_AI);
      //console.log("(" + this.turnNumber + ") AI turn");
      if (this.enemiesTurnFinished()) {
        this.enemiesTakeTurn();
        this.turnNumber++;
      }
    }
  } else if (this.turnState.getState() == ST_MV_AI) {
    if (this.enemiesTurnFinished()) {
      this.turnState.setState(ST_MV_PLAYER);
      //console.log("(" + this.turnNumber + ") Player turn");
      if (this.player.isTurnFinished()) {
        this.updateVisibilityMap();
        this.player.takeTurn();
      }
    }
  }
}

// Render the simulation
Simulation.prototype.render = function () {
  var iStart = Math.floor(this.camera.x / SIM_MAP_FIELD_SIZE);
  var iEnd = Math.min(Math.floor((this.camera.width + this.camera.x) / SIM_MAP_FIELD_SIZE) + 1, this.map.tileMap.length);
  var jStart = Math.floor(this.camera.y / SIM_MAP_FIELD_SIZE);
  var jEnd = Math.min(Math.floor((this.camera.height + this.camera.y) / SIM_MAP_FIELD_SIZE) + 1, this.map.tileMap[0].length);
  for (var i = iStart; i < iEnd; i++) {
    for (var j = jStart; j < jEnd; j++) {
      if (this.tileset && this.map.tileMap[i][j]) {
        this.tileset.drawTile(this.map.tileMap[i][j], new Vector2d(i * SIM_MAP_FIELD_SIZE - this.camera.x, j * SIM_MAP_FIELD_SIZE - this.camera.y));
      }
    }
  }

  this.player.render();
  this.renderEnemies();
  this.renderVisibilityMap();
};

// Update the visibility map
Simulation.prototype.updateVisibilityMap = function () {
  var iStart = Math.floor(this.camera.x / SIM_MAP_FIELD_SIZE);
  var iEnd = Math.min(Math.floor((this.camera.width + this.camera.x) / SIM_MAP_FIELD_SIZE) + 1, this.visibilityMap.length);
  var jStart = Math.floor(this.camera.y / SIM_MAP_FIELD_SIZE);
  var jEnd = Math.min(Math.floor((this.camera.height + this.camera.y) / SIM_MAP_FIELD_SIZE) + 1, this.visibilityMap[0].length);
  for (var i = iStart; i < iEnd; i++) {
    for (var j = jStart; j < jEnd; j++) {
      var target = new Vector2d(i, j);
      target.add(v2dNormalized(v2dSub(this.player.position, target)));
      if (i > this.player.position.x) {
        target.x = Math.floor(target.x);
      } else {
        target.x = Math.ceil(target.x);
      }
      if (j > this.player.position.y) {
        target.y = Math.floor(target.y);
      } else {
        target.y = Math.ceil(target.y);
      }
      if (this.testVisibility(this.player.position, target)) {
        var dx = Math.abs(i - this.player.position.x);
        var dy = Math.abs(j - this.player.position.y);
        var distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > VISIBILITY_RANGE) {
          this.visibilityMap[i][j] = 1.0;
        } else {
          this.visibilityMap[i][j] = distance / VISIBILITY_RANGE;
        }
      } else {
        this.visibilityMap[i][j] = 1.0;
      }
    }
  }
};

// Render the visibility map
Simulation.prototype.renderVisibilityMap = function () {
  var iStart = Math.floor(this.camera.x / SIM_MAP_FIELD_SIZE);
  var iEnd = Math.min(Math.floor((this.camera.width + this.camera.x) / SIM_MAP_FIELD_SIZE) + 1, this.visibilityMap.length);
  var jStart = Math.floor(this.camera.y / SIM_MAP_FIELD_SIZE);
  var jEnd = Math.min(Math.floor((this.camera.height + this.camera.y) / SIM_MAP_FIELD_SIZE) + 1, this.visibilityMap[0].length);
  for (var i = iStart; i < iEnd; i++) {
    for (var j = jStart; j < jEnd; j++) {
      //if (this.visibilityMap[i][j] < 1.0) {
        drawRect(i * SIM_MAP_FIELD_SIZE - this.camera.x,
          j * SIM_MAP_FIELD_SIZE - this.camera.y,
          SIM_MAP_FIELD_SIZE,
          SIM_MAP_FIELD_SIZE,
          "rgba(0,0,0," + this.visibilityMap[i][j] + ")");
      //}
    }
  }
};

// Checks if there is an obstacle at the given coordinates
Simulation.prototype.isObstacle = function(position) {
  var tile = this.map.getField(position.x, position.y);
  return tile == TILE_WALL || tile == TILE_HEDGE || tile == TILE_INVALID;
};

// Finds the nearest free field to the given coordinates
Simulation.prototype.findFreeField = function (position) {
  if (this.isFreeField(position)) {
    return position;
  } else {
    var result = new Vector2d(0, 0);
    for (var d = 1; d < 10; d++) {
      for (var i = 0; i < 3 + d; i++) {
        result.x = position.x - d + i;
        result.y = position.y - d;
        if (this.isFreeField(result)) {
          return result;
        }
        result.x = position.x - d + i;
        result.y = position.y + d;
        if (this.isFreeField(result)) {
          return result;
        }
      }
      for (var j = 1; j < 2 + d; j++) {
        result.x = position.x - d;
        result.y = position.y - d + j;
        if (this.isFreeField(result)) {
          return result;
        }
        result.x = position.x + d;
        result.y = position.y - d + j;
        if (this.isFreeField(result)) {
          return result;
        }
      }
    }
  }
};

// Checks if the field is free at the given coordinates (no obstacles or objects)
Simulation.prototype.isFreeField = function (position) {
  if (this.isObstacle(position))
    return false;

  if (this.player)
    if (this.player.position.x == position.x && this.player.position.y == position.y)
      return false;

  for (var i = 0; i < this.enemies.length; i++) {
    if (this.enemies[i].position.x == position.x && this.enemies[i].position.y == position.y)
      return false;
  }

  return true;
};

// Returns the enemy at the given coordinates
Simulation.prototype.getEnemyAt = function (position) {
  for (var i = 0; i < this.enemies.length; i++) {
    if (this.enemies[i].position.equals(position)) {
      return this.enemies[i];
    }
  }
  return null;
};

// Returns the character at the given coordinates
Simulation.prototype.getCharacterAt = function (position) {
  var enemy = this.getEnemyAt(position);
  if (enemy)
    return enemy;

  if (this.player.position.equals(position))
    return this.player;

  return null;
};

// Converts the given map coordinates to world coordinates
Simulation.prototype.getWorldCoords = function (position) {
  return v2dMultiply(position, this.mapFieldSize);
};

// Converts the given map coordinates to screen coordinates
Simulation.prototype.getScreenCoords = function (position) {
  return v2dSub(this.getWorldCoords(position), this.camera);
};

// Focus the camera on the given coordinates
Simulation.prototype.cameraFocus = function (position) {
  this.camera.x = position.x;
  this.camera.y = position.y;
  this.camera.x -= this.camera.width / 2;
  this.camera.y -= this.camera.height / 2;
  this.camera.x = Math.max(0, this.camera.x);
  this.camera.x = Math.min(this.map.width * this.mapFieldSize - this.camera.width, this.camera.x);
  this.camera.y = Math.max(0, this.camera.y);
  this.camera.y = Math.min(this.map.height * this.mapFieldSize - this.camera.height, this.camera.y);
  this.camera.x = Math.floor(this.camera.x);
  this.camera.y = Math.floor(this.camera.y);
};

// Returns the camera position
Simulation.prototype.getCameraPosition = function () {
  return new Vector2d(this.camera.x, this.camera.y);
};

// Checks if all enemies have finished their turns
Simulation.prototype.enemiesTurnFinished = function () {
  for (var i = 0; i < this.enemies.length; i++) {
    if (!this.enemies[i].isTurnFinished()) {
      return false;
    }
  }
  return true;
};

// Make all enemies take their turns
Simulation.prototype.enemiesTakeTurn = function () {
  for (var i = 0; i < this.enemies.length; i++) {
    this.enemies[i].takeTurn();
  }
};

// Creates a player at the given coordinates
Simulation.prototype.createPlayer = function (position) {
  this.player = new Character(this, position);
  this.player.image_left = this.resourceManager.getResource("hero_l");
  this.player.image_right = this.resourceManager.getResource("hero_r");
};

// Creates an enemy at the given coordinates
Simulation.prototype.createEnemy = function (position) {
  var newAI = new AI(this, position);
  newAI.image_left = this.resourceManager.getResource("zombie_l");
  newAI.image_right = this.resourceManager.getResource("zombie_r");
  this.enemies.push(newAI);
};

// Creates n enemies at random locations
Simulation.prototype.createRandomEnemies = function (n) {
  var position = new Vector2d(0, 0);
  for (var i = 0; i < n; i++) {
    position.x = getRandomIndex(0, SIM_MAP_WIDTH - 1);
    position.y = getRandomIndex(0, SIM_MAP_HEIGHT - 1);
    position = this.findFreeField(position);
    this.createEnemy(position);
  }
};

// Update all enemies
Simulation.prototype.updateEnemies = function () {
  for (var i = 0; i < this.enemies.length; i++) {
    this.enemies[i].update();
  }
};

// Render all enemies
Simulation.prototype.renderEnemies = function () {
  for (var i = 0; i < this.enemies.length; i++) {
    this.enemies[i].render();
  }
};

// Returns the rectangle of the given field
Simulation.prototype.getFieldRect = function (position) {
  return new Rect2d(position.x * this.mapFieldSize,
    position.y * this.mapFieldSize,
    this.mapFieldSize,
    this.mapFieldSize);
};

// Checks if the field p2 is visible from the field p1
Simulation.prototype.testVisibility = function (p1, p2) {
  var xMin = Math.min(p1.x, p2.x);
  var xMax = Math.max(p1.x, p2.x);
  var yMin = Math.min(p1.y, p2.y);
  var yMax = Math.max(p1.y, p2.y);
  var centerOffset = new Vector2d(this.mapFieldSize / 2, this.mapFieldSize / 2);
  var p1center = v2dAdd(v2dMultiply(p1, this.mapFieldSize), centerOffset);
  var p2center = v2dAdd(v2dMultiply(p2, this.mapFieldSize), centerOffset);

  for (var x = xMin; x <= xMax; x++) {
    for (var y = yMin; y <= yMax; y++) {
      if (this.isObstacle(new Vector2d(x, y))) {
        var fieldRect = this.getFieldRect(new Vector2d(x, y));
        if (lineIntersectsRect(p1center, p2center, fieldRect)) {
          return false;
        }
      }
    }
  }

  return true;
};

// Loads all the resources
Simulation.prototype.loadResources = function () {
  this.resourceManager.loadImage("images/tileset.png", "tileset");
  this.resourceManager.loadImage("images/hero_r.png", "hero_r");
  this.resourceManager.loadImage("images/hero_l.png", "hero_l");
  this.resourceManager.loadImage("images/zombie_r.png", "zombie_r");
  this.resourceManager.loadImage("images/zombie_l.png", "zombie_l");
};
