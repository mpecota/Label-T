var debugging = false;
var gravity = 980;

var PLAY_BLOCK_COLORS = [
  '#40aaef',
  '#fba848',
  '#f27398',
  '#363947',
  '#58be89',
  '#0e7ac4'
];

var LIGHT_BLUE = 0;
var ORANGE = 1;
var PINK = 2;
var DARK_BLUE = 3;
var GREEN = 4;
var BLUE = 5;

var PlayBlock = Object.create(VisualAnimationObject);
$.extend(true, PlayBlock, {
  velocity: 1,
  height: 105,
  width: 165,
  backgroundColor: '#40AAEF',
  playButtonColor: '#ffffff',
  barType: 'none',
  barSize: 30,
  barSide: 'left',
  tickSize: 5,
  bouncesLeft: 1,
  releaseTime: 0,
  totalElapsedTime: 0,
  invertedColors: false,
  smallTickSpacing: 5,
  largeTickSpacing: 7,
  initialY: 0,
  exploding: false,
  explosionFactor: 1.0,
  popping: false,
  popDuration: 0,
  opacity: 1,
  numClicks: 1,
  playButtonWidth: 16,
  playButtonHeight: 18,
  playBlocks: null,
  bowserBlock: true,
  debug: false,

  isDebug: function() {
    if (this.debug == true && window.debugging == true) {
      return true;
    }
    return false;
  },

  // #RRGGBB => [r, g, b]
  hex_to_rgb: function(hex) {
    if (hex[0] !== '#') { var hex = '#' + hex; }
    return [
      parseInt(hex.substring(1, 3), 16), 
      parseInt(hex.substring(3, 5), 16), 
      parseInt(hex.substring(5, 7), 16)
    ];   
  },

  // #RRGGBB, alpha => rgba(r,g,b,a)
  hex_to_rgba: function(hex, alpha) {
    var rgb = this.hex_to_rgb(hex).join();
    return 'rgba(' + rgb + ',' + alpha + ')'; 
  },

  bgColor: function() {
    if (this.invertedColors == true) {
      return this.playButtonColor;
    } else {
      return this.backgroundColor;
    }
  },

  pbColor: function() {
    if (this.invertedColors == true) {
      return this.backgroundColor;
    } else {
      return this.playButtonColor;
    }
  },

  draw: function(dt, ctx) {
    ctx.save();

    ctx.scale(this.explosionFactor, this.explosionFactor);
    if (this.exploding) {
      ctx.translate((this.x * (1 / this.explosionFactor)), (this.y * (1 / this.explosionFactor)));
      ctx.translate((this.width / 2) * (1 / this.explosionFactor) * (1 - this.explosionFactor), (this.height / 2) * (1 / this.explosionFactor) * (1 - this.explosionFactor));
    } else {
      ctx.translate(this.x, this.y);
    }

    // draw background rectangle
    if (this.opacity < 1) {
      ctx.fillStyle = this.hex_to_rgba('#ffffff', this.opacity);
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    } else {
      ctx.fillStyle = this.hex_to_rgba(this.bgColor(), this.opacity);
      ctx.fillRect(0, 0, this.width, this.height);

      // draw play button
      var playButtonWidth = this.playButtonWidth;
      var playButtonHeight = this.playButtonHeight;
      var playButtonCenterX = (this.width / 2);
      var playButtonCenterY = (this.height / 2);

      if (this.barType == 'normal' || this.barType == 'play') {
        if (this.barSide == 'top') {
          // Adjust the center of the play button
          playButtonCenterY += this.barSize / 2;

          // draw sidebar
          ctx.drawImage(this.barCanvas, 0, 0);
        } else if (this.barSide == 'right') {
          // Adjust the center of the play button
          playButtonCenterX -= this.barSize / 2;

          // draw sidebar
          ctx.drawImage(this.barCanvas, this.width - this.barSize, 0);
        } else if (this.barSide == 'bottom') {
          // Adjust the center of the play button
          playButtonCenterY -= this.barSize / 2;

          // draw sidebar
          ctx.drawImage(this.barCanvas, 0, this.height - this.barSize);
        } else if (this.barSide == 'left') {
          // Adjust the center of the play button
          playButtonCenterX += this.barSize / 2;

          // draw sidebar
          ctx.drawImage(this.barCanvas, 0, 0);
        }
      } else if (this.barType == 'button') {
        ctx.fillStyle = this.pbColor();
        var buttonX = this.width - this.largeTickSpacing - 30;
        var buttonY = this.largeTickSpacing;
        ctx.fillRect(buttonX, buttonY, 30, 7);
      }

      ctx.fillStyle = this.pbColor();
      ctx.beginPath();
      ctx.moveTo(playButtonCenterX - (playButtonWidth / 2), playButtonCenterY - (playButtonHeight / 2));
      ctx.lineTo(playButtonCenterX + (playButtonWidth / 2), playButtonCenterY);
      ctx.lineTo(playButtonCenterX - (playButtonWidth / 2), playButtonCenterY + (playButtonHeight / 2));
      ctx.fill();
      ctx.restore();
    }
  },

  update: function(dt, ctx) {

    /*
    if (this.isDebug()) {
      console.log('x: ' + this.x);
      console.log('y: ' + this.y);
      console.log('width: ' + this.width);
      console.log('height: ' + this.height);
    }
    */

    this.totalElapsedTime += dt;

    if (this.releaseTime < this.totalElapsedTime) {
      if (this.popping) {
        this.popDuration += dt;
        var popFactor = 1 - this.explosionFactor;
        this.explosionFactor += 0.06 * popFactor;

        if (this.popDuration > 0.1) {
          this.opacity = 0.45 - (this.popDuration - 0.1);
        }

        if (this.popDuration > 0.5) {
          // Make the play button go away
          this.stopVisualAnimationObject();
          var pbIndex = $.inArray(this, this.playBlocks);
          this.playBlocks.splice(pbIndex, 1);

          if (this.playBlocks.length == 0 && this.bowserBlock == true) {
            startBowserBlock();
          }
        }
      } else if (this.exploding) {
        this.explosionFactor -= 0.04 * this.explosionFactor * this.explosionFactor * this.explosionFactor;
        if (this.explosionFactor < 0) { this.explosionFactor = 0; }
      } else {
        this.y += Math.ceil(this.velocity * dt);
        this.velocity += gravity * dt;

        if (this.y >= this.am.stage.height() - this.height) {
          this.bounceIfNecessary();
          this.y = this.am.stage.height() - this.height;
        }

        for (var i = 0; i < this.playBlocks.length; i++) {
          var otherPlayBlock = this.playBlocks[i];

          if (this !== otherPlayBlock) {
            if (this.collidesWith(otherPlayBlock)) {

              if (this.isDebug() && otherPlayBlock.isDebug()) {
                console.log('this.collidesWith(otherPlayBlock): true');
                console.log('x: ' + this.x);
                console.log('y: ' + this.y);
                console.log('width: ' + this.width);
                console.log('height: ' + this.height);
                console.log('otherPlayBlock.x: ' + otherPlayBlock.x);
                console.log('otherPlayBlock.y: ' + otherPlayBlock.y);
                console.log('otherPlayBlock.width: ' + otherPlayBlock.width);
                console.log('otherPlayBlock.height: ' + otherPlayBlock.height);
              }

              if (otherPlayBlock.velocity == 0) {
                this.bounceIfNecessary();
                if (this.initialY < otherPlayBlock.initialY) { this.y = otherPlayBlock.y - this.height; }
              } else if (otherPlayBlock.velocity < 0) {
                this.velocity = otherPlayBlock.velocity;
                otherPlayBlock.velocity = 0;
                this.bouncesLeft -= 1;
                if (this.initialY < otherPlayBlock.initialY) { this.y = otherPlayBlock.y - this.height; }
              } else if (this.velocity > 0 && otherPlayBlock.velocity > 0 && otherPlayBlock.velocity < this.velocity) {
                otherPlayBlock.velocity = this.velocity;
                this.velocity = 0;
                otherPlayBlock.bouncesLeft -= 1;
                this.bouncesLeft -= 1;
                if (this.initialY < otherPlayBlock.initialY) { this.y = otherPlayBlock.y - this.height; }
              }
            }
          }
        }
      }
    }
  },

  bounceIfNecessary: function() {
    if (this.bouncesLeft > 0) {
      this.velocity = 0 - 300;
      this.bouncesLeft -= 1;
    } else {
      this.velocity = 0;
    }
  },

  startPlayBlock: function() {
    this.preDrawSideBar();
    this.initialY = this.y;

    this.startVisualAnimationObject(this.am, this.image, this.x, this.y, 1);
  },

  preDrawSideBar: function() {
    if (this.barType == 'normal') {
      this.barCanvas = document.createElement('canvas');
      this.barCanvasCtx = this.barCanvas.getContext('2d');

      var bctx = this.barCanvasCtx;

      if (this.barSide == 'top' || this.barSide == 'bottom') {
        // Set sidebar canvas dimensions
        this.barCanvas.width = this.width;
        this.barCanvas.height = this.barSize;

        bctx.fillStyle = this.pbColor();

        // Draw sidebar bg
        bctx.fillRect(0, 0, this.barCanvas.width, this.barCanvas.height);
        bctx.fillStyle = this.bgColor();

        // Draw ticks
        var numTicks = Math.floor((this.width - this.smallTickSpacing) / (this.tickSize + this.smallTickSpacing));

        for (var i = 0; i < numTicks; i++) {
          var tickX = this.smallTickSpacing + ((this.tickSize + this.smallTickSpacing) * i);
          var tickY = this.largeTickSpacing;
          var tickWidth = this.tickSize;
          var tickHeight = this.barSize - (2 * this.largeTickSpacing);

          bctx.fillRect(tickX, tickY, tickWidth, tickHeight);
        }
      } else if (this.barSide == 'left' || this.barSide == 'right') {
        // Set sidebar canvas dimensions
        this.barCanvas.width = this.barSize;
        this.barCanvas.height = this.height;

        bctx.fillStyle = this.pbColor();

        // Draw sidebar bg
        bctx.fillRect(0, 0, this.barCanvas.width, this.barCanvas.height);
        bctx.fillStyle = this.bgColor();

        // Draw ticks
        var numTicks = Math.floor((this.height - this.smallTickSpacing) / (this.tickSize + this.smallTickSpacing));

        for (var i = 0; i < numTicks; i++) {
          var tickX = this.largeTickSpacing;
          var tickY = this.smallTickSpacing + ((this.tickSize + this.smallTickSpacing) * i);
          var tickWidth = this.barSize - (2 * this.largeTickSpacing);
          var tickHeight = this.tickSize;

          bctx.fillRect(tickX, tickY, tickWidth, tickHeight);
        }
      }
    } else if (this.barType == 'play') {
      this.barCanvas = document.createElement('canvas');
      this.barCanvasCtx = this.barCanvas.getContext('2d');

      var bctx = this.barCanvasCtx;

      if (this.barSide == 'top' || this.barSide == 'bottom') {
        // Set sidebar canvas dimensions
        this.barCanvas.width = this.width;
        this.barCanvas.height = this.barSize;

        bctx.fillStyle = this.pbColor();

        // Draw sidebar bg
        bctx.fillRect(0, 0, this.barCanvas.width, this.barCanvas.height);
        bctx.fillStyle = this.bgColor();

        // Draw ticks
        // Draw first tick
        var firstTickX = this.smallTickSpacing;
        var firstTickY = this.smallTickSpacing;
        var firstTickWidth = this.tickSize;
        var firstTickHeight = this.barSize - (2 * this.smallTickSpacing);

        bctx.fillRect(firstTickX, firstTickY, firstTickWidth, firstTickHeight);

        // Draw last tick
        var lastTickX = this.width - this.smallTickSpacing - this.tickSize;
        var lastTickY = this.smallTickSpacing;
        var lastTickWidth = this.tickSize;
        var lastTickHeight = this.barSize - (2 * this.smallTickSpacing);

        bctx.fillRect(lastTickX, lastTickY, lastTickWidth, lastTickHeight);

        // Draw middle bar
        var middleTickX = firstTickX + this.tickSize + this.smallTickSpacing;
        var middleTickY = this.smallTickSpacing;
        var middleTickWidth = lastTickX - this.smallTickSpacing - middleTickX;
        var middleTickHeight = this.barSize - (2 * this.smallTickSpacing);

        bctx.fillRect(middleTickX, middleTickY, middleTickWidth, middleTickHeight);
      }
    }
  },

  collidesWith: function(otherPlayBlock) {
    var overlapX = false;
    var overlapY = false;

    if (this.x == otherPlayBlock.x && this.y == otherPlayBlock.y) {
      return true;
    }

    if (this.x == otherPlayBlock.x) {
      overlapX = true;
    } else if (this.x < otherPlayBlock.x && this.x + this.width > otherPlayBlock.x) {
      overlapX = true;
    } else if (this.x > otherPlayBlock.x && otherPlayBlock.x + otherPlayBlock.width > this.x) {
      overlapX = true;
    }

    if (this.y < otherPlayBlock.y && this.y + this.height > otherPlayBlock.y) {
      overlapY = true;
    } else if (this.y > otherPlayBlock.y && otherPlayBlock.y + otherPlayBlock.height > this.y) {
      overlapY = true;
    }

    return overlapX && overlapY;
  },

  isInside: function(xPos, yPos) {
    if (xPos > this.x &&
        xPos < this.x + this.width &&
        yPos > this.y &&
        yPos < this.y + this.height) {
          return true;
        }

    return false;
  }
});


