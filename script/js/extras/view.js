"use strict";

/**
 * This demo shows 3D viewing pipeling in computer graphics
 * Basically it as follows :
 * MODEL coordinate => WORLD coordinaters => VIEW coordinate => NORMAL coordinates => DEVICE coordinates
 * Original source code : https://github.com/udacity/cs291/blob/master/demo/unit7-view-pipeline.js <= SPECIAL THANKS
 * Reference : http://threejs.org/examples/#webgl_sprites
 * 
 */


var container = $(  "#graphics-space" );   			/* Main container to which renderer will be appended. Min size : 1060 X 500 px */
var scene;     			/* Main scene */
var camera;    			/* Main camera PerspectiveCamera */
var renderer; 			/* WebGL renderer to render scene */
var controls;   		/* Mouse controller, OrbitAndPanControls */
var effectController;	/* Variables to dat.gui to control */

var canvasWidth; 		/* Canvas width */
var canvasHeight; 		/* Canvas height */
var sceneText;    		/* Scene object to hold sprite matrices */
var frustumCam;   		/* Frustum camera, it can be ortho or perspective */
var frustumTarget;  	/* LookAt target for frustum camera */
var sceneFrustum; 		/* Scene for frustum camera */

var cube, corner, cornerGeometry;  /* Main cube, its highlighted corner and its geometry */
var light;  			/*  Main light PointLight */
var groundGrid;   		/* Main grid */
var moreGround;   		/* small grid at center */
var axis1;        		/* X axis, a cylinder so that it can be seen clearly */
var axis2;       		/* Z axis, a cylinder so that it can be seen clearly */  
var xGrid;       		/* X grid */
var zGrid;       		/* Z grid */
var spritey = [];  		/* Sprite array to hold all sprite object, matrices */
var sphereMaterial; 	/* Mateiral of sphere, corner of cube */
var cubeMaterial;   	/* Mateiral of cube */
var fullWireMaterial;   /* Mateiral of axis and grids */
var lineMaterial = [];  /* Line material used to draw axis */

var viewMode;   		/* ViewMode determines which matrix to be shown, It can be "all", "model", "view", "projection" or "window" */
var prevTextScale; 		/* Previous text scale on sprite */

var TEXT_SCALE = 0.83;  /* Initial text scale */
var EXTRA_CUSHION = 3;  /* Used for padding in sprites */

var boxSize;  			/* Size of cube */
var clearColor = 0xe6e6e6;  /* Color of renderer */

var prevMatrixWorld = new THREE.Matrix4();  		/* Previous state matrix of cube, used to determine whether to update sprite or not */ 
var prevPtm = new THREE.Vector4(); 					/* Previous state matrix of point on cube */
var prevMatrixWorldInverse = new THREE.Matrix4(); 	/* Previous state matrix of world */
var prevPtv = new THREE.Vector4(); 					/* Previous state vector of point on cube */
var prevProjectionMatrix = new THREE.Matrix4(); 	/* Previous state matrix of projection */
var prevPtvp = new THREE.Vector4(); 				/* Previous state vector of projection */
var prevPtndc = new THREE.Vector4(); 				/* Previous state vector of normal device coordinate of point on cube */
var prevWindowMatrix = new THREE.Matrix4(); 		/* Previous state matrix of window */
var prevPtpix = new THREE.Vector4();

var firstRenderTarget; 			/* Renderer buffer target for frustum */   
var screenMaterial; 			/* Sprite material */
var EPSILON = 0.00001; 			/* Deciding variable whether new value to be place on sprite or not */

var oldViewport = '';			/* Viewport off to start */
var frustumPoints = []; 		/* Frustum points to draw frustum */
var lineGeometry = [];  		/* Frustum geometry */
var depthFaceGeometry = []; 	/* Frustum depth faces */
var sideFaceGeometry = []; 		/* Frustum side faces */
var tipGeometry = [];   		/* Frustum tip face */

var stats; 		/* Performance moniter */
var frustumShowScene = false;

