// Animation states:
var ANM_ST_STOPPED = 0;
var ANM_ST_PLAYING = 1;
var ANM_ST_LOOPING = 2;
var ANM_ST_PAUSED = 3;

// Animation class constructor
var Animation = function(image, frameDelay, frameW, frameH) {
  this.image = image;
  this.frameWidth = frameW;
  this.frameHeight = frameH;
  this.frameCount = 0;
  if (image) {
    this.frameCount = Math.floor(getImageWidth(image) / frameW);
  }
  this.currentFrame = 0;
  this.frameDelay = frameDelay;
  this.state = new StateMachine(ANM_ST_STOPPED);
  this.frameTimer = new Timer();
}

// Renders the current animation frame at the given coordinates
Animation.prototype.render = function (x, y, hflip, vflip) {
  drawImageCropped(this.image,
    this.currentFrame * this.frameWidth,
    0,
    this.frameWidth,
    this.frameHeight,
    x,
    y,
    this.frameWidth,
    this.frameHeight,
    hflip,
    vflip);
};

// Renders the animation frame at the given progress
Animation.prototype.renderProgress = function (x, y, progress, hflip, vflip) {
  var frameNum = Math.floor(progress * this.frameCount);
  drawImageCropped(this.image,
    frameNum * this.frameWidth,
    0,
    this.frameWidth,
    this.frameHeight,
    x,
    y,
    this.frameWidth,
    this.frameHeight,
    hflip,
    vflip);
};

// Starts the animation with the given delay between frames
Animation.prototype.start = function (frameDelay) {
  this.state.setState(ANM_ST_PLAYING);
  if (frameDelay)
    this.frameDelay = frameDelay;
  this.frameTimer.start(this.frameDelay);
};

// Starts looping the animation with the given delay between frames
Animation.prototype.start = function (frameDelay) {
  this.state.setState(ANM_ST_LOOPING);
  if (frameDelay)
    this.frameDelay = frameDelay;
  this.frameTimer.start(this.frameDelay);
};

// Stops the animation
Animation.prototype.stop = function () {
  this.state.setState(ANM_ST_STOPPED);
  this.currentFrame = 0;
};

// Pauses the animation
Animation.prototype.pause = function () {
  this.state.setState(ANM_ST_PAUSED);
};

// Checks if the animation is playing
Animation.prototype.isPlaying = function () {
  var currentState = this.state.getState();
  return (currentState == ANM_ST_PLAYING) || (currentState == ANM_ST_LOOPING);
};

// Updates the animation
Animation.prototype.update = function () {
  var currentState = this.state.getState();
  if (currentState == ANM_ST_PLAYING || currentState == ANM_ST_LOOPING) {
    if (this.frameTimer.isTimeUp()) {
      this.currentFrame = this.currentFrame + 1;
      if (currentFrame >= this.frameCount) {
        if (currentState == ANM_ST_PLAYING) {
          // playing state
          this.state.setState(ANM_ST_STOPPED);
          this.frameTimer.stop();
        } else {
          // looping state
          this.currentFrame -= this.frameCount;
          this.frameTimer.reset();
        }
      }
    }
  }
};