var BowserBlock = Object.create(PlayBlock);
$.extend(true, BowserBlock, {
  height: 300,
  width: 480,
  xVelocity: 0,
  textShaken: false,
  bouncesInPlace: 0,
  holdUntil: 0,
  numClicks: 10,
  playButtonWidth: 48,
  playButtonHeight: 54,
  finalJump: false,

  update: function(dt, ctx) {
    this.totalElapsedTime += dt;

    if (this.numFlashes > 0) {
      this.numFlashes -= 1;

      if (this.invertedColors == true) {
        this.invertedColors = false;
      } else {
        this.invertedColors = true;
      }
    }

    if (this.popping && !this.finalJump) {
      this.finalJump = true;
      this.xVelocity = 200;
      this.velocity = -800;
    } else if (this.popping) {
      this.y += Math.ceil(this.velocity * dt);
      this.x += Math.ceil(this.xVelocity * dt);
      this.velocity += gravity * dt;

      if (this.y > this.am.canvas.height) {
        // Make the play button go away
        this.stopVisualAnimationObject();
        var pbIndex = $.inArray(this, this.playBlocks);
        this.playBlocks.splice(pbIndex, 1);

        if (this.playBlocks.length == 0) {
          $('#boss_bg').hide();
          startPlayBlocks();
        }
      }
    } else {
      if (this.totalElapsedTime > this.holdUntil) {
        this.y += Math.ceil(this.velocity * dt);
        this.x += Math.ceil(this.xVelocity * dt);
        this.velocity += gravity * dt;

        if (this.y >= am.stage.height() - this.height) {
          if (this.bouncesInPlace > 0) {
            this.xVelocity = 0;
            this.bouncesInPlace -= 1;

            if (this.bouncesInPlace == 0) {
              this.holdUntil = this.totalElapsedTime + 0.3;
              this.velocity = 0 - Math.random() * 700;
            } else {
              this.holdUntil = this.totalElapsedTime + 0.2;
              this.velocity = -500;
            }
          } else {
            this.velocity = 0 - Math.random() * 700;
            this.xVelocity = 250 - Math.random() * 500;
          }

          this.y = am.stage.height() - this.height;

          if (this.textShaken == false) {
            $('#splash_text').effect('shake', { times: 1, direction: 'up', distance: 10 }, 5, function() {
              $('#splash_text').effect('shake', { times: 1, direction: 'up', distance: 8 }, 5, function() {
                $('#splash_text').effect('shake', { times: 1, direction: 'up', distance: 6 }, 5, function() {
                  $('#splash_text').effect('shake', { times: 1, direction: 'up', distance: 4 }, 5, function() {
                    $('#splash_text').effect('shake', { times: 1, direction: 'up', distance: 2 }, 5);
                  });
                });
              });
            });

            this.textShaken = true;
            this.velocity = -500;
            this.xVelocity = 0;
            this.bouncesInPlace = 3;
            this.holdUntil = this.totalElapsedTime + 0.5;
          }

          if (this.velocity < -600 && this.textShaken == true) {
            this.textShaken = false;
          }
        }

        if (this.x < 0) {
          this.x = 0;
          this.xVelocity = Math.random() * 250;
        } else if (this.x + this.width > am.canvas.width) {
          this.x = am.canvas.width - this.width;
          this.xVelocity = 0 - Math.random() * 250;
        }
      }
    }
  },
});


