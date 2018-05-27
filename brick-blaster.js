/** brick-blaster.js - A classic brick-breaking clone written in javascript 
 *                       using the Pixi.js and Tink libraries.
 *
 *                       Pixi.js - http://www.pixijs.com/ 
 *                       Tink - https://github.com/kittykatattack/tink
 * Author: kbmulligan
 * Date started: Dec 2015
 * Latest Edits: Jan 2016
 * Version: 0.5
 * digmshiphter@gmail.com
 * Twitter: n1t0r
 
    Copyright (c) <2016> <K. Brett Mulligan>

    Permission is hereby granted, free of charge, to any person obtaining 
    a copy of this software and associated documentation files 
    (the "Software"), to deal in the Software without restriction, including 
    without limitation the rights to use, copy, modify, merge, publish, 
    distribute, sublicense, and/or sell copies of the Software, and to permit 
    persons to whom the Software is furnished to do so, subject to the 
    following conditions:

    The above copyright notice and this permission notice shall be included in 
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
    DEALINGS IN THE SOFTWARE.
 */

//Test that Pixi is working
console.log(PIXI);

var Text = PIXI.Text;

//colors
var blue = 0x66CCFF;
var red = 0xFF0000;
var greenNeon = 0x39FF14;
var greenNeon = 0x1cb200;
var white = 0xffffff;
var black = 0x000000;

var paddleColor = greenNeon; //0x2F9579;
var blockColor = greenNeon; //0x005F35;
var ballColor = white; //0x128B69;
var textColor = greenNeon;


// Primitive vars
var paddleLength = 84,
    paddleWidth = 8,
    paddleSpeed = 15,
    paddleStartX = window.innerWidth/2 - paddleLength/2,
    paddleStartY = window.innerHeight*0.8;

var ballRadius = 8,
    ballStartX = window.innerWidth * 0.5,
    ballStartY = window.innerHeight * 0.6,
    mult = 3,
    awayFromZeroBias = 0.5,
    ballStartVX = (Math.random() + awayFromZeroBias) * mult*randomSign(0.5),
    ballStartVY = (Math.random() + awayFromZeroBias) * mult*randomSign(0.5);

var blockLength = 50,
    blockWidth = 20,
    blockMargin = 5;

var layout1 = [ 1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,
                1,0,1,1,1,1,0,1,0,1,1,1,1,0,1,
                0,0,1,1,1,1,0,1,0,1,1,1,1,0,0,
                1,1,0,1,0,1,1,1,1,1,0,1,0,1,1
];

var layout2 = [ 1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
                0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,
                0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,
                1,0,0,0,0,0,0,1,0,0,0,0,0,0,1
];

var layout = {
    blocksAcross: 15,
    blocksDeep: 4,
    blocksTotal: function() {
        return this.blocksAcross * this.blocksDeep;
    },
    blocks: layout1 
};


// Games vars
var state = pause,
    level = 1,
    score = 0,
    lives = 3,
    startingLives = 3;

var bounceAccel = 1.02;
var paddleInfluence = 0.1;
var frames = 5;             // frames to use to calculate velocity
var previousXPositions = new Array();

// AI/Cheat
var invincible = false;

// Config vars
var debugMode = false,
    mouseControl = true,
    keyUpFriction = 0.0,
    fineDetectionRadius = ballRadius * 10;

// Texts
var livesLabel = "balls: ";
var scoreLabel = "score: ";
var levelLabel = "level: ";


//Create the renderer
var renderer = PIXI.autoDetectRenderer(256, 256);
// var renderer = PIXI.WebGLRenderer(256, 256);

if (renderer.type == PIXI.RENDERER_TYPE.WEBGL) {
   console.log('Using WebGL...');
} else {
  console.log('Using Canvas...');
};


//Configure the renderer
renderer.view.style.position = "absolute";
renderer.view.style.display = "block";
renderer.autoResize = true;
renderer.resize(window.innerWidth, window.innerHeight);

//Add the canvas to the HTML document
document.body.appendChild(renderer.view);