function init() {

    /* offscreen render target for viewport's near-frustum rectangle */
	firstRenderTarget = new THREE.WebGLRenderTarget( 512, 512, { format: THREE.RGBFormat } );	

	/* This is the small window which opens at bottom left when Show frustum is selected */
    screenMaterial = new THREE.MeshBasicMaterial( { map: firstRenderTarget, transparent: true, opacity: 0.7 } );

	boxSize = new THREE.Vector3(8,10,6);

	/* Creating main scene objects */
	scene = new THREE.Scene();

	/* Creating sprite scene objects */
	sceneText = new THREE.Scene();

    /* This is canvas that shows matrix */
    canvasWidth = container.width() - 25;
    canvasHeight = 500;

	
	/* Setting up the renderer min 900 X 500 */
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( container.width(), 500 );
	renderer.setClearColorHex( clearColor, 1.0 );
	/* Setting auto clear to false to draw multiple viewports */
	renderer.autoClear = false;

    /* Appending renderer in dom as native DOM element ( canvas ) */
	container.append( renderer.domElement );

	/* Setting up main camera */
	var aspect = container.width() / 500;
	camera = new THREE.PerspectiveCamera( effectController.fov, aspect, effectController.near, effectController.far);
	camera.position.set( 21, 24, 31 );
	
	
	frustumTarget = new THREE.Vector3();
	frustumTarget.set(0,0,0);

	/*  Attaching mouse control to renderer */
	controls = new THREE.OrbitAndPanControls( camera, renderer.domElement );
	controls.target.set( 0, 0, 0 );
	
	/* Stats moniter, top left */
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.left = "0px";
	stats.domElement.style.top = container.position().top + container.outerHeight() - 48   + "px";
	container.append( stats.domElement );
        

	/* Attaching event resize listener on window */
	window.addEventListener( 'resize', resize, false );



	/* Creating main scene */
	
	/* lights */
	light = new THREE.PointLight( 0xffffff );
	light.position.set( 0, 25, 0 );
	scene.add( light );
	
	/* ground */
	lineMaterial = [];
	var colors = [0x0, 0x636363, 0x888888, 0xa3a3a3, 0xbababa ];
	for ( var i = 0; i < 5; i++ ) {
		lineMaterial[i] = new THREE.LineBasicMaterial( { color: colors[i] } );
	}
    
	/* gound grid */
	fullWireMaterial = new THREE.MeshLambertMaterial( { color: 0x00000000, wireframe: true } );
	groundGrid = new THREE.Mesh( new THREE.PlaneGeometry( 60, 60, 6, 6 ), fullWireMaterial );
	groundGrid.rotation.x = - Math.PI / 2;
	scene.add( groundGrid );

	/* Small grid at center */
	moreGround = new THREE.Mesh( new THREE.PlaneGeometry( 20, 20, 20, 20 ), fullWireMaterial );
	moreGround.rotation.x = - Math.PI / 2;
	scene.add( moreGround );
	

	/* thicker axes */
	axis1 = new THREE.Mesh( new THREE.CylinderGeometry( 0.05, 0.05, 10, 8, 1, true ), fullWireMaterial );
	axis1.rotation.z = 90 * Math.PI/180;
	axis1.position.x = -5;
	scene.add( axis1 );

	axis2 = new THREE.Mesh(  new THREE.CylinderGeometry( 0.05, 0.05, 10, 8, 1, true ), fullWireMaterial );
	axis2.rotation.x = -90 * Math.PI/180;
	axis2.position.z = -5;
	scene.add( axis2 );

	/* vertical grids */
	xGrid = new THREE.Mesh( new THREE.PlaneGeometry( 20, 10, 20, 10 ), new THREE.MeshBasicMaterial( { color: 0xaa0000, wireframe: true } ) );
	xGrid.rotation.y = - Math.PI / 2;
	xGrid.position.y = 5;
	scene.add( xGrid );

	zGrid = new THREE.Mesh( new THREE.PlaneGeometry( 20, 10, 20, 10 ), new THREE.MeshBasicMaterial( { color: 0x0000aa, wireframe: true } ) );
	zGrid.position.y = 5;
	scene.add( zGrid );
    
	/* Drawing coordinate from external source */
	Coordinates.drawAllAxes( { axisLength:16.2, axisRadius:0.2, axisTess:20 } );
	

	/* Main object in scene, CUBE LOL*/
	var cubeGeometry = new THREE.CubeGeometry( boxSize.x, boxSize.y, boxSize.z );
	cubeMaterial = new THREE.MeshLambertMaterial( { color: 0xff99ff, ambient: 0xff99ff } );
	cube = new THREE.Mesh( cubeGeometry, cubeMaterial );
	cube.position.set( 0, boxSize.y/2, 0 );
	cube.name = "Cube lol";
	scene.add(cube);
	
	/* Corner of cube */
	cornerGeometry = new THREE.SphereGeometry( 0.3 );
	sphereMaterial = new THREE.MeshBasicMaterial( { color: 0x00cccc } );
	corner = new THREE.Mesh( cornerGeometry, sphereMaterial );
	corner.position.set( boxSize.x/2, boxSize.y/2, boxSize.z/2 );
	corner.name = "corner";
	cube.add( corner );
	
	/* creating matrix of the screen */
	createText( true );
	
}

function resize() {
	/**
     * Fired when window size changes
     * Minimum dimention of renderer is 1060*500 px
     * If width changes below 1060px, simple return
     */ 

    if( container.width() > 1060 ) return;
	canvasWidth = container.width();
	canvasHeight = 400;
	
    /* Updating renderer */
	renderer.setSize( canvasWidth, canvasHeight );
    
	/* Updating main camera */
	camera.aspect = canvasWidth / canvasHeight;
	camera.updateProjectionMatrix();
	
}

function animate() { 
	/**
     * Animation method for scene
     */  
	
	/* starting javascript performance tool */
	stats.begin();
    requestAnimationFrame( animate );
	render();	
	stats.end();	
}

function roundRect( ctx, offsetx, x, y, w, h, r, fill ) {
	/**
	 * This method creates a rectangle border 
	 * ctx is 2d context of canvas element
	 * rest all are numbers
	 * fill: boolean
	 */
    ctx.beginPath();
    ctx.moveTo(offsetx+x+r, y);
    ctx.lineTo(offsetx+x+w-r, y);
    ctx.quadraticCurveTo(offsetx+x+w, y, offsetx+x+w, y+r);
    ctx.lineTo(offsetx+x+w, y+h-r);
    ctx.quadraticCurveTo(offsetx+x+w, y+h, offsetx+x+w-r, y+h);
    ctx.lineTo(offsetx+x+r, y+h);
    ctx.quadraticCurveTo(offsetx+x, y+h, offsetx+x, y+h-r);
    ctx.lineTo(offsetx+x, y+r);
    ctx.quadraticCurveTo(offsetx+x, y, offsetx+x+r, y);
    ctx.closePath();
	// doesn't work with multiple fills
    if ( fill ) ctx.fill();
	ctx.stroke();   
}

function setVector4Highlights( pt, prevPt, hl ) {
	/**
     * Highlights changed values
     */
	hl[0] = hl[1] = ( Math.abs(pt.x - prevPt.x ) < EPSILON ) ? "" : "*";
	hl[2] = hl[3] = ( Math.abs(pt.y - prevPt.y ) < EPSILON ) ? "" : "*";
	hl[4] = hl[5] = ( Math.abs(pt.z - prevPt.z ) < EPSILON ) ? "" : "*";
	hl[6] = hl[7] = ( Math.abs(pt.w - prevPt.w ) < EPSILON ) ? "" : "*";
}

function setHighlights( val, prevVal, hl ) {
	hl[0] = hl[1] = ( Math.abs(val - prevVal ) < EPSILON ) ? "" : "*";
}

function removeText() {
	/**
     * Removes all sprite objects form this scene 
     */
	for ( var i = 0; i < spritey.length; i++ ) {
		sceneText.remove( spritey[i] );
	}
}

function displayGrid() {
	/**
	 * Display grid depends on gui values
	 */
	groundGrid.visible = moreGround.visible = 
		axis1.visible = axis2.visible = effectController.grid;
	xGrid.visible = effectController.xgrid;
	zGrid.visible = effectController.zgrid;
}

function matrixMatch( mtx1, mtx2 ) {
	/**
     * Compares two input matrix for equality
     * Matrix size 4 X 4
     */
	for ( var i = 0; i < 16; i++ ){
		if ( mtx1.elements[i] != mtx2.elements[i] )
			return false;
	}
	return true;
}

function getWorldLocation( ndc, world ) {
	/**
     * This method convert Normal device coordinates to world coordinates 
     */
	var view = new THREE.Vector4();
	view.copy( ndc );
	var invMatrix = new THREE.Matrix4();
	invMatrix.getInverse( camera.projectionMatrix );
	view.applyMatrix4( invMatrix );
	view.divideScalar( view.w );

	world.copy( view );
	world.applyMatrix4( camera.matrixWorld );
}