function startBowserBlock() {
  $('#boss_bg').fadeIn(1000, function() {
    var bowserBlock = Object.create(BowserBlock);
    bowserBlock.x = 100;
    bowserBlock.y = -300;
    bowserBlock.am = am;
    bowserBlock.playBlocks = playBlocks;
    bowserBlock.startPlayBlock();
    playBlocks.push(bowserBlock);
  });
}

function startPlayBlocks() {
  var totalStageWidth = $('#home_animation').width();
  var i = 0;
  var PATTERN_WIDTH = 1401;
  var patternOffset = 0;
  var rightPatternOffset = 0;

  if (totalStageWidth < PATTERN_WIDTH) {
    patternOffset = (totalStageWidth - PATTERN_WIDTH) / 2;
  } else if (totalStageWidth > PATTERN_WIDTH) {
    rightPatternOffset = totalStageWidth - PATTERN_WIDTH;
  }

  var pb1 = Object.create(PlayBlock);
  pb1.x = 0 + (i * PATTERN_WIDTH) + patternOffset;
  pb1.y = -38;
  pb1.width = 47;
  pb1.height = 38;
  pb1.backgroundColor = PLAY_BLOCK_COLORS[GREEN];
  pb1.am = am;
  pb1.playBlocks = playBlocks;
  //pb1.debug = true;
  pb1.startPlayBlock();
  playBlocks.push(pb1);

  var pb2 = Object.create(PlayBlock);
  pb2.x = 0 + (i * PATTERN_WIDTH) + patternOffset;
  pb2.y = -76;
  pb2.width = 47;
  pb2.height = 38;
  pb2.backgroundColor = PLAY_BLOCK_COLORS[PINK];
  pb2.releaseTime = 0.05;
  pb2.am = am;
  pb2.playBlocks = playBlocks;
  //pb2.debug = true;
  pb2.startPlayBlock();
  playBlocks.push(pb2);

  var pb3 = Object.create(PlayBlock);
  pb3.x = 47 + (i * PATTERN_WIDTH) + patternOffset;
  pb3.y = -76;
  pb3.width = 44;
  pb3.height = 76;
  pb3.backgroundColor = PLAY_BLOCK_COLORS[DARK_BLUE];
  pb3.releaseTime = 0.08;
  pb3.am = am;
  pb3.playBlocks = playBlocks;  
  pb3.startPlayBlock();
  playBlocks.push(pb3);

  var pb4 = Object.create(PlayBlock);
  pb4.x = 0 + (i * PATTERN_WIDTH) + patternOffset;
  pb4.y = -127;
  pb4.width = 91;
  pb4.height = 61;
  pb4.barSize = 15;
  pb4.barType = 'play';
  pb4.barSide = 'bottom';
  pb4.releaseTime = 0.12;
  pb4.backgroundColor = PLAY_BLOCK_COLORS[LIGHT_BLUE];
  pb4.am = am;
  pb4.playBlocks = playBlocks;  
  pb4.startPlayBlock();
  playBlocks.push(pb4);

  var pb5 = Object.create(PlayBlock);
  pb5.x = 0 + (i * PATTERN_WIDTH) + patternOffset;
  pb5.y = -226;
  pb5.width = 91;
  pb5.height = 88;
  pb5.releaseTime = 0.25;
  pb5.backgroundColor = PLAY_BLOCK_COLORS[DARK_BLUE];
  pb5.am = am;
  pb5.playBlocks = playBlocks;  
  pb5.startPlayBlock();
  playBlocks.push(pb5);

  var pb6 = Object.create(PlayBlock);
  pb6.x = 0 + (i * PATTERN_WIDTH) + patternOffset;
  pb6.y = -262;
  pb6.width = 47;
  pb6.height = 36;
  pb6.releaseTime = 0.29;
  pb6.backgroundColor = PLAY_BLOCK_COLORS[ORANGE];
  pb6.am = am;
  pb6.playBlocks = playBlocks;  
  pb6.startPlayBlock();
  playBlocks.push(pb6);

  var pb7 = Object.create(PlayBlock);
  pb7.x = 47 + (i * PATTERN_WIDTH) + patternOffset;
  pb7.y = -262;
  pb7.width = 44;
  pb7.height = 69;
  pb7.releaseTime = 0.39;
  pb7.backgroundColor = PLAY_BLOCK_COLORS[LIGHT_BLUE];
  pb7.am = am;
  pb7.playBlocks = playBlocks;  
  pb7.startPlayBlock();
  playBlocks.push(pb7);

  //////////////////////////
  // END OF SECTION 1 //////
  //////////////////////////

  var pb8 = Object.create(PlayBlock);
  pb8.x = 91 + (i * PATTERN_WIDTH) + patternOffset;
  pb8.y = -148;
  pb8.width = 45;
  pb8.height = 148;
  pb8.backgroundColor = PLAY_BLOCK_COLORS[PINK];
  pb8.am = am;
  pb8.playBlocks = playBlocks;  
  pb8.startPlayBlock();
  playBlocks.push(pb8);

  var pb9 = Object.create(PlayBlock);
  pb9.x = 136 + (i * PATTERN_WIDTH) + patternOffset;
  pb9.y = -70;
  pb9.width = 104;
  pb9.height = 70;
  pb9.backgroundColor = PLAY_BLOCK_COLORS[GREEN];
  pb9.barType = 'button';
  pb9.releaseTime = 0.03;
  pb9.am = am;
  pb9.playBlocks = playBlocks;  
  pb9.startPlayBlock();
  playBlocks.push(pb9);

  var pb10 = Object.create(PlayBlock);
  pb10.x = 136 + (i * PATTERN_WIDTH) + patternOffset;
  pb10.y = -148;
  pb10.width = 104;
  pb10.height = 78;
  pb10.backgroundColor = PLAY_BLOCK_COLORS[ORANGE];
  pb10.releaseTime = 0.05;
  pb10.am = am;
  pb10.playBlocks = playBlocks;  
  pb10.startPlayBlock();
  playBlocks.push(pb10);

  var pb11 = Object.create(PlayBlock);
  pb11.x = 91 + (i * PATTERN_WIDTH) + patternOffset;
  pb11.y = -256;
  pb11.width = 103;
  pb11.height = 108;
  pb11.backgroundColor = PLAY_BLOCK_COLORS[DARK_BLUE];
  pb11.invertedColors = true;
  pb11.releaseTime = 0.09;
  pb11.am = am;
  pb11.playBlocks = playBlocks;  
  pb11.startPlayBlock();
  playBlocks.push(pb11);

  var pb12 = Object.create(PlayBlock);
  pb12.x = 194 + (i * PATTERN_WIDTH) + patternOffset;
  pb12.y = -196;
  pb12.width = 46;
  pb12.height = 48;
  pb12.backgroundColor = PLAY_BLOCK_COLORS[GREEN];
  pb12.releaseTime = 0.085;
  pb12.am = am;
  pb12.playBlocks = playBlocks;
  pb12.startPlayBlock();
  playBlocks.push(pb12);

  //////////////////////
  // END OF SECTION 2 //
  //////////////////////

  var pb13 = Object.create(PlayBlock);
  pb13.x = 240 + (i * PATTERN_WIDTH) + patternOffset;
  pb13.y = -45;
  pb13.width = 51;
  pb13.height = 45;
  pb13.backgroundColor = PLAY_BLOCK_COLORS[LIGHT_BLUE];
  pb13.am = am;
  pb13.playBlocks = playBlocks;
  pb13.startPlayBlock();
  playBlocks.push(pb13);

  var pb14 = Object.create(PlayBlock);
  pb14.x = 240 + (i * PATTERN_WIDTH) + patternOffset;
  pb14.y = -110;
  pb14.width = 51;
  pb14.height = 65;
  pb14.backgroundColor = PLAY_BLOCK_COLORS[PINK];
  pb14.releaseTime = 0.05;
  pb14.am = am;
  pb14.playBlocks = playBlocks;
  pb14.startPlayBlock();
  playBlocks.push(pb14);

  var pb15 = Object.create(PlayBlock);
  pb15.x = 291 + (i * PATTERN_WIDTH) + patternOffset;
  pb15.y = -110;
  pb15.width = 136;
  pb15.height = 110;
  pb15.backgroundColor = PLAY_BLOCK_COLORS[DARK_BLUE];
  pb15.releaseTime = 0.07;
  pb15.am = am;
  pb15.playBlocks = playBlocks;
  pb15.startPlayBlock();
  playBlocks.push(pb15);

  var pb16 = Object.create(PlayBlock);
  pb16.x = 240 + (i * PATTERN_WIDTH) + patternOffset;
  pb16.y = -210;
  pb16.width = 103;
  pb16.height = 100;
  pb16.backgroundColor = PLAY_BLOCK_COLORS[LIGHT_BLUE];
  pb16.barType = 'normal';
  pb16.barSize = 20;
  pb16.tickSize = 19;
  pb16.barSide = 'bottom';
  pb16.releaseTime = 0.12;
  pb16.largeTickSpacing = 5;
  pb16.am = am;
  pb16.playBlocks = playBlocks;
  pb16.startPlayBlock();
  playBlocks.push(pb16);

  var pb17 = Object.create(PlayBlock);
  pb17.x = 343 + (i * PATTERN_WIDTH) + patternOffset;
  pb17.y = -157;
  pb17.width = 47;
  pb17.height = 47;
  pb17.backgroundColor = PLAY_BLOCK_COLORS[ORANGE];
  pb17.releaseTime = 0.15;
  pb17.am = am;
  pb17.playBlocks = playBlocks;
  pb17.startPlayBlock();
  playBlocks.push(pb17);

  //////////////////////
  // END OF SECTION 3 //
  //////////////////////

  var pb18 = Object.create(PlayBlock);
  pb18.x = 427 + (i * PATTERN_WIDTH) + patternOffset;
  pb18.y = -34;
  pb18.width = 52;
  pb18.height = 34;
  pb18.backgroundColor = PLAY_BLOCK_COLORS[ORANGE];
  pb18.releaseTime = 0.02;
  pb18.am = am;
  pb18.playBlocks = playBlocks;
  pb18.startPlayBlock();
  playBlocks.push(pb18);

  var pb19 = Object.create(PlayBlock);
  pb19.x = 427 + (i * PATTERN_WIDTH) + patternOffset;
  pb19.y = -124;
  pb19.width = 52;
  pb19.height = 90;
  pb19.backgroundColor = PLAY_BLOCK_COLORS[GREEN];
  pb19.releaseTime = 0.06;
  pb19.am = am;
  pb19.playBlocks = playBlocks;
  pb19.startPlayBlock();
  playBlocks.push(pb19);

  var pb20 = Object.create(PlayBlock);
  pb20.x = 479 + (i * PATTERN_WIDTH) + patternOffset;
  pb20.y = -77;
  pb20.width = 109;
  pb20.height = 77;
  pb20.backgroundColor = PLAY_BLOCK_COLORS[DARK_BLUE];
  pb20.invertedColors = true;
  pb20.barType = 'normal';
  pb20.barSide = 'left';
  pb20.barSize = 37;
  pb20.tickSize = 13;
  pb20.largeTickSpacing = 5;
  pb20.releaseTime = 0.04;
  pb20.am = am;
  pb20.playBlocks = playBlocks;
  pb20.startPlayBlock();
  playBlocks.push(pb20);

  var pb21 = Object.create(PlayBlock);
  pb21.x = 479 + (i * PATTERN_WIDTH) + patternOffset;
  pb21.y = -124;
  pb21.width = 36;
  pb21.height = 47;
  pb21.backgroundColor = PLAY_BLOCK_COLORS[PINK];
  pb21.releaseTime = 0.1;
  pb21.am = am;
  pb21.playBlocks = playBlocks;
  pb21.startPlayBlock();
  playBlocks.push(pb21);

  var pb22 = Object.create(PlayBlock);
  pb22.x = 515 + (i * PATTERN_WIDTH) + patternOffset;
  pb22.y = -124;
  pb22.width = 73;
  pb22.height = 47;
  pb22.backgroundColor = PLAY_BLOCK_COLORS[LIGHT_BLUE];
  pb22.releaseTime = 0.1;
  pb22.am = am;
  pb22.playBlocks = playBlocks;
  pb22.startPlayBlock();
  playBlocks.push(pb22);

  var pb23 = Object.create(PlayBlock);
  pb23.x = 588 + (i * PATTERN_WIDTH) + patternOffset;
  pb23.y = -36;
  pb23.width = 90;
  pb23.height = 36;
  pb23.backgroundColor = PLAY_BLOCK_COLORS[ORANGE];
  pb23.releaseTime = 0.0;
  pb23.am = am;
  pb23.playBlocks = playBlocks;
  pb23.startPlayBlock();
  playBlocks.push(pb23);

  //////////////////////
  // END OF SECTION 4 //
  //////////////////////

  var pb24 = Object.create(PlayBlock);
  pb24.x = 817 + (i * PATTERN_WIDTH) + patternOffset + rightPatternOffset;
  pb24.y = -44;
  pb24.width = 132;
  pb24.height = 44;
  pb24.backgroundColor = PLAY_BLOCK_COLORS[ORANGE];
  pb24.invertedColors = true;
  pb24.barType = 'normal';
  pb24.barSize = 27;
  pb24.barSide = 'left';
  pb24.tickSize = 8;
  pb24.largeTickSpacing = 5;
  pb24.releaseTime = 0.0;
  pb24.am = am;
  pb24.playBlocks = playBlocks;
  pb24.startPlayBlock();
  playBlocks.push(pb24);

  var pb25 = Object.create(PlayBlock);
  pb25.x = 817 + (i * PATTERN_WIDTH) + patternOffset + rightPatternOffset;
  pb25.y = -73;
  pb25.width = 46;
  pb25.height = 29;
  pb25.backgroundColor = PLAY_BLOCK_COLORS[LIGHT_BLUE];
  pb25.releaseTime = 0.08;
  pb25.am = am;
  pb25.playBlocks = playBlocks;
  pb25.startPlayBlock();
  playBlocks.push(pb25);

  var pb26 = Object.create(PlayBlock);
  pb26.x = 863 + (i * PATTERN_WIDTH) + patternOffset + rightPatternOffset;
  pb26.y = -97;
  pb26.width = 111;
  pb26.height = 53;
  pb26.backgroundColor = PLAY_BLOCK_COLORS[PINK];
  pb26.releaseTime = 0.1;
  pb26.am = am;
  pb26.playBlocks = playBlocks;
  pb26.startPlayBlock();
  playBlocks.push(pb26);

  var pb27 = Object.create(PlayBlock);
  pb27.x = 949 + (i * PATTERN_WIDTH) + patternOffset + rightPatternOffset;
  pb27.y = -44;
  pb27.width = 73;
  pb27.height = 44;
  pb27.backgroundColor = PLAY_BLOCK_COLORS[LIGHT_BLUE];
  pb27.releaseTime = 0.05;
  pb27.am = am;
  pb27.playBlocks = playBlocks;
  pb27.startPlayBlock();
  playBlocks.push(pb27);

  //////////////////////
  // END OF SECTION 5 //
  //////////////////////

  var pb28 = Object.create(PlayBlock);
  pb28.x = 1022 + (i * PATTERN_WIDTH) + patternOffset + rightPatternOffset;
  pb28.y = -45;
  pb28.width = 89;
  pb28.height = 45;
  pb28.backgroundColor = PLAY_BLOCK_COLORS[ORANGE];
  pb28.barSide = 'left';
  pb28.barType = 'normal';
  pb28.barSize = 23;
  pb28.largeTickSpacing = 5;
  pb28.releaseTime = 0.02;
  pb28.am = am;
  pb28.playBlocks = playBlocks;
  pb28.startPlayBlock();
  playBlocks.push(pb28);

  var pb29 = Object.create(PlayBlock);
  pb29.x = 1022 + (i * PATTERN_WIDTH) + patternOffset + rightPatternOffset;
  pb29.y = -110;
  pb29.width = 89;
  pb29.height = 65;
  pb29.backgroundColor = PLAY_BLOCK_COLORS[DARK_BLUE];
  pb29.invertedColors = true;
  pb29.barSide = 'left';
  pb29.barType = 'normal';
  pb29.barSize = 23;
  pb29.largeTickSpacing = 5;
  pb29.releaseTime = 0.05;
  pb29.am = am;
  pb29.playBlocks = playBlocks;
  pb29.startPlayBlock();
  playBlocks.push(pb29);

  var pb30 = Object.create(PlayBlock);
  pb30.x = 1111 + (i * PATTERN_WIDTH) + patternOffset + rightPatternOffset;
  pb30.y = -53;
  pb30.width = 104;
  pb30.height = 53;
  pb30.backgroundColor = PLAY_BLOCK_COLORS[LIGHT_BLUE];
  pb30.releaseTime = 0.04;
  pb30.am = am;
  pb30.playBlocks = playBlocks;
  pb30.startPlayBlock();
  playBlocks.push(pb30);

  var pb31 = Object.create(PlayBlock);
  pb31.x = 1111 + (i * PATTERN_WIDTH) + patternOffset + rightPatternOffset;
  pb31.y = -110;
  pb31.width = 104;
  pb31.height = 57;
  pb31.backgroundColor = PLAY_BLOCK_COLORS[DARK_BLUE];
  pb31.releaseTime = 0.07;
  pb31.am = am;
  pb31.playBlocks = playBlocks;
  pb31.startPlayBlock();
  playBlocks.push(pb31);

  var pb32 = Object.create(PlayBlock);
  pb32.x = 1111 + (i * PATTERN_WIDTH) + patternOffset + rightPatternOffset;
  pb32.y = -200;
  pb32.width = 104;
  pb32.height = 90;
  pb32.backgroundColor = PLAY_BLOCK_COLORS[GREEN];
  pb32.releaseTime = 0.1;
  pb32.barType = 'play';
  pb32.barSide = 'bottom';
  pb32.barSize = 16;
  pb32.am = am;
  pb32.playBlocks = playBlocks;
  pb32.startPlayBlock();
  playBlocks.push(pb32);

  //////////////////////
  // END OF SECTION 6 //
  //////////////////////

  var pb33 = Object.create(PlayBlock);
  pb33.x = 1215 + (i * PATTERN_WIDTH) + patternOffset + rightPatternOffset;
  pb33.y = -137;
  pb33.width = 121;
  pb33.height = 137;
  pb33.backgroundColor = PLAY_BLOCK_COLORS[PINK];
  pb33.releaseTime = 0;
  pb33.barType = 'normal';
  pb33.barSide = 'right';
  pb33.barSize = 38;
  pb33.am = am;
  pb33.playBlocks = playBlocks;
  pb33.startPlayBlock();
  playBlocks.push(pb33);

  var pb34 = Object.create(PlayBlock);
  pb34.x = 1215 + (i * PATTERN_WIDTH) + patternOffset + rightPatternOffset;
  pb34.y = -200;
  pb34.width = 52;
  pb34.height = 63;
  pb34.backgroundColor = PLAY_BLOCK_COLORS[LIGHT_BLUE];
  pb34.releaseTime = 0.1;
  pb34.am = am;
  pb34.playBlocks = playBlocks;
  pb34.startPlayBlock();
  playBlocks.push(pb34);

  var pb35 = Object.create(PlayBlock);
  pb35.x = 1215 + (i * PATTERN_WIDTH) + patternOffset + rightPatternOffset;
  pb35.y = -244;
  pb35.width = 52;
  pb35.height = 44;
  pb35.backgroundColor = PLAY_BLOCK_COLORS[PINK];
  pb35.releaseTime = 0.12;
  pb35.am = am;
  pb35.playBlocks = playBlocks;
  pb35.startPlayBlock();
  playBlocks.push(pb35);

  var pb36 = Object.create(PlayBlock);
  pb36.x = 1336 + (i * PATTERN_WIDTH) + patternOffset + rightPatternOffset;
  pb36.y = -38;
  pb36.width = 65;
  pb36.height = 38;
  pb36.backgroundColor = PLAY_BLOCK_COLORS[DARK_BLUE];
  pb36.releaseTime = 0.05;
  pb36.am = am;
  pb36.playBlocks = playBlocks;
  pb36.startPlayBlock();
  playBlocks.push(pb36);

  var pb37 = Object.create(PlayBlock);
  pb37.x = 1336 + (i * PATTERN_WIDTH) + patternOffset + rightPatternOffset;
  pb37.y = -137;
  pb37.width = 65;
  pb37.height = 99;
  pb37.backgroundColor = PLAY_BLOCK_COLORS[ORANGE];
  pb37.releaseTime = 0.08;
  pb37.am = am;
  pb37.playBlocks = playBlocks;
  pb37.startPlayBlock();
  playBlocks.push(pb37);

  var pb38 = Object.create(PlayBlock);
  pb38.x = 1267 + (i * PATTERN_WIDTH) + patternOffset + rightPatternOffset;
  pb38.y = -236;
  pb38.width = 134;
  pb38.height = 108;
  pb38.backgroundColor = PLAY_BLOCK_COLORS[GREEN];
  pb38.releaseTime = 0.1;
  pb38.am = am;
  pb38.playBlocks = playBlocks;
  pb38.startPlayBlock();
  playBlocks.push(pb38);

  var pb39 = Object.create(PlayBlock);
  pb39.x = 1308 + (i * PATTERN_WIDTH) + patternOffset + rightPatternOffset;
  pb39.y = -297;
  pb39.width = 93;
  pb39.height = 61;
  pb39.backgroundColor = PLAY_BLOCK_COLORS[DARK_BLUE];
  pb39.releaseTime = 0.12;
  pb39.am = am;
  pb39.playBlocks = playBlocks;
  pb39.startPlayBlock();
  playBlocks.push(pb39);

  var pb40 = Object.create(PlayBlock);
  pb40.x = 1308 + (i * PATTERN_WIDTH) + patternOffset + rightPatternOffset;
  pb40.y = -341;
  pb40.width = 93;
  pb40.height = 44;
  pb40.backgroundColor = PLAY_BLOCK_COLORS[GREEN];
  pb40.releaseTime = 0.15;
  pb40.am = am;
  pb40.playBlocks = playBlocks;
  pb40.startPlayBlock();
  playBlocks.push(pb40);

  removePlayBlocksNotOnScreen();
}