//Create a container object called the `stage`
var stage = new PIXI.Container();


// link tink
var t = new Tink(PIXI, renderer.view);
var pointer = t.makePointer();


// UTILITY FUNCTIONS ////////////////////////////////////////////////
function randomSign (chanceNeg) {
    var val = Math.random() - chanceNeg;
    var sign = 0;
    if (val > 0) {
        sign = 1;
    }
    else {
        sign = -1;
    }
    return sign;
}

// INPUT CODE ///////////////////////////////////////////////////////
function keyboard(keyCode) {
  var key = {};
  key.code = keyCode;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;
  //The `downHandler`
  key.downHandler = function(event) {
    if (event.keyCode === key.code) {
      if (key.isUp && key.press) key.press();
      key.isDown = true;
      key.isUp = false;
    }
    event.preventDefault();
  };

  //The `upHandler`
  key.upHandler = function(event) {
    if (event.keyCode === key.code) {
      if (key.isDown && key.release) key.release();
      key.isDown = false;
      key.isUp = true;
    }
    event.preventDefault();
  };

  //Attach event listeners
  window.addEventListener(
    "keydown", key.downHandler.bind(key), false
  );
  window.addEventListener(
    "keyup", key.upHandler.bind(key), false
  );
  return key;
}

// input code setup
var left = 37;
var right = 39;
var space = 32;
var enter = 13;
var esc = 27;

var keyLeft = keyboard(left);
var keyRight = keyboard(right);
var keySpace = keyboard(space);
var keyEnter = keyboard(enter);
var keyEsc = keyboard(esc);

keyRight.press = function() {
    paddle.vx += paddleSpeed;
};
keyRight.release = function() {
    ;
};

keyLeft.press = function() {
    paddle.vx -= paddleSpeed;
};
keyLeft.release = function() {
    ;
};

keyEsc.press = function() {
    ;
};
keyEsc.release = function () {
    togglePause();
};

keySpace.press = function() {
    ;
};
keySpace.release = function() {
    togglePause();
};

keyEnter.press = function() {
    ;
};
keyEnter.release = function () {
    resetGame();
    pauseGame();
};

pointer.tap = function () {
    // console.log("The pointer was tapped.");
    ;
};

pointer.press = function () {
    // console.log("The pointer was pressed.");
    togglePause();
};

pointer.release = function () {
    // console.log("The pointer was released.");
    ;
};

// GAME CONTROL /////////////////////////////////////////////////////
function pauseGame () {
    txtPaused.visible = true;
    pointer.visible = true;

    state = pause;
}

function unPauseGame () {
    txtPaused.visible = false;
    pointer.visible = false;
    ball.visible = true;

    state = play;
}

function togglePause () {
    if (state == play) {
        pauseGame();
    }

    else if (state == pause) {
        unPauseGame();
    }
}

function resetGame () {
    txtGameOver.visible = false;
    ball.visible = true;
    lives = startingLives;
    score = 0;
    resetBall();
    resetPaddle();
    resetBlocks();
}
    
function resetLevel (level) {
    txtGameOver.visible = false;
    ball.visible = true;
    resetBall();
    resetPaddle();
    resetBlocks(level);
    draw();
}

function nextLevel (jump) {
    level += jump;
    resetLevel(level);
    pauseGame();
}

// GAME TEXTS ///////////////////////////////////////////////////////
var txtLives = new Text(
  livesLabel + lives,
  {font: "bold 32px courier", fill: textColor}
);

var txtScore = new Text(
  scoreLabel + score,
  {font: "bold 32px courier", fill: textColor}
);

var txtLevel = new Text(
  levelLabel + level,
  {font: "bold 32px courier", fill: textColor}
);

var txtPaused = new Text(
  "PAUSED",
  {font: "bold 64px courier", fill: textColor}
);

var txtGameOver = new Text(
  "GAME OVER",
  {font: "bold 72px courier", fill: textColor}
);

var txtCredits = new Text(
  "nitor",
  {font: "bold 64px courier", fill: textColor}
);