function setupGui() {
	/* Initializing GUI menu object */
    /* Positioning and setting up GUI menu */
	effectController = {
		fov: 40,
		near: 20,
		far: 80,
		transx: 0,
		transy: 5,
		transz: 0,
		rotx: 0,
		roty: 0,
		rotz: 0,
		scale: 1,
		matrix: 'model',
		viewport: 'off',
		grid: true,
		xgrid: false,
		zgrid: false,
		textscale: 1,
	};
	
	var gui = new dat.GUI( { autoplace: false } );
	$( "#graphics-space" ).append( gui.domElement );
	gui.domElement.id = "gui";
	gui.domElement.style.position = "absolute";
	gui.domElement.style.right = "0px";
	gui.domElement.style.top = container.offset().top + "px";
	
	gui.add( effectController, "matrix", [ 'model', 'view', 'projection', 'window', 'all' ] ).name("Watch matrix");
	
	var f1 = gui.addFolder('Model manipulation');
	f1.add( effectController, "transx", -20.0, 20.0 ).name("X translation");
	f1.add( effectController, "transy", -20.0, 20.0 ).name("Y translation");
	f1.add( effectController, "transz", -20.0, 20.0 ).name("Z translation");
	f1.add( effectController, "rotx", 0, 360.0 ).name("X rotation");
	f1.add( effectController, "roty", 0, 360.0 ).name("Y rotation");
	f1.add( effectController, "rotz", 0, 360.0 ).name("Z rotation");
	f1.add( effectController, "scale", 0.1, 2.0 ).name("Scale");
	
	var f2 = gui.addFolder('Camera manipulation');
	f2.add( effectController, "fov", 1.0, 179.0 ).name("Field of view");
	f2.add( effectController, "near", 1.0, 50.0 ).name("Near plane");
	f2.add( effectController, "far", 50.0, 100.0 ).name("Far plane");
	
	gui.add( effectController, "viewport", [ 'off', 'volume', 'near/far', 'depths' ] ).name("Show frustum");
	
	var f3 = gui.addFolder('Controls');
	f3.add( effectController, "grid" ).name("Show ground");
	f3.add( effectController, "xgrid" ).name("Show X grid");
	f3.add( effectController, "zgrid" ).name("Show Z grid");
	f3.add( effectController, "textscale", 0.2, 1.28 ).name("Text scale");
	
}

function render() {
	/**
	 * This function makes and renderes the scene, updates camera and other control options
	 */
	
	controls.update();
	cube.position.x = effectController.transx;
	cube.position.y = effectController.transy;
	cube.position.z = effectController.transz;
	cube.rotation.x = effectController.rotx * Math.PI / 180;
	cube.rotation.y = effectController.roty * Math.PI / 180;
	cube.rotation.z = effectController.rotz * Math.PI / 180;
	cube.scale.set( effectController.scale, effectController.scale, effectController.scale );
	
	/* Updating main camera */
	camera.fov = effectController.fov;
	camera.near = effectController.near;
	camera.far = effectController.far;
	camera.updateProjectionMatrix();
	
	/* Updating light position, it will always from user side */
	light.position.copy( camera.position );
	
	var force = ( viewMode != effectController.matrix );
	if ( prevTextScale != effectController.textscale ) {
		force = 1;
		prevTextScale = effectController.textscale;
	}
	
	/* Updating which matrix to show*/
	viewMode = effectController.matrix;
	displayGrid();

	createText( force );

	/* clear whole screen with proper clear color */
	renderer.clear();
	renderer.render( scene, camera );
	
	// show viewport
	if ( effectController.viewport != 'off' ) {
		
		var viewSize = 60;
		
		var aspect = canvasWidth / canvasHeight;
		if ( effectController.viewport === 'volume' ) {
			/* use perspective camera - helps visualization a lot */
			frustumCam = new THREE.PerspectiveCamera( 60, aspect, 1, 150 );
			frustumCam.position.set( 60, 35, 0 );
			frustumCam.lookAt( new THREE.Vector3( 0, 0, 0 ) );
		} else {
			/* use orthographic camera */
			frustumCam = new THREE.OrthographicCamera(
					-aspect*viewSize / 2, aspect*viewSize / 2,
					viewSize / 2, -viewSize / 2,
					-0, 500 );
					
			/* Offset position from top */		
			var verticalOffset = 0;
			frustumCam.position.set( 250, verticalOffset, 0 );
			frustumTarget.set( 0, verticalOffset, 0 );
			frustumCam.lookAt( frustumTarget );
		}

		light.position.copy( frustumCam.position );
		
		/* viewport render */
		/* setScissor could be set just once in this particular case, since it never changes, and then just enabled/disabled */
        renderer.enableScissorTest( true );
		
		var viewsize = 0.45;
		var borderh = 4 / canvasWidth;
		var borderv = 4 / canvasHeight;
		var margin = 0.00;
		
		
		/** 
		 * viewport itself, main scene rendering with frustum camera
         * Rendering only required viewport, not full 
		 */
		renderer.setClearColorHex( clearColor, 1.0 );
		renderer.setScissor( ( 1.0 - margin - viewsize - borderh / 2 ) * canvasWidth, ( margin + borderv / 2 ) * canvasHeight,
			viewsize * canvasWidth, viewsize * canvasHeight );
			
		renderer.setViewport( ( 1.0 - margin - viewsize - borderh / 2 ) * canvasWidth, ( margin + borderv / 2 ) * canvasHeight,
			viewsize * canvasWidth, viewsize * canvasHeight );
			
		renderer.clear();
		renderer.render( scene, frustumCam );	

		/* create frustum and display */
		createFrustum( ( effectController.viewport == 'depths') ? 5: 2,
			( effectController.viewport == 'volume' ),
			oldViewport !== effectController.viewport );

		oldViewport = effectController.viewport;

		/* Rendering frustum camera */
		renderer.render( sceneFrustum, frustumCam );
		
		/* Restoring original viewport to render main scene */
		corner.scale.set( 1,1,1 );
		renderer.setViewport( 0, 0, canvasWidth, canvasHeight );
		renderer.enableScissorTest( false );
		
		/* render to target, and include in scene. This is little scene which appear on near place of frustum camera */
		renderer.render( scene, camera, firstRenderTarget, true );
	}
	
	/* render sprite scene */
	renderer.render( sceneText, camera );
	
}

