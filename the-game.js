// the-game.js
var gl;
var canvas;
const WALLHEIGHT = 70.0; // Some playing field parameters
const ARENASIZE = 1000.0;
const EYEHEIGHT = 15.0;
const HERO_VP = 0.625;

const upx = 0.0, upy = 1.0, upz = 0.0;    // Some LookAt params 

const fov = 60.0;     // Perspective view params 
const near = 1.0;
const far = 10000.0;
var aspect, eyex, eyez;

const width = 1000;       // canvas size 
const height = 625;
const vp1_left = 0;      // Left viewport -- the hero's view 
const vp1_bottom = 0;

// Lighting stuff
var la0 = [0.2, 0.2, 0.2, 1.0]; // light 0 ambient intensity 
var ld0 = [1.0, 1.0, 1.0, 1.0]; // light 0 diffuse intensity 
var ls0 = [1.0, 1.0, 1.0, 1.0]; // light 0 specular 
var lp0 = [0.0, 1.0, 1.0, 1.0]; // light 0 position -- will adjust to hero's viewpoint 

var la1 = [0.4, 0.4, 0.4, 1.0]; // light 1 ambient intensity 
var ld1 = [1.0, 1.0, 1.0, 1.0]; // light 1 diffuse intensity 
var ls1 = [1.0, 1.0, 1.0, 1.0]; // light 1 specular 
var lp1 = [0.0, 1.0, 1.0, 1.0]; // light 1 position -- will adjust to villain's location

var ma = [0.02, 0.2, 0.02, 1.0]; // material ambient 
var md = [0.08, 0.6, 0.08, 1.0]; // material diffuse 
var ms = [0.6, 0.7, 0.6, 1.0]; // material specular 
var me = 75;             // shininess exponent 

const red = [1.0, 0.0, 0.0, 1.0]; // pure red 
const blue = [0.0, 0.0, 1.0, 1.0]; // pure blue 
const lightBlue = [0.0, 0.8, 1.0, 1.0]; // light blue
const green = [0.0, 1.0, 0.0, 1.0]; // pure green 
const yellow = [1.0, 1.0, 0.0, 1.0]; // pure yellow
const black = [0.0, 0.0, 0.0, 1.0]; // pure black
const white = [1.0, 1.0, 1.0, 1.0]; // pure white
const gray = [0.5, 0.5, 0.5, 1.0]; // pure gray

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var program;

var arena;
var hero;
var thingSeeking;
var torusObjectArray = [];
var BankObject1;
var BankObject2;
var villain;
var villain

var heroStashScore = 0;
var heroBankScore = 0;
var villainScore = 0;

var g_matrixStack = []; // Stack for storing a matrix

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    //gl = WebGLUtils.setupWebGL( canvas );
    gl = WebGLDebugUtils.makeDebugContext(canvas.getContext("webgl")); // For debugging
    if (!gl) { alert("WebGL isn't available"); }

    //  Configure WebGL

    gl.clearColor(0.0, 0.0, 0.0, 1.0);           // sky color

    //  Load shaders and initialize attribute buffers

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    eyex = 30;                  // Where the hero starts (0 -> 1000)
    //eyex  = ARENASIZE/2.0;
    eyez = -30;
    //eyez  =  -ARENASIZE/2.0;                        // (0 -> -1000)
    aspect = width / height;

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    gl.uniform1i(gl.getUniformLocation(program, "texture_flag"),
        0); // Assume no texturing is the default used in
    // shader.  If your game object uses it, be sure
    // to switch it back to 0 for consistency with
    // those objects that use the default.

    arena = new Arena(program);
    arena.init();

    //hero = new Hero(program, eyex, 0.0, eyez, 45, 10.0);
    hero = new Hero(program, 50, 0.0, -50, 315, 10.0);
    hero.init();

    villain = new Villain(program, 950, 0.0, -950, 135, 10.0);
    villain.init();

    //thingSeeking = new ThingSeeking(program, ARENASIZE/4.0, 0.0, -ARENASIZE/4.0, 0, 10.0);
    //thingSeeking = new ThingSeeking(program, 500, 0.0, -500, 0, 10.0);
    //thingSeeking.init();

    //TorusObjects
    for (var i = 200; i < 1000; i = i + 200) {
        for (var j = -200; j > -1000; j = j - 200) {
            var temp = new TorusObject(program, i, 5, j, 90, 10.0);
            //BoxMap(temp);
            temp.init();
            torusObjectArray.push(temp);
        }
    }

    //BankObjects
    BankObject1 = new BankObject(program, 950, 0.0, -50, 0, 10.0);
    //BoxMap(BankObject1);
    BankObject1.init();

    BankObject2 = new BankObject(program, 50, 0.0, -950, 0, 10.0);
    //BoxMap(BankObject2);
    BankObject2.init();

    render();
};

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Hero's eye viewport 
    gl.viewport(vp1_left, vp1_bottom, (HERO_VP * width), height);

    lp1[0] = villain.x + villain.xdir; // Light in front of the villain, in line with villain's direction
    lp1[1] = EYEHEIGHT;
    lp1[2] = villain.z + villain.zdir;

    lp0[0] = hero.x + hero.xdir; // Light in front of hero, in line with hero's direction
    lp0[1] = EYEHEIGHT;
    lp0[2] = hero.z + hero.zdir;
    modelViewMatrix = lookAt(vec3(hero.x, EYEHEIGHT, hero.z),
        vec3(hero.x + hero.xdir, EYEHEIGHT, hero.z + hero.zdir),
        vec3(upx, upy, upz));
    projectionMatrix = perspective(fov, HERO_VP * aspect, near, far);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    arena.show();
    hero.show();
    villain.show();
    for (var i = 0; i < torusObjectArray.length; i++) {
        torusObjectArray[i].show();
    }
    BankObject1.show();
    BankObject2.show();

    // Overhead viewport 
    var horiz_offset = (width * (1.0 - HERO_VP) / 20.0);
    gl.viewport(vp1_left + (HERO_VP * width) + horiz_offset, vp1_bottom, 18 * horiz_offset, height);
    modelViewMatrix = lookAt(vec3(500.0, 100.0, -500.0), vec3(500.0, 0.0, -500.0), vec3(0.0, 0.0, -1.0));
    projectionMatrix = ortho(-500, 500, -500, 500, 0, 200);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    arena.show();
    hero.show();
    villain.show();
    for (var i = 0; i < torusObjectArray.length; i++) {
        torusObjectArray[i].show();
    }
    BankObject1.show();
    BankObject2.show();

    checkForScore();
    Seek();
    requestAnimFrame(render);
};