txtGameOver.visible = false;
txtPaused.visible = true;
txtCredits.visible = false;

txtScore.position.set(window.innerWidth - (txtScore.width * 1.4), txtScore.height * 0.1);
txtLives.position.set(window.innerWidth*0.02, txtLives.height * 0.1);
txtLevel.position.set(window.innerWidth*0.4, txtLevel.height * 0.1);
txtPaused.position.set(window.innerWidth/2 - txtPaused.width/2, window.innerHeight*0.45);
txtGameOver.position.set(window.innerWidth/2 - txtGameOver.width/2, window.innerHeight*0.6);

txtScore.alpha = 0.9;
txtLives.alpha = 0.9;
txtLevel.alpha = 0.9;
txtPaused.alpha = 1.0;
txtGameOver.alpha = 1.0;

stage.addChild(txtScore);
stage.addChild(txtLives);
stage.addChild(txtLevel);
stage.addChild(txtPaused);
stage.addChild(txtGameOver);
stage.addChild(txtCredits);

function makeRectangle (initx, inity, length, width, color) {
    var rectangle = new PIXI.Graphics();
    rectangle.beginFill(color);
    rectangle.drawRect(0, 0, length, width);
    rectangle.endFill();
    rectangle.x = initx;
    rectangle.y = inity;
    rectangle.vx = 0;
    rectangle.vy = 0;

    return rectangle;
}

function makeCircle (initx, inity, radius, color) {
    var circle = new PIXI.Graphics();
    circle.beginFill(color);
    circle.drawCircle(0, 0, radius);
    circle.endFill();
    circle.radius = radius;
    circle.x = initx;
    circle.y = inity;
    circle.vx = 0;
    circle.vy = 0;

    return circle;
}

function makeBlock (initx, inity) {
    var block = makeRectangle(initx, inity, blockLength, blockWidth, blockColor)
    return block;
}

function makePaddle (initx, inity) {
    var paddle = makeRectangle(initx, inity, paddleLength, paddleWidth, paddleColor)
    return paddle;
}

function makeBall (initx, inity) {
    var ball = makeCircle(initx, inity, ballRadius, ballColor)
    return ball;
}

function initSetupBlocks (blocks, layout) {
    
    var blocksAcross = layout.blocksAcross;
    var blocksDeep = layout.blocksDeep;

    var biasX = window.innerWidth/2 - (blocksAcross * (blockLength + blockMargin))/2;
    var biaxY = window.innerHeight * 0.1;

    for (var i = 0; i < blocksAcross; i++) {
        for (var j = 0; j < blocksDeep; j++) {
            if (layout.blocks[j*blocksAcross+i] == 1) {
                var newBlock = makeBlock(i * (blockMargin + blockLength) + biasX, j * (blockMargin + blockWidth) + biaxY)
                blocks.push(newBlock);
            }
        }
    }

    for (var index = 0; index < blocks.length; index++) {
        stage.addChild(blocks[index]);
    }

    return blocks;
}

function showBlocks (blocks) {
    for (var index = 0; index < blocks.length; index++) {
        blocks[index].visible = true;
    }
}

    
function changeBlocksColor (blocks, color) {
    for (var index = 0; index < blocks.length; index++) {
        blocks[index].clear();
        blocks[index].beginFill(color);
        blocks[index].drawRect(0, 0, blockLength, blockWidth);
        blocks[index].endFill();
    }
}


// create blocks
var blocks = new Array();
initSetupBlocks(blocks, layout);

// create paddle
var paddle = makePaddle(paddleStartX, paddleStartY);
stage.addChild(paddle);

// create ball
var ball = makeBall(ballStartX, ballStartY);
ball.vx = ballStartVX;
ball.vy = ballStartVY;
stage.addChild(ball);


// GOGO GADGET GAMELOOP!!!
console.log("Game loop starting...");
gameLoop();


// COLLISION LOGIC //////////////////////////////////////////////////

function detectCollisions () {
    boundObject(paddle);
    bounceObject(ball);
    detectPaddle();
    detectBlocks(blocks);
}