function removePlayBlocksNotOnScreen() {
  var newPlayBlocks = [];

  for (var i = 0; i < playBlocks.length; i++) {
    var pb = playBlocks[i];

    if (pb.x < 0 - pb.width || pb.x > $('#home_animation').width()) {
      // pb is off the screen to the left or right - remove it
      pb.stopVisualAnimationObject();
    } else {
      newPlayBlocks.push(pb);
    }
  }

  playBlocks = newPlayBlocks;

  for (var i = 0; i < playBlocks.length; i++) {
    var pb = playBlocks[i];
    pb.playBlocks = playBlocks;
  }
}


var playBlocks = [];
var am;
var HEADER_HEIGHT = 110;
jQuery(document).ready(function($) {
  setTimeout(function() {
    var extraSpace = $('#animation_height_adjustment').val();

    $('#section-1').height(window.innerHeight - HEADER_HEIGHT - extraSpace);
    am = new AnimationManager();
    $('#home_animation')[0].width = window.innerWidth;
    $('#home_animation')[0].height = window.innerHeight - HEADER_HEIGHT - extraSpace;
    am.startAnimationManager('#home_animation');


    $(document).scroll(function() {
      if ($(document).scrollTop() > $('#home_animation').height() + HEADER_HEIGHT + extraSpace) {
        if (am.intervalId) {
          am.stopAnimationManager();
        }
      } else if (am.intervalId == null) {
        am.startAnimationManager('#home_animation');
      }
    });

    startPlayBlocks();

    var explodingPlayBlock;
    $('#home_animation').mousedown(function(e) {
      var xPos = e.offsetX;
      var yPos = e.offsetY;

      if ($.browser.mozilla) {
        xPos = e.clientX - $('#splash').position().left;
        yPos = e.clientY - $('#splash').position().top;
      }

      for (var i = 0; i < playBlocks.length; i++) {
        var pb = playBlocks[i];

        if (pb.isInside(xPos, yPos)) {
          pb.numFlashes = 10;
          pb.numClicks -= 1;
          if (pb.numClicks == 0) {
            explodingPlayBlock = pb;
            pb.exploding = true;
          }
        }
      }
    });

    $('#home_animation').mouseup(function(e) {
      if (explodingPlayBlock) {
        explodingPlayBlock.popping = true;

        if (explodingPlayBlock.invertedColors) {
          $('#splash').css('background-color', '#0e7ac4');
        } else {
          $('#splash').css('background-color', explodingPlayBlock.hex_to_rgba(explodingPlayBlock.bgColor(), 0.8));
        }
      }
    });

  }, 1);
});