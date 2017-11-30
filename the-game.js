// the-game.js
var gl;
var canvas; 
const WALLHEIGHT     = 70.0; // Some playing field parameters
const ARENASIZE      = 1000.0;
const EYEHEIGHT      = 15.0;
const HERO_VP        = 0.625;

const  upx=0.0, upy=1.0, upz=0.0;    // Some LookAt params 

const fov = 60.0;     // Perspective view params 
const near = 1.0;
const far = 10000.0;
var aspect, eyex, eyez;

const width = 1000;       // canvas size 
const height = 625;
const vp1_left = 0;      // Left viewport -- the hero's view 
const vp1_bottom = 0;

// Lighting stuff
var la0  = [ 0.2,0.2,0.2, 1.0 ]; // light 0 ambient intensity 
var ld0  = [ 1.0,1.0,1.0, 1.0 ]; // light 0 diffuse intensity 
var ls0  = [ 1.0,1.0,1.0, 1.0 ]; // light 0 specular 
var lp0  = [ 0.0,1.0,1.0, 1.0 ]; // light 0 position -- will adjust to hero's viewpoint 
var ma   = [ 0.02 , 0.2  , 0.02 , 1.0 ]; // material ambient 
var md   = [ 0.08, 0.6 , 0.08, 1.0 ]; // material diffuse 
var ms   = [ 0.6  , 0.7, 0.6  , 1.0 ]; // material specular 
var me      = 75;             // shininess exponent 
const red  = [ 1.0,0.0,0.0, 1.0 ]; // pure red 
const blue = [ 0.0,0.0,1.0, 1.0 ]; // pure blue 
const green = [ 0.0,1.0,0.0, 1.0 ]; // pure blue 
const yellow = [ 1.0,1.0,0.0, 1.0 ]; // pure yellow

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var program;

var arena;
var hero;
var thingSeeking;
var villain;

var g_matrixStack = []; // Stack for storing a matrix

window.onload = function init(){
    canvas = document.getElementById( "gl-canvas" );
    
    //gl = WebGLUtils.setupWebGL( canvas );
    gl = WebGLDebugUtils.makeDebugContext( canvas.getContext("webgl") ); // For debugging
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    //  Configure WebGL
    
    gl.clearColor( 0.0, 0.86, 1.0, 1.0 );           // sky color

    //  Load shaders and initialize attribute buffers

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    eyex = 30;                  // Where the hero starts (0 -> 1000)
    //eyex  = ARENASIZE/2.0;
    eyez = -30;
    //eyez  =  -ARENASIZE/2.0;                        // (0 -> -1000)
    aspect=width/height;

    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

    gl.uniform1i(gl.getUniformLocation(program, "texture_flag"),
		 0); // Assume no texturing is the default used in
                     // shader.  If your game object uses it, be sure
                     // to switch it back to 0 for consistency with
                     // those objects that use the defalt.
    
    
    arena = new Arena(program);
    arena.init();

    //hero = new Hero(program, eyex, 0.0, eyez, 45, 10.0);
    hero = new Hero(program, eyex, 0.0, eyez, 315, 10.0);
    hero.init();

    //thingSeeking = new ThingSeeking(program, ARENASIZE/4.0, 0.0, -ARENASIZE/4.0, 0, 10.0);
    thingSeeking = new ThingSeeking(program, 970, 0.0, -970, 0, 10.0);
    thingSeeking.init();

    //villain = new Villain(program, (3*ARENASIZE)/4.0, 0.0, -ARENASIZE/4.0, 0, 10.0);
    villain = new Villain(program, 500, 0.0, -500, 135, 10.0);
    villain.init();
    
    render();
};

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    
    // Hero's eye viewport 
    gl.viewport(vp1_left, vp1_bottom, (HERO_VP * width), height);

    //villain.xdir = hero.xdir * -1;
    
    lp0[0] = hero.x + hero.xdir; // Light in front of hero, in line with hero's direction
    lp0[1] = EYEHEIGHT;
    lp0[2] = hero.z + hero.zdir;
    modelViewMatrix = lookAt( vec3(hero.x, EYEHEIGHT, hero.z),
			      vec3(hero.x + hero.xdir, EYEHEIGHT, hero.z + hero.zdir),
			      vec3(upx, upy, upz) );
    projectionMatrix = perspective( fov, HERO_VP * aspect, near, far );
    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
    arena.show();
    hero.show();
    thingSeeking.show();
    villain.show();
    
    // Overhead viewport 
    var horiz_offset = (width * (1.0 - HERO_VP) / 20.0);
    gl.viewport( vp1_left + (HERO_VP * width) + horiz_offset ,
		 vp1_bottom, 18 * horiz_offset, height );
    modelViewMatrix = lookAt(  vec3(500.0,100.0,-500.0),
			       vec3(500.0,0.0,-500.0),
			       vec3(0.0,0.0,-1.0) );
    projectionMatrix = ortho( -500,500, -500,500, 0,200 );
    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
    arena.show();
    hero.show();
    thingSeeking.show();
    villain.show();

    requestAnimFrame( render );
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
                villain.move(-movementSpeed);
            }
            else {
                hero.move(movementSpeed);
                villain.move(-movementSpeed);
            }
            break;
        case 'W':
            // Move forward
        if (ValidMove(movementSpeed)) {
                hero.move(movementSpeed);
                villain.move(movementSpeed);
            }
            else {
                hero.move(-movementSpeed);
                villain.move(-movementSpeed);
            }
            break;
        case 'D':
            // Turn left
            hero.turn(movementSpeed);
            villain(-movementSpeed);
            break;
        case 'A':
            // Turn right
            hero.turn(-movementSpeed);
            villain(movementSpeed);
            break;
    }
};