function boundObject (object) {
    if (object.x < 0) {
        object.x = 0;
        object.vx = 0;
    }
    if (object.y < 0) {
        object.y = 0;
        object.vy = 0;
    }
    if (object.x > window.innerWidth - object.width) {
        object.x = window.innerWidth - object.width;
        object.vx = 0;
    }
    if (object.y > window.innerHeight - object.height) {
        object.y = window.innerHeight - object.height;
        object.vy = 0;
    }
}

function bounceObject (object) {
    if (object.x < object.radius) {
        object.x = object.radius;
        object.vx = -object.vx;
    }
    
    if (object.x > window.innerWidth - object.radius) {
        object.x = window.innerWidth - object.radius;
        object.vx = -object.vx;
    }

    if (object.y < object.radius) {
        object.y = object.radius;
        object.vy = -object.vy;
    }
    if (object.y > window.innerHeight - object.radius) {
        object.y = window.innerHeight - object.radius;
        
        // don't reflect
        // object.vy = -object.vy;

        kill();
        resetBall();
    }
}

// only used for paddle collision
function ballRectCollision (ball, rectobj, length, width) {
    
    var collision = false;

    // console.log("Checking collision...");

    if (ball.x + ballRadius > rectobj.x && 
        ball.x - ballRadius < rectobj.x + length && 
        ball.y + ballRadius > rectobj.y &&
        ball.y - ballRadius < rectobj.y + width &&
        Math.sign(ball.vy) == 1
        ) {

        collision = true;
        // console.log("Collision!!!");
    }

    return collision;
}

function ballRectCollisionHorz (ball, rect, length, width) {
    var collision = false;

    // console.log("Checking collision...");

    if (ball.x > rect.x && 
        ball.x < rect.x + length && 
        ball.y + ballRadius > rect.y && 
        ball.y - ballRadius < rect.y + width &&
        ((ball.y < rect.y && Math.sign(ball.vy) == 1) 
            || 
        (ball.y > rect.y + width && Math.sign(ball.vy) == -1))
        ) {

        collision = true;
        // console.log("Collision!!!");
    }

    return collision;
}

function ballRectCollisionVert (ball, rect, length, width) {
    var collision = false;

    // console.log("Checking collision...");

    if (ball.x + ballRadius > rect.x && 
        ball.x - ballRadius < rect.x + length && 
        ball.y > rect.y && 
        ball.y < rect.y + width &&
        ((ball.x < rect.x && Math.sign(ball.vx) == 1)
        || 
        (ball.x > rect.x + length && Math.sign(ball.vx) == -1))
        ) {

        collision = true;
        // console.log("Collision!!!");
    }

    return collision;
}

function detectPaddle () {

    if (ballRectCollision(ball, paddle, paddleLength, paddleWidth)) {
        ball.vy = -1 * ball.vy * bounceAccel;
        ball.vx += paddle.vx * paddleInfluence;
        // console.log("Ball is colliding with paddle...")
    }
}

function detectBlock (block) {

    var hit = false;

    if (ballRectCollisionHorz(ball, block, blockLength, blockWidth)) {
        ball.vy = -ball.vy;
        hit = true;
        // console.log("Ball is colliding with block horizontal plane...")
    }

    if (ballRectCollisionVert(ball, block, blockLength, blockWidth)) {
        ball.vx = -ball.vx;
        hit = true;
        // console.log("Ball is colliding with block vertical plane...")
    }

    return hit;
}

function detectBlocks (allBlocks) {
    
    var nearbyBlocks = new Array(),
        collidedBlocks = new Array();
    
    nearbyBlocks = detectBlocksCoarse(allBlocks);
    collidedBlocks = detectBlocksFine(nearbyBlocks);
    
    if (debugMode) {
        changeBlocksColor(allBlocks, greenNeon);
        changeBlocksColor(nearbyBlocks, red);
    }
        
    for (var i = 0; i < collidedBlocks.length; i++) {
        processBlockHit(collidedBlocks[i]);
    }

}