function createFrustum( pointsForDepth, faces, refresh ) {
	/** 
     * For fastest updating when viewport is on, only remake the frustum when refresh is true. 
     * This is set to true only when the type of viewport changes. 
     * Otherwise, we update the vertice's positions, which is much faster (no memory allocate/free). 
     */
	if ( refresh ) {
		sceneFrustum = new THREE.Scene();

		/* turn on depth cueing for perspective (doesn't work for orthographic) */
		if ( faces )
			sceneFrustum.fog = new THREE.Fog( clearColor, 30, 140 );
	}

	/** 
     * Draw 12 lines:
     * 4 for frustum edges
     * 4 for near
     * 4 for far
     */
	var world = new THREE.Vector4();
	var v;
	var x,y,z;
	/**
     * Get the points' new locations. 
     * Note that once we have these, many of the follow objects are all set
     * And only need to have their "update" flag set to true.
	 */
	for ( x = 0; x <= 1; x++ ) {
		for ( y = 0; y <= 1; y++ ) {
			for ( z = 0; z < pointsForDepth; z++ ) {
				var ndc = new THREE.Vector4( x * 2 - 1, y * 2 - 1, ( z /( pointsForDepth - 1 ) ) * 2 - 1 );
				
				getWorldLocation( ndc, world );
				
				frustumPoints[ x * 2 * pointsForDepth + y * pointsForDepth + z ] = new THREE.Vector3( world.x, world.y, world. z );
			}
		}
	}
	
	/* frustum edges */
	var line, mtl, mesh, vcount;
	var gcount = 0;
	for ( x = 0; x <= 1; x++ ) {
		for ( y = 0; y <= 1; y++ ) {
			if ( refresh ) {
				lineGeometry[ gcount ] = new THREE.Geometry();
				lineGeometry[ gcount ].vertices.push( camera.position );
				
				lineGeometry[ gcount ].vertices.push( frustumPoints[ x * 2 * pointsForDepth + y * pointsForDepth + ( pointsForDepth- 1 ) ] );

				line = new THREE.Line( lineGeometry[ gcount++ ],lineMaterial[ 0 ] );
				sceneFrustum.add( line );
				
			} else {
				/** 
				 * change vertex locations
				 * we don't actually need to update these, as they're linked to the proper points!
				 */
				lineGeometry[gcount++].verticesNeedUpdate = true;
			}
		}
	}
	
	// planes
	for ( z = 0; z < pointsForDepth; z++ ) {
		if ( refresh ) {
			lineGeometry[ gcount ] = new THREE.Geometry();
			for ( v = 0; v < 5; v++ ) {
				x = Math.floor( v / 2 ) % 2;
				y = Math.floor( ( v + 1 ) / 2 ) % 2;
				lineGeometry[ gcount ].vertices.push( frustumPoints[ x * 2 * pointsForDepth + y * pointsForDepth + z] );
			}
			mtl = lineMaterial[z];
			line = new THREE.Line( lineGeometry[ gcount++ ], mtl );
			sceneFrustum.add( line );
		} else {
			lineGeometry[ gcount++ ].verticesNeedUpdate = true;
		}
	}
	
	/* do front face with image - always there */
	if ( refresh ) {
		depthFaceGeometry[ 0 ] = new THREE.Geometry();
		let uvs = [];
		for ( v = 0; v < 4; v++ ) {
			x = Math.floor( v / 2 ) % 2;
			y = Math.floor( ( v + 1 ) / 2 ) % 2;
			depthFaceGeometry[ 0 ].vertices.push( frustumPoints[ x * 2 * pointsForDepth + y * pointsForDepth ] );

			uvs.push( new THREE.Vector2( 0.0, 0.0 ) );
			uvs.push( new THREE.Vector2( 0.0, 1.0 ) );
			uvs.push( new THREE.Vector2( 1.0, 1.0 ) );
			uvs.push( new THREE.Vector2( 1.0, 0.0 ) );
		}

		depthFaceGeometry[ 0 ].faces.push( new THREE.Face3( 2, 1, 0 ) );
		depthFaceGeometry[ 0 ].faceVertexUvs[ 0 ].push( [ uvs[ 2 ], uvs[ 1 ], uvs[ 0 ] ] );
		depthFaceGeometry[ 0 ].faces.push( new THREE.Face3( 0, 3, 2 ) );
		depthFaceGeometry[ 0 ].faceVertexUvs[ 0 ].push( [ uvs[ 0 ], uvs[ 3 ], uvs[ 2 ] ] );

		mtl = screenMaterial;

		mesh = new THREE.Mesh( depthFaceGeometry[ 0 ], mtl );
		sceneFrustum.add( mesh );
	} else {
		/**
		 * For some strange reason I do have to copy these vertices over - I thought
		 * they would be linked to frustumPoints, but they don't appear to be, if I switch
		 * among the viewport modes.
		 */
		for ( v = 0; v < 4; v++ ) {
			x = Math.floor( v / 2 ) % 2;
			y = Math.floor( ( v + 1 ) / 2 ) % 2;
			depthFaceGeometry[ 0 ].vertices[ v ].copy( frustumPoints[ x * 2 * pointsForDepth + y * pointsForDepth ] );
		}
		depthFaceGeometry[0].verticesNeedUpdate = true;
	}
	
	// depth faces
	if ( effectController.viewport === 'depths' ) {
		if ( refresh ) {
			for ( z = 1; z < pointsForDepth; z++ ) {
				depthFaceGeometry[z] = new THREE.Geometry();
				for ( v = 0; v < 4; v++ ) {
					x = Math.floor( v / 2 ) % 2;
					y = Math.floor( ( v + 1 ) / 2 ) % 2;
					depthFaceGeometry[z].vertices.push( frustumPoints[ x * 2  * pointsForDepth + y * pointsForDepth + z ] );
				}
				depthFaceGeometry[z].faces.push( new THREE.Face3( 0, 1, 2 ) );
				depthFaceGeometry[z].faces.push( new THREE.Face3( 2, 3, 0 ) );

				mtl = new THREE.MeshBasicMaterial( { color: lineMaterial[z].color, transparent: true,
					opacity: 0.05 + 0.25*(pointsForDepth-z)/pointsForDepth,
					//opacity: 0.2,
					// for last face, show just front side - back side is blue
					side: (z == pointsForDepth-1 ) ? THREE.BackSide : THREE.DoubleSide } );

				mesh = new THREE.Mesh( depthFaceGeometry[z], mtl );
				sceneFrustum.add( mesh );
			}
		} else {
			for ( z = 1; z < pointsForDepth; z++ ) {
				vcount = 0;
				for ( v = 0; v < 4; v++ ) {
					x = Math.floor( v / 2 ) % 2;
					y = Math.floor( ( v + 1 ) / 2 ) % 2;
					depthFaceGeometry[ z ].vertices[ vcount++ ].copy( frustumPoints[ x * 2 * pointsForDepth + y * pointsForDepth + z ] );
				}
				depthFaceGeometry[z].verticesNeedUpdate = true;
			}
		}
	}
	
	var side;
	if ( faces ) {
		// side faces
		if ( refresh ) {
			for ( side = 0; side < 4; side++ ) {
				sideFaceGeometry[side] = new THREE.Geometry();
				for ( v = 0; v < 4; v++ ) {
					x = Math.floor( ( side * 4 + v + 6 ) / 8 ) % 2;
					y = Math.floor( ( side * 4 + v + 2 ) /8 ) % 2;
					z = Math.floor( ( v + 1 ) / 2 ) % 2;
					sideFaceGeometry[side].vertices.push( frustumPoints[ x * 2 * pointsForDepth + y * pointsForDepth + z * ( pointsForDepth - 1 ) ] );
				}
				sideFaceGeometry[side].faces.push( new THREE.Face3( 0, 1, 2 ) );
				sideFaceGeometry[side].faces.push( new THREE.Face3( 2, 3, 0 ) );

				mtl = new THREE.MeshBasicMaterial( { color: ( side%2 === 0 ) ? 0x00ff00 : 0xff0000, transparent: true, opacity: 0.2 } );
				mesh = new THREE.Mesh( sideFaceGeometry[side], mtl );
				sceneFrustum.add( mesh );
			}
		} else {
			for ( side = 0; side < 4; side++ ) {
				vcount = 0;
				for ( v = 0; v < 4; v++ ) {
					x = Math.floor( ( side * 4 + v + 6 ) / 8 ) % 2;
					y = Math.floor( ( side * 4 + v + 2 ) / 8) % 2;
					z = Math.floor( ( v + 1) / 2 ) % 2;
					sideFaceGeometry[side].vertices[vcount++].copy( frustumPoints[ x * 2 * pointsForDepth + y * pointsForDepth + z * ( pointsForDepth - 1 ) ] );
				}
				sideFaceGeometry[side].verticesNeedUpdate = true;
			}
		}
	}

	/* far face - give a clue that you're looking at the bottom, so always show it */
	if ( refresh ) {
		sideFaceGeometry[4] = new THREE.Geometry();
		for ( v = 0; v < 4; v++ ) {
			x = Math.floor( v / 2 ) % 2;
			y = Math.floor( ( v + 1 ) / 2 ) % 2;
			sideFaceGeometry[4].vertices.push( frustumPoints[ x * 2 * pointsForDepth + y * pointsForDepth + ( pointsForDepth - 1 ) ]  );
		}
		sideFaceGeometry[4].faces.push( new THREE.Face3( 0, 1, 2 ) );
		sideFaceGeometry[4].faces.push( new THREE.Face3( 2, 3, 0 ) );

		mtl = new THREE.MeshBasicMaterial( { color: 0x0000ff, transparent: true, opacity: 0.2 } );

		mesh = new THREE.Mesh( sideFaceGeometry[4], mtl );
		sceneFrustum.add( mesh );
	} else {
		vcount = 0;
		for ( v = 0; v < 4; v++ ) {
			x = Math.floor( v / 2 ) % 2;
			y = Math.floor( ( v + 1 ) / 2 ) % 2;
			sideFaceGeometry[4].vertices[vcount++].copy( frustumPoints[ x * 2 * pointsForDepth + y * pointsForDepth + ( pointsForDepth - 1 ) ] );
		}
		sideFaceGeometry[4].verticesNeedUpdate = true;
	}
	

	// frustum tip
	var lerpVal = 0.85;
	var vertex;
	if ( refresh ) {
		// sides of tip
		for ( side = 0; side < 4; side++ ) {
			tipGeometry[side] = new THREE.Geometry();
			for ( v = 0; v < 2; v++ ) {
				x = Math.floor((side*2+v+3)/4)%2;
				y = Math.floor((side*2+v+1)/4)%2;
				vertex = new THREE.Vector3();
				vertex.copy( frustumPoints[x*2*pointsForDepth+y*pointsForDepth] );
				vertex.lerp( camera.position, lerpVal );
				tipGeometry[side].vertices.push( vertex );
			}
			tipGeometry[side].vertices.push( camera.position );
			tipGeometry[side].faces.push( new THREE.Face3( 0, 1, 2 ) );

			mtl = new THREE.MeshBasicMaterial( { color: ( side%2 === 0 ) ? 0x00ff00 : 0xff0000 } );
			mesh = new THREE.Mesh( tipGeometry[side], mtl );
			sceneFrustum.add( mesh );
		}
	} else {
		vertex = new THREE.Vector3();
		for ( side = 0; side < 4; side++ ) {
			vcount = 0;
			for ( v = 0; v < 2; v++ ) {
				x = Math.floor((side*2+v+3)/4)%2;
				y = Math.floor((side*2+v+1)/4)%2;
				vertex.copy( frustumPoints[x*2*pointsForDepth+y*pointsForDepth] );
				vertex.lerp( camera.position, lerpVal );
				tipGeometry[side].vertices[vcount++].copy( vertex );
			}
			tipGeometry[side].vertices[vcount++].copy( camera.position );

			tipGeometry[side].verticesNeedUpdate = true;
		}
	}

	// base of tip
	if ( refresh ) {
		tipGeometry[4] = new THREE.Geometry();
		for ( v = 0; v < 4; v++ ) {
			x = Math.floor( v / 2 ) % 2;
			y = Math.floor( ( v + 1 ) / 2 ) % 2;
			vertex = new THREE.Vector3();
			vertex.copy( frustumPoints[ x * 2 * pointsForDepth + y * pointsForDepth ] );
			vertex.lerp( camera.position, lerpVal );
			tipGeometry[4].vertices.push( vertex );
		}
		tipGeometry[4].faces.push( new THREE.Face3( 0, 1, 2 ) );
		tipGeometry[4].faces.push( new THREE.Face3( 2, 3, 0 ) );

		mtl = new THREE.MeshBasicMaterial( { color: 0x0000ff } );
		mesh = new THREE.Mesh( tipGeometry[4], mtl );
		sceneFrustum.add( mesh );
	} else {
		// note we allocated the vertex once, above
		vcount = 0;
		for ( v = 0; v < 4; v++ )
		{
			x = Math.floor( v / 2 ) % 2;
			y = Math.floor( ( v + 1 ) / 2 ) % 2;
			vertex = new THREE.Vector3();
			vertex.copy( frustumPoints[ x * 2 * pointsForDepth + y * pointsForDepth ] );
			vertex.lerp( camera.position, lerpVal );
			tipGeometry[side].vertices[vcount++].copy( vertex );
		}
		tipGeometry[4].verticesNeedUpdate = true;
	}
	
}

function makeTextSprite( messageList, parameters ) {
	/**
	 * This method creates sprite object
	 */
	
	/**
	 * Validation the input parameters
	 */
	if ( parameters === undefined ) parameters = {};
	var metrics;
	
	var fontface = parameters.hasOwnProperty("fontface") ? 
		parameters.fontface : "Courier New";
	
	var fontsize = parameters.hasOwnProperty("fontsize") ? 
		parameters.fontsize : 16;
	
	var borderThickness = parameters.hasOwnProperty("borderThickness") ? 
		parameters.borderThickness : 1.5;
	
	var borderColor = parameters.hasOwnProperty("borderColor") ?
		parameters.borderColor : { r:0, g:0, b:0, a:1.0 };
	
	var textColor = parameters.hasOwnProperty("textColor") ?
		parameters.textColor : { r:60, g:60, b:60, a:1.0 };

	var highlightColor = parameters.hasOwnProperty("highlightColor") ?
		parameters.highlightColor : { r:0, g:0, b:0, a:1.0 };

	var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
		parameters.backgroundColor : { r:0, g:0, b:0, a:1.0 };

	var useScreenCoordinates = parameters.hasOwnProperty("useScreenCoordinates") ?
		parameters.useScreenCoordinates : false ;

	var spriteAlignment = parameters.hasOwnProperty("spriteAlignment") ?
		parameters.spriteAlignment : THREE.SpriteAlignment.topLeft ;

	var textAlignment = parameters.hasOwnProperty("textAlignment") ?
		parameters.textAlignment : 'left' ;

	var fill = parameters.hasOwnProperty("fill") ?
		parameters.fill : true ;
		
	var showRect = parameters.hasOwnProperty("showRect") ?
		parameters.showRect : true ;
		
	var canvas = document.createElement('canvas');
	canvas.width  = 660;
	canvas.height = 660;
	var context = canvas.getContext('2d');
	context.font = "Bold " + fontsize + "px " + fontface;
    
	// border color
	context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g +
			"," + borderColor.b + "," + borderColor.a + ")";

	var offsetx = 0;

	for ( var mchunk = 0; mchunk < messageList.length; mchunk++ ) {
		var dofill = true;
		var message = messageList[mchunk];

		/* find number of lines in text message */
		var rawStringList = [];
		rawStringList = message.split("\n");
		var lines = rawStringList.length;
			
		/* normal text, so remove all inside * *     */
		var normalText = 1;

		var normalStringList = [];
		var highlightStringList = [];
		
		/* make a list with no "*" in it, so we can get line lengths */
		var cleanStringList = [];
		for ( var ln = 0; ln < rawStringList.length; ln++ ) {
			var buffer = rawStringList[ln];
			normalStringList[ln] = "";
			highlightStringList[ln] = "";
			cleanStringList[ln] = "";
			for ( var chpos = 0; chpos < buffer.length; chpos++ ) {
				if ( buffer.charAt(chpos) == '=' )
					dofill = false;

				if ( buffer.charAt(chpos) == '*' ) {
					normalText = 1 - normalText;
				} else {
					cleanStringList[ln] += buffer.charAt(chpos);
					if ( normalText ) {
						normalStringList[ln] += buffer.charAt(chpos);
						highlightStringList[ln] += " ";
					} else {
						normalStringList[ln] += " ";
						highlightStringList[ln] += buffer.charAt(chpos);
					}
				}
			}
		}
		if ( dofill ) {
			context.font = "Bold " + fontsize + "px " + fontface;
		} else {
			/* if no rectangle surrounds, make text faster. */
			context.font = "Bold " + 1.5*fontsize + "px " + fontface;
		}
		
		var textWidth = -99;
		for ( var i = 0; i < cleanStringList.length; i++ ) {
			/* get size data (height depends only on font size) */
			metrics = context.measureText( cleanStringList[i] );
			if ( metrics.width > textWidth )
				textWidth = metrics.width;
		}
		
		if ( showRect && dofill ) {
			context.lineWidth = borderThickness;
			context.fillStyle = "rgba(" + backgroundColor.r + "," + backgroundColor.g +
					"," + backgroundColor.b + "," + backgroundColor.a + ")";
			
			roundRect(context, offsetx, borderThickness/2, borderThickness/2, textWidth + borderThickness + 2*EXTRA_CUSHION,
					fontsize * (1.2 * lines + 0.2) + borderThickness + 2*EXTRA_CUSHION, 6, fill);
		}
			
		for ( var style = 0; style < 2; style++ ) {
			// text color
			if ( style === 0 ) {
				context.fillStyle = "rgba(" + textColor.r + "," + textColor.g +
						"," + textColor.b + "," + textColor.a + ")";
			} else {
				context.fillStyle = "rgba(" + highlightColor.r + "," + highlightColor.g +
						"," + highlightColor.b + "," + highlightColor.a + ")";
			}

			for ( i = 0; i < cleanStringList.length; i++ ) {
				metrics = context.measureText( cleanStringList[i] );
				context.fillText( style ? highlightStringList[i] : normalStringList[i],
						offsetx + borderThickness + EXTRA_CUSHION + (textAlignment == 'right' ? textWidth - metrics.width : 0),
						(i+1)*(fontsize*1.2) + borderThickness + EXTRA_CUSHION);
			}
			
		}
		/* reset to default font size */
		context.font = "Bold " + fontsize + "px " + fontface;
		offsetx += textWidth + 2.5*borderThickness + 2*EXTRA_CUSHION;
	}
	
	/* canvas contents will be used for a texture */
	var texture = new THREE.Texture( canvas );
	texture.needsUpdate = true;

	var spriteMaterial = new THREE.SpriteMaterial( 
		{ map: texture, useScreenCoordinates: false, alignment: spriteAlignment } );
		
	spriteMaterial.useScreenCoordinates = useScreenCoordinates;
	spriteMaterial.depthTest = false;
	spriteMaterial.sizeAttenuation = true;
	var sprite = new THREE.Sprite( spriteMaterial );

	var diff = new THREE.Vector3();
	diff.copy( camera.position );
	diff.sub( controls.target );
	var scale = ( useScreenCoordinates ? 1.0 : diff.length() ) * TEXT_SCALE * effectController.textscale ;
	sprite.scale.set(scale,scale,1.0);
	return sprite;	
	
}

function createText( force ) {
	/**
	 * This method generates sprites text and add it to screen based of value of force variable
	 */

	/* Corner point location */        
	let pt = new THREE.Vector4( corner.position.x, corner.position.y, corner.position.z );
	/* Corner point model coordinate */
	let ptm = new THREE.Vector4();
	ptm.copy( pt );
	ptm.applyMatrix4( cube.matrixWorld );	

	/* Corner point vector */
	let ptv = new THREE.Vector4();
	ptv.copy( ptm );
	ptv.applyMatrix4( camera.matrixWorldInverse );

	/* Corner point projection matrix */
	let ptvp = new THREE.Vector4();
	ptvp.copy( ptv );
	ptvp.applyMatrix4( camera.projectionMatrix );

	/* Corner point normal coordinates */
	let ptndc = new THREE.Vector4();
	ptndc.copy( ptvp );
	ptndc.divideScalar( ptvp.w );

	let windowMatrix = new THREE.Matrix4( );
	windowMatrix.set(   canvasWidth/2, 0, 0, canvasWidth/2,
						0, canvasHeight/2, 0, canvasHeight/2, 
						0, 0, 0.5, 0.5,
						0, 0, 0, 1
					);
	
	/* Normal Device to window coordinates */
	let ptpix = new THREE.Vector4();
	ptpix.copy( ptndc );
	ptpix.applyMatrix4( windowMatrix );
	
	/* if there is no change from the previous */
	if ( !force ) {
		// check previous values
		if ( matrixMatch( prevMatrixWorld, cube.matrixWorld ) &&
			prevPtm.equals( ptm ) &&
			matrixMatch( prevMatrixWorldInverse, camera.matrixWorldInverse ) &&
			prevPtv.equals( ptv ) &&
			matrixMatch( prevProjectionMatrix, camera.projectionMatrix ) &&
			prevPtvp.equals( ptvp ) &&
			prevPtndc.equals( ptndc ) &&
			matrixMatch( prevWindowMatrix, windowMatrix ) &&
			prevPtpix.equals( ptpix ) )
		{
			// nothing changed, don't update
			return;
		}
	}
	/* remove old sprite(s) */
	removeText();

    /* If matrix selected is other than 'all', then sprite is displayed along with corner, anchor holds this position */
	var anchor = new THREE.Vector4();
	anchor.copy( ptm );
	
	var myfontsize = 16;
	/* Matrix t odisplay */
	var hl = [];
	
	/* Indicates whether matrix should be displayed on left side or along with corner */
	var screenlock = false;
	var displayList = [ viewMode ];
	if ( viewMode == 'all' ) {
		displayList = [ 'model', 'view', 'projection', 'window' ];
		screenlock = true;
	}
	
	/* Message list ( text ) of sprite object */
	var messageList = [];

	/* Looping through each mode to display */
	for ( var modenum = 0; modenum < displayList.length; modenum++ )  {
		
		// hard-wired offset
		if ( screenlock )
			anchor.set(10, 10 + modenum * canvasHeight * effectController.textscale / 5, 0.5 );
			
		messageList = [];	// clear each time
		var i = 0;
		var c,r;

		switch ( displayList[ modenum ] ) {
		default:
		case 'model':
		    /**
			 *   World Space Matrix = [ World Matrix ][ Model Point Matrix  ] 
			 */
			
			messageList[i] = " world-space \n point\n";
			setVector4Highlights( ptm, prevPtm, hl );
			messageList[i] += sprintf( "%s%9.2f%s\n%s%9.2f%s\n%s%9.2f%s\n%s%6.0f%s",
					hl[0], ptm.x, hl[1], hl[2], ptm.y, hl[3], hl[4], ptm.z, hl[5], hl[6], ptm.w, hl[7]  );
			i++;

			messageList[i] = "\n\n\n=";
			i++;

			messageList[i] = " Model (World) Matrix \n\n";
			for ( c = 0; c < 4; c++ ) {
				for ( r = 0; r < 4; r++ ) {
					setHighlights( cube.matrixWorld.elements[r*4+c], prevMatrixWorld.elements[r*4+c], hl );
					messageList[i] += sprintf( "%s%6.2f%s", hl[0], cube.matrixWorld.elements[r*4+c], hl[1] );
					messageList[i] += " ";
				}
				if ( c < 3 )
					messageList[i] += "\n";
			}
			i++;
			
			/* Note: no highlighting done, as it's not needed - values never change */
			messageList[i] = " model \n point\n";
			messageList[i] += sprintf( "%6.2f\n%6.2f\n%6.2f\n%3.0f  ", pt.x, pt.y, pt.z, pt.w );
			i++;
			break;
		
		case 'view':
		    /**
			 *   View Point Matrix = [ View Matrix ][ World Matrix  ] 
			 */
			messageList[i] = " view-space \n point\n";
			setVector4Highlights( ptv, prevPtv, hl );
			
			messageList[i] += sprintf( "%s%9.2f%s\n%s%9.2f%s\n%s%9.2f%s\n%s%6.0f%s",
					hl[0], ptv.x, hl[1], hl[2], ptv.y, hl[3], hl[4], ptv.z, hl[5], hl[6], ptv.w, hl[7]  );
			i++;

			messageList[i] = "\n\n\n=";
			i++;

			messageList[i] = " View Matrix\n\n";
			for ( c = 0; c < 4; c++ ) {
				for ( r = 0; r < 4; r++ ) {
					setHighlights( camera.matrixWorldInverse.elements[r*4+c], prevMatrixWorldInverse.elements[r*4+c], hl );
					messageList[i] += sprintf( "%s%7.2f%s", hl[0], camera.matrixWorldInverse.elements[r*4+c], hl[1] );
				}
				if ( c < 3 )
					messageList[i] += " \n";
			}
			i++;
			
			messageList[i] = " world\n\n";
			setVector4Highlights( ptm, prevPtm, hl );
			messageList[i] += sprintf( "%s%6.2f%s \n%s%6.2f%s \n%s%6.2f%s \n%s%3.0f%s   ",
					hl[0], ptm.x, hl[1], hl[2], ptm.y, hl[3], hl[4], ptm.z, hl[5], hl[6], ptm.w, hl[7]  );
			i++;
			break;
		
		case 'projection':
		    /**
			 * Projection matrix is calculated, Then  
			 * Normal Device coordinate( unit matrix of clip coordinate matrix ) = [ Clip coordinates ] = [ Projection Matrix ][ View Matrix ] 
			 */
			messageList[i] = " W-divide \n for NDC \n";
			setVector4Highlights( ptndc, prevPtndc, hl );
			messageList[i] += sprintf( "%s%7.3f%s\n%s%7.3f%s\n%s%7.3f%s\n%s%3.0f%s ",
					hl[0], ptndc.x, hl[1], hl[2], ptndc.y, hl[3], hl[4], ptndc.z, hl[5], hl[6], ptndc.w, hl[7]  );
			i++;

			messageList[i] = "\n\n\n<=";
			i++;

			if ( ptndc.x < -1 || ptndc.x > 1 || ptndc.y < -1 || ptndc.y > 1 || ptndc.z < -1 || ptndc.z > 1 ) {
				messageList[i] = " *clip* \n";
				sphereMaterial.color.set( 0xff0000 );
			} else {
				messageList[i] = " clip \n";
				sphereMaterial.color.set( 0x00cccc );
			}
			
			messageList[i] += " coords \n";
			setVector4Highlights( ptvp, prevPtvp, hl );
			messageList[i] += sprintf( "%s%6.2f%s\n%s%6.2f%s\n%s%6.2f%s\n%s%6.2f%s ",
					hl[0], ptvp.x, hl[1], hl[2], ptvp.y, hl[3], hl[4], ptvp.z, hl[5], hl[6], ptvp.w, hl[7]  );
			i++;

			messageList[i] = "\n\n\n=";
			i++;

			messageList[i] = " Projection Matrix\n\n";
			for ( c = 0; c < 4; c++ ) {
				setHighlights( camera.projectionMatrix.elements[c], prevProjectionMatrix.elements[c], hl );
				messageList[i] += sprintf( "%s%6.2f%s", hl[0], camera.projectionMatrix.elements[c], hl[1] );
				setHighlights( camera.projectionMatrix.elements[4+c], prevProjectionMatrix.elements[4+c], hl );
				messageList[i] += sprintf( "%s%6.2f%s", hl[0], camera.projectionMatrix.elements[4+c], hl[1] );
				setHighlights( camera.projectionMatrix.elements[8+c], prevProjectionMatrix.elements[8+c], hl );
				messageList[i] += sprintf( "%s%7.2f%s", hl[0], camera.projectionMatrix.elements[8+c], hl[1] );
				setHighlights( camera.projectionMatrix.elements[12+c], prevProjectionMatrix.elements[12+c], hl );
				messageList[i] += sprintf( "%s%7.2f%s ", hl[0], camera.projectionMatrix.elements[12+c], hl[1] );

				if ( c < 3 )
					messageList[i] += "\n";
			}
			i++;
			
			messageList[i] = " view\n point\n";
			setVector4Highlights( ptv, prevPtv, hl );
			messageList[i] += sprintf( "%s%6.2f%s \n%s%6.2f%s \n%s%6.2f%s \n%s%3.0f%s ",
					hl[0], ptv.x, hl[1], hl[2], ptv.y, hl[3], hl[4], ptv.z, hl[5], hl[6], ptv.w, hl[7]  );
			i++;
			break;

		case 'window':
			/**
			 * NDC to pixel coordinates
			 * [ Window coordinate ] = [ Window Matrix ][ NDC ] 
			 */
			messageList[i] = " window \n coords\n";
			setVector4Highlights( ptpix, prevPtpix, hl );
			messageList[i] += sprintf( "%s%7.1f%s\n%s%7.1f%s\n%s%7.3f%s\n%s%4.0f%s ",
					hl[0], ptpix.x, hl[1], hl[2], ptpix.y, hl[3], hl[4], ptpix.z, hl[5], hl[6], ptpix.w, hl[7]  );
			i++;

			messageList[i] = "\n\n\n=";
			i++;

			messageList[i] = " Window (Screen) Matrix\n\n";
			for ( c = 0; c < 4; c++ ) {
				setHighlights( windowMatrix.elements[c], prevWindowMatrix.elements[c], hl );
				messageList[i] += sprintf( "%s%7.2f%s", hl[0], windowMatrix.elements[c], hl[1] );
				setHighlights( windowMatrix.elements[4+c], prevWindowMatrix.elements[4+c], hl );
				messageList[i] += sprintf( "%s%7.2f%s", hl[0], windowMatrix.elements[4+c], hl[1] );
				setHighlights( windowMatrix.elements[8+c], prevWindowMatrix.elements[8+c], hl );
				messageList[i] += sprintf( "%s%5.2f%s", hl[0], windowMatrix.elements[8+c], hl[1] );
				setHighlights( windowMatrix.elements[12+c], prevWindowMatrix.elements[12+c], hl );
				messageList[i] += sprintf( "%s%7.2f%s ", hl[0], windowMatrix.elements[12+c], hl[1] );

				if ( c < 3 )
					messageList[i] += "\n";
			}
			i++;
			
			messageList[i] = " NDC  \n\n";
			setVector4Highlights( ptndc, prevPtndc, hl );
			messageList[i] += sprintf( "%s%7.3f%s \n%s%7.3f%s \n%s%7.3f%s \n%s%3.0f%s ",
					hl[0], ptndc.x, hl[1], hl[2], ptndc.y, hl[3], hl[4], ptndc.z, hl[5], hl[6], ptndc.w, hl[7]  );
			i++;
			break;
		}
		
		/* Creating sprite object */
		spritey[modenum] = makeTextSprite( messageList, 
			{ fontsize: myfontsize, 
			  fontface: "Courier New", 
			  borderColor: {r:0, g:0, b:255, a:1.0}, 
			  textColor: {r:50, g:50, b:50, a:1.0}, 
			  highlightColor: {r:255, g:0, b:0, a:1.0},
			  backgroundColor: {r:255, g:255, b:255, a:0.8},
			  fill: true,
			  useScreenCoordinates: true
			} );
		
		spritey[modenum].position.copy(anchor);
		if ( viewMode != 'all' ) {
			spritey[modenum].position.x += 0.5;
			spritey[modenum].position.z += 0.5;
		}

		sceneText.add( spritey[modenum] );

	}
    
	/* Updating matrices */
	prevMatrixWorld.copy( cube.matrixWorld );
	prevPtm.copy( ptm );
	prevMatrixWorldInverse.copy( camera.matrixWorldInverse );
	prevPtv.copy( ptv );
	prevProjectionMatrix.copy( camera.projectionMatrix );
	prevPtvp.copy( ptvp );
	prevPtndc.copy( ptndc );
	prevWindowMatrix.copy( windowMatrix );
	prevPtpix.copy( ptpix );
	
}

setupGui();
init();
animate();