//y goes 0-70, x = 0-1000 wall is about 30, z = 0 - (-1000)
ValidMove = function (movement) {
    var x = hero.x + movement;
    var z = hero.z + movement;
    var isValidMove = true;
    if (x < 25 || x > 975) {
        isValidMove = false;
    }
    else if (z < -975 || z > -25) {
        isValidMove = false;
    }
    if (Math.abs(x - villain.x) < 34 && Math.abs(z - villain.z) < 34) {
        isValidMove = false;
    }

    ForceValidLocation();
    return isValidMove;
};

ForceValidLocation = function () {
    while (hero.x < 25) {
        hero.x = hero.x + 2;
    }
    while (hero.x > 975) {
        hero.x = hero.x - 2;
    }
    while (hero.z < -975) {
        hero.z = hero.z + 2;
    }
    while (hero.z > -25) {
        hero.z = hero.z - 2;
    }
    while (Math.abs(hero.x - villain.x) < 30 && Math.abs(hero.z - villain.z) < 30) {
        if (hero.x < villain.x) {
            hero.x = hero.x - 1;
        }
        else {
            hero.x = hero.x + 1;
        }
        if (hero.z < villain.z) {
            hero.z = hero.z - 1;
        }
        else {
            hero.z = hero.z + 1;
        }
    }
};

Seek = function () {
    var movementSpeed = 2;
    if (Math.abs(hero.x - villain.x) < 37 && Math.abs(hero.z - villain.z) < 37) {
        if (villainScore >= 7) {
            document.getElementById('score').innerHTML = "THE VILLAIN WINS! Refresh the page for a new game.";
        }
        else {
            villainScore = heroStashScore + villainScore;
            heroStashScore = 0;
            villain.x = 950;
            villain.z = -950;
            document.getElementById('score').innerHTML = "SCORE: HERO = " + heroBankScore + " VILLAIN = " + villainScore;
        }
    }
    else {
        if (hero.x > villain.x) {
            villain.x = villain.x + movementSpeed;
        }
        else {
            villain.x = villain.x - movementSpeed;
        }
        if (hero.z > villain.z) {
            villain.z = villain.z + movementSpeed;
        }
        else {
            villain.z = villain.z - movementSpeed;
        }
    }
};


checkForScore = function () {
    for (var i = 0; i < torusObjectArray.length; i++) {
        if (Math.abs(hero.x - torusObjectArray[i].x) < 20 && Math.abs(hero.z - torusObjectArray[i].z) < 20) {
            heroStashScore++;
            document.getElementById('score').innerHTML = "SCORE: HERO = " + heroBankScore + " VILLAIN = " + villainScore;
            torusObjectArray.splice(i, 1);
        }
    }

    if ((Math.abs(hero.x - BankObject1.x) < 10 && Math.abs(hero.z - BankObject1.z) < 10) || (Math.abs(hero.x - BankObject2.x) < 10 && Math.abs(hero.z - BankObject2.z) < 10)) {
        if (heroBankScore >= 10) {
            document.getElementById('score').innerHTML = "THE HERO WINS! Refresh the page for a new game.";
        }
        else {
            heroBankScore = heroStashScore + heroBankScore;
            heroStashScore = 0;
            document.getElementById('score').innerHTML = "SCORE: HERO = " + heroBankScore + " VILLAIN = " + villainScore;
        }
    }
};

window.onkeydown = function (event) {
    var key = String.fromCharCode(event.keyCode);
    var movementSpeed = 3;
    // For letters, the upper-case version of the letter is always
    // returned because the shift-key is regarded as a separate key in
    // itself.  Hence upper- and lower-case can't be distinguished.
    switch (key) {
        case 'S':
            // Move backward
            if (ValidMove(-movementSpeed)) {
                hero.move(-movementSpeed);
            }
            else {
                hero.move(movementSpeed);
            }
            break;
        case 'W':
            // Move forward
            if (ValidMove(movementSpeed)) {
                hero.move(movementSpeed);
            }
            else {
                hero.move(-movementSpeed);
            }
            break;
        case 'D':
            // Turn left
            hero.turn(movementSpeed * 2);
            break;
        case 'A':
            // Turn right
            hero.turn(-movementSpeed * 2);
            break;
    }
};