function isBlockClose (block) {
    var isClose = false;
    
    var centroidx = block.x + blockLength/2,
        centroidy = block.y + blockWidth/2;
    
    if (distance(ball.x, ball.y, centroidx, centroidy) < fineDetectionRadius) {
        isClose = true;
    }
    
    return isClose;
}

function detectBlocksCoarse (allBlocks) {
    var close = false,
        blocksToCheck = new Array();

    for (var i = 0; i < allBlocks.length; i++) {
        
        if (allBlocks[i].visible == true) {

            close = isBlockClose(allBlocks[i]);

            if (close) {
                blocksToCheck.push(allBlocks[i]);
            }
        }
        close = false;
    }
    return blocksToCheck;
}

function detectBlocksFine (nearBlocks) {
    var hit = false,
        collidedBlocks = new Array();

    for (var i = 0; i < nearBlocks.length; i++) {
        
        if (nearBlocks[i].visible == true) {
            hit = detectBlock(nearBlocks[i]);
            if (hit) {
                collidedBlocks.push(nearBlocks[i]);
            }
        }

        hit = false;
    }
    
    return collidedBlocks;
}
    
function processBlockHit (block) {
    score++;
    block.visible = false;
}

function distance (ax, ay, bx, by) {
    return Math.sqrt(Math.pow((ax-bx),2) + (Math.pow((ay-by),2)));
}


// MAIN GAME LOOP ///////////////////////////////////////////////////
function gameLoop () {
    requestAnimationFrame(gameLoop);
    t.update();
    state();
    draw();
}

function update () {

    txtLives.text = livesLabel + lives;
    txtScore.text = scoreLabel + score;
    txtLevel.text = levelLabel + level;

    if (mouseControl) {
        paddle.x = pointer.x - paddle.width/2;
    }
    
    if (invincible) {
        paddle.x = ball.x - paddleLength/2;
    }

    if (keyLeft.isUp && keyRight.isUp && mouseControl == false) {
        paddle.vx *= keyUpFriction;
    }

    if (dead()) {
        txtGameOver.visible = true;
        ball.visible = false;
        pauseGame();
    }

    if (won(blocks)) {
        nextLevel(1);       // advance 1 level
    }

    // paddle.vx = calculateVelocity(frames);
}

function won (checkBlocks) {
    return (!anyVisible(checkBlocks));
}

function anyVisible (sprites) {
    var anyVis = false;
    for (var i = 0; i < sprites.length; i++) {
        if (sprites[i].visible == true) {
            anyVis = true;
        }
    }
    return anyVis;
}

function calculateVelocity (frames) {
    var vel = 0;

    // add latest X pos and remove the oldest one
    previousXPositions.push(paddle.x);
    if (previousXPositions.length > frames) {
        previousXPositions.shift();
    }

    return vel;
}


function play () {

    // pointer mx for when it drifts off canvas and then back on
    pointer.visible = false;

    update();

    detectMiss();
    detectCollisions();
    
    animate();
}

function detectMiss () {

    if (missed()) {
        kill();
    }
}

function missed () {

    var pastEdge = false;

    if (ball.y > window.innerHeight) {
        pastEdge = true;
    }

    return pastEdge;
}

function kill () {
    lives -= 1;
}

function dead () {
    return lives == 0;
}

function animate() {
    paddle.x += paddle.vx;
    paddle.y += paddle.vy;

    ball.x += ball.vx;
    ball.y += ball.vy;
}

function pause () {
    ;
}


function draw () {
    //Tell the `renderer` to `render` the `stage`
    renderer.render(stage);
}

function resetBall () {
    ball.x = ballStartX;
    ball.y = ballStartY;
    ball.vx = ballStartVX * randomSign(0.5);
    ball.vy = ballStartVY * randomSign(0.5);
}

function resetPaddle () {
    paddle.x = paddleStartX;
    paddle.y = paddleStartY;
    paddle.vx = 0;
    paddle.vy = 0;
}

function resetBlocks (level) {
    showBlocks(blocks);
}
