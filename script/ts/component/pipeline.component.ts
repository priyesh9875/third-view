import { Component, OnInit } from  '@angular/core';

import { animateCallback } from  '../assets';

/* Effect controller parameters */
interface effectController  {
		fov: number,
		near: number,
		far: number,
		transx: number,
		transy: number,
		transz: number,
		rotx: number,
		roty: number,
		rotz: number,
		scale: number,
		matrix: string,
		perm: boolean,
		viewport: string,
		grid: boolean,
		xgrid: boolean,
		zgrid: boolean,
		ndc: boolean,
		textscale: number,
		help: boolean
};

interface colorSet {
    r: number;
    g: number;
    b: number;
    a?: number;
}

/* makeTextSprite function parameters */
interface makeTextSpriteParam {
    fontSize: number;
    fontFace: string;
    borderColor: colorSet;
    textColor: colorSet;
    backGroundColor: colorSet;
    fill: boolean;
    borderThickness?: number;
    highlightColor?: colorSet;
    textAlignment?: string;
    showRect?: boolean;
}

@Component( {
    selector: "view-pipeline",
    templateUrl: "partials/view-pipeline.html"
} )

/**
 * This class shows 3D viewing pipeling in computer graphics
 * Basically it as follows :
 * MODEL coordinate => WORLD coordinaters => VIEW coordinate => NORMAL coordinates => DEVICE coordinates
 * Reference : https://github.com/udacity/cs291/blob/master/demo/unit7-view-pipeline.js
 *             http://threejs.org/examples/#webgl_sprites
 */
export class PipelineComponent implements OnInit {
    
    /* Title to be displayed in HTML file */
    title: string;
    
    private container;                             /* Main container to which renderer will be appended. Min size : 1060 X 500 px */
    private renderer: THREE.WebGLRenderer;         /* WebGL renderer to render scene */
    private scene: THREE.Scene;                    /* Main scene */
    private camera: THREE.PerspectiveCamera;       /* Main camera */
    private orthoCamera: THREE.OrthographicCamera; /* OrthoCamera to render sprite materials, matrix which appear on screen */
    private controls: THREE.OrbitControls;         /* Mouse controller */
    private stats: Stats;                          /* Performance moniter */
    
    /* Setup parameter for gui and other stuff */
    private effectController: effectController;    /* Control option to control scene */
    private gui;                                   /* GUI object */
    private width: number;                         /* Renderer width */
    private height: number = 500;                  /* Renderer height */
    private sceneText: THREE.Scene;                /* Scene object to hold sprite matrices */
    private frustumCam: THREE.OrthographicCamera | THREE.PerspectiveCamera; /* Frustum camera, it can be ortho or perspective */
    private frustumTarget: THREE.Vector3;          /* LookAt target for frustum camera */
    private sceneFrustum: THREE.Scene;             /* Scene for frustum camera */
    
    private cube: THREE.Mesh;                      /* Main cube object */
    private corner: THREE.Mesh ;                   /* Corner of the cube, its a sphere */
    private cornerGeomtery : THREE.Mesh;           /* Corner geometry, sphere */
    private light: THREE.PointLight;               /* Point light */
    private groundGrid: THREE.Mesh;                /* Main grid */
    private moreGround: THREE.Mesh;                /* Small grid at center */
    private axis1: THREE.Mesh;                     /* X axis, a cyliner to make axis visible */
    private axis2: THREE.Mesh;                     /* Z axis */
    private xGrid: THREE.Mesh;                     /* X grid */
    private zGrid: THREE.Mesh;                     /* Z grid */
    private spritey: THREE.Sprite[] = [];          /* Sprite array to hold all sprite object, matrices */
    private sphereMaterial : THREE.MeshBasicMaterial;   /* Mateiral of sphere, corner of cube */
    private lineMaterial: THREE.LineBasicMaterial[]; /* Line material used to draw axis */
    
    private viewMode: string;                      /* ViewMode determines which matrix to be shown, It can be "all", "model", "view", "projection" or "window" */
    private EXTRA_CUSHION: number = 3;             /* Used for padding in sprites */
    private boxSize: THREE.Vector3;                /* Size of cube */
    private clearColor = 0xe6e6e6;                 /* Color of renderer */
    
    private prevMatrixWorld = new THREE.Matrix4(); /* Previous state matrix of cube, used to determine whether to update sprite or not */   
    private prevPtm = new THREE.Vector4();         /* Previous state matrix of point on cube */
    
    private prevMatrixWorldInverse = new THREE.Matrix4(); /* Previous state matrix of world */
    private prevPtv = new THREE.Vector4();                /* Previous state vector of point on cube */
    private prevProjectionMatrix = new THREE.Matrix4();   /* Previous state matrix of projection */
    private prevPtvp = new THREE.Vector4();               /* Previous state vector of projection */
    private prevPtndc = new THREE.Vector4();              /* Previous state vector of normal device coordinate of point on cube */ 
    private prevWindowMatrix = new THREE.Matrix4();       /* Previous state matrix of window */
    private prevPtpix = new THREE.Vector4();              

    private firstRenderTarget;                     /* Renderer buffer target for frustum */   
    private screenMaterial;                        /* Sprite material */

    private EPSILON = 0.00001;                     /* Deciding letiables whether new value to be place on sprite or not */
    private oldViewport = '';	                   /* Viewport off to start */

    private frustumPoints = [];                    /* Frustum points to draw frustum */
    private lineGeometry = [];                     /* Frustum geometry */
    private depthFaceGeometry = [];                /* Frustum depth faces */
    private sideFaceGeometry = [];                 /* Frustum side faces */
    private tipGeometry = [];                      /* Frustum tip face */
        
    aniCallback: animateCallback[];                /* Array callbacks to animate function */
    
    constructor() {
       console.clear();
       
        this.title =  "View Pipeline demo";
        
        /* offscreen render target for viewport's near-frustum rectangle */
        this.firstRenderTarget = new THREE.WebGLRenderTarget( 512, 512, {
            format: THREE.RGBFormat
        } );
        
        /* This is the small window which opens at bottom left when Show frustum is selected */
        this.screenMaterial = new THREE.MeshBasicMaterial( {
            map: this.firstRenderTarget, transparent: true, opacity: 0.9
        } );
        
        this.boxSize = new THREE.Vector3( 8, 10, 6 );
        
        /* Creating scene objects */
        this.scene = new THREE.Scene();
        this.scene.translateY( -5 );
        this.scene.name = "Main Scene ";
        this.sceneText = new THREE.Scene();
        this.sceneText.name = "Sprite scene";
        
        /* Initializing animation callbacks */
        this.aniCallback = [];
        
        /* Initializing effectController options */
        this.effectController = {
                fov: 35,
                near: 12,
                far: 150,
                transx: 0,
                transy: 5,
                transz: 0,
                rotx: 0,
                roty: 0,
                rotz: 0,
                scale: 1,
                matrix: 'all',
                perm: true,
                viewport: 'off',
                grid: true,
                xgrid: false,
                zgrid: false,
                ndc: false,
                textscale: 1,
                help: false
        };
       
    }
    
    ngOnInit(): void {
        /**
         * This function will be called when Component has been placed in DOM 
         */
        this.container = $( "#graphics-space" );
        this.width = this.container.width() - 25;
   
        /**
         * Setting up renderer engine
         * This can't be done in constructor function 
         * Because in constructor, #graphics-space element won't be available
         */
        this.renderer = new THREE.WebGLRenderer( { antialias: true } );
        this.renderer.setClearColor( this.clearColor, 1.0 );
        /* Setting auto clear to false to draw multiple viewports */
        this.renderer.autoClear = false; 
        this.renderer.setSize( this.width, this.height ); 
        this.renderer.setPixelRatio( window.devicePixelRatio );
        /* Appending renderer in dom as native DOM element ( canvas ) */
        this.container.append( this.renderer.domElement );

        /* Setting up main camera */ 
        this.camera = new THREE.PerspectiveCamera( this.effectController.fov,
                                                    this.width / this.height,
                                                    this.effectController.near,
                                                    this.effectController.far );

        this.camera.position.set( 10, 15, 40 )
        this.camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );

        /* Sprite rendering camera */                                            
        this.orthoCamera = new THREE.OrthographicCamera( this.width/ -2, this.width / 2, this.height/2, this.height/ -2, 1, 1000 );
        this.orthoCamera.position.z = 10;
                                                    
        
        this.frustumTarget = new THREE.Vector3();
        this.frustumTarget.set( 0, 0, 0 );
        
        /*  Attaching mouse control to renderer */
        this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
        this.controls.target.set( 0, 0, 0 );
        
        /* Stats moniter, top left */
        this.stats = new Stats();
        /* quick fix, domElement doesn't exists on stats. Instead "dom" property exists but not working */
        let stats: any = this.stats;
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = "13px";
        stats.domElement.style.top = this.container.offset().top - $( window ).scrollTop() + "px";
        this.container.append( stats.domElement );
        

        /**
         * ====================Your turn========================
         * Main scene editing should start here  
         */
        
        this.createScene();
        
        /* Positioning and setting up GUI menu */
        this.setUpGUI();
        
        /**
         * ====================STOP, its my turn========================
         * Main scene editing should end here  
         */
        
        /* Attaching event resize listener on window */
        window.addEventListener("resize", () => { this.resize( this )  }, false );
        
        /* Calling animation loop */
        this.animate( this.aniCallback );
        
    }
    
    setUpGUI(): void {
        
        /* Initializing GUI menu object */
        /* Positioning and setting up GUI menu */
        this.gui = new dat.GUI( { autoplace: false });
        this.gui.domElement.id = "gui";

        let self = this;
        this.container.append( $("#gui") );
        let gui = this.gui;
        this.effectController.matrix = "view";
                
	    this.effectController.fov = this.camera.fov;
        this.effectController.near = this.camera.near;
        this.effectController.far = this.camera.far;

        let  model = gui.addFolder('Model manipulation');
        model.add( this.effectController, "transx", -20.0, 20.0 ).name("X translation").onChange( ( v ) => { this.cube.position.x = v  } ) ;
        model.add( this.effectController, "transy", -20.0, 20.0 ).name("Y translation").onChange( ( v ) => { this.cube.position.y = v  } ) ;
        model.add( this.effectController, "transz", -20.0, 20.0 ).name("Z translation").onChange( ( v ) => { this.cube.position.z = v  } ) ;
        model.add( this.effectController, "rotx", 0, 360.0 ).name("X rotation").onChange( ( v ) => { this.cube.rotation.x = v * Math.PI / 180 } ) ;
        model.add( this.effectController, "roty", 0, 360.0 ).name("Y rotation").onChange( ( v ) => { this.cube.rotation.y = v * Math.PI / 180 } ) ;
        model.add( this.effectController, "rotz", 0, 360.0 ).name("Z rotation").onChange( ( v ) => { this.cube.rotation.z = v * Math.PI / 180 } ) ;
        model.add( this.effectController, "scale", 0.1, 2.0 ).name("Scale").onChange( ( v ) => { this.cube.scale.set( v, v,v  ) } ) ;
        
        let camera = gui.addFolder('Camera manipulation');
        camera.add( this.effectController, "fov", 1.0, 179.0 ).name("Field of view");
        camera.add( this.effectController, "near", 1.0, 50.0 ).name("Near plane");
        camera.add( this.effectController, "far", 20.0, 200.0 ).name("Far plane");
        
        let control = gui.addFolder( "Control" );
        control.add( this.zGrid, "visible" ).name( "Z Grid" );
        control.add( this.xGrid, "visible" ).name( "X Grid" );
        
        /* Removing all sprites when matrix mode changes, because animation loop will draw it again */
        gui.add( this.effectController, "matrix", [ 'model', 'view', 'projection', 'window', 'all' ] ).name( "Watch matrix" ).onChange( ( v ) => { self.removeText(); } );
        
        gui.add( this.effectController, "viewport", [ 'off', 'volume', 'near/far', 'depths' ] ).name( "Show frustum" );
        
    }
   
    createScene(): void {
        /**
         * This method actually created all the objects in the scene 
         */
        
        /* lights */
        this.light = new THREE.PointLight( 0xffffff );
        this.light.position.set( 0, 25, 0 );
        this.scene.add( this.light );
        this.scene.add( new THREE.AmbientLight( 0x404040 ) );
        
        /* ground */
        this.lineMaterial = [];
        let colors = [ 0x0, 0x636363, 0x888888, 0xa3a3a3, 0xbababa ];
        for( let c of colors ) {
            this.lineMaterial.push( new THREE.LineBasicMaterial( { color: c } ) );
        }
        
        /* gound grid */
        let fullWireMaterial = new THREE.MeshLambertMaterial( {
            color: 0xffffff00, wireframe: true
        } );
        
        this.groundGrid = new THREE.Mesh( new THREE.PlaneGeometry( 60, 60, 6, 6 ), fullWireMaterial );
        this.groundGrid.rotation.x = -Math.PI / 2;
        this.scene.add( this.groundGrid );
        
        /* Small grid at center */
        this.moreGround = new THREE.Mesh(
        new THREE.PlaneGeometry( 20, 20, 20, 20 ), fullWireMaterial );
        this.moreGround.rotation.x = - Math.PI / 2;
        this.scene.add( this.moreGround );

        
        /* thicker axes */
        this.axis1 = new THREE.Mesh( new THREE.CylinderGeometry( 0.05, 0.05, 10, 8, 1, true ), fullWireMaterial );
        this.axis1.rotation.z = 90 * Math.PI/180;
        this.axis1.position.x = -5;
        this.scene.add( this.axis1 );

        this.axis2 = new THREE.Mesh( new THREE.CylinderGeometry( 0.05, 0.05, 10, 8, 1, true ), fullWireMaterial );
        this.axis2.rotation.x = -90 * Math.PI/180;
        this.axis2.position.z = -5;
        this.scene.add( this.axis2 );

        /* vertical grids */
        this.xGrid = new THREE.Mesh( new THREE.PlaneGeometry( 20, 10, 20, 10 ), new THREE.MeshBasicMaterial( { color: 0xaa0000, wireframe: true } ) );
        this.xGrid.rotation.y = - Math.PI / 2;
        this.xGrid.position.y = 5;
        this.xGrid.visible = false;
        this.scene.add( this.xGrid );
        
        this.zGrid = new THREE.Mesh( new THREE.PlaneGeometry( 20, 10, 20, 10 ), new THREE.MeshBasicMaterial( { color: 0x0000aa, wireframe: true } ) );
        this.zGrid.position.y = 5;
        this.zGrid.visible = false;
        this.scene.add( this.zGrid );

        /* quick fix, Coordinates refer to external script, not inbuilt one */
        let coords: any = Coordinates;
        coords.drawAllAxes( this.scene ,{ axisLength:16.2, axisRadius:0.2, axisTess:20 } );
        
        /* Main object in scene, CUBE LOL*/
        let cubeGeometry = new THREE.CubeGeometry( this.boxSize.x, this.boxSize.y, this.boxSize.z );
        let cubeMaterial = new THREE.MeshLambertMaterial( { color: 0xff99ff } );
        this.cube = new THREE.Mesh( cubeGeometry, cubeMaterial );
        this.cube.position.set( 0, this.boxSize.y / 2, 0 );
        this.cube.name = "Cube";
        this.scene.add( this.cube );
        
        /* Corner of cube */
        let cornerGeometry = new THREE.SphereGeometry( 0.3 );
        this.sphereMaterial = new THREE.MeshBasicMaterial( { color: 0x00cccc } );
        this.corner = new THREE.Mesh( cornerGeometry, this.sphereMaterial );
        this.corner.position.set( this.boxSize.x / 2, this.boxSize.y / 2,this.boxSize.z / 2 );
        this.corner.name = "corner";
        this.cube.add( this.corner );

    } 
    
    animate( callback: animateCallback[] ): void {
        /**
         * Animation method for scene
         * User can pass array of callbacks implementing their own animation logic 
        */
      
        window.requestAnimationFrame( () => { this.animate( callback ) } );
        
        /* Begining of clock of stats: Performance Moniter */
        this.stats.begin();
        
        /* Calling each animation callback provided */
        for ( let f of callback ) {
           if( typeof f === 'function') {
               f();
           }
        }
		
        /* Updating camera */
        this.camera.fov = this.effectController.fov;
        this.camera.near = this.effectController.near;
        this.camera.far = this.effectController.far;
        this.camera.updateProjectionMatrix();
        
        /* Updating light position, it will always from user side */
        this.light.position.copy( this.camera.position );
        
        let force = ( this.viewMode != this.effectController.matrix );
        
        this.viewMode = this.effectController.matrix;
        
        /* Creating initial sprites */
        this.createText( force );

        /* clear whole screen with proper clear color */
        this.renderer.clear();
        this.renderer.render( this.scene, this.camera );
        
        // show viewport
        if ( this.effectController.viewport != 'off' ) {
            
            let viewSize = 60;
            
            /* render to target, and include in scene. This is little scene which appear on near place of frustum camera */
            this.renderer.render( this.scene, this.camera, this.firstRenderTarget, true );

            let aspect = this.width / this.height;
            if ( this.effectController.viewport === 'volume' )
            {
                /* use perspective camera - helps visualization a lot */
                this.frustumCam = new THREE.PerspectiveCamera( 40, aspect, 1, 150 );
                this.frustumCam.position.set( 60, 35, 0 );
                this.frustumCam.lookAt( new THREE.Vector3( 0, 0, 0 ) );
            }
            else
            {
                /* use orthographic camera */
                this.frustumCam = new THREE.OrthographicCamera( -aspect * viewSize / 2, 
                                                                 aspect * viewSize / 2,
                                                                 viewSize / 2, -viewSize / 2,
                                                                 0, 500
                                                              );
                /* Offset position from top */
                let verticalOffset = 10;
                this.frustumCam.position.set( 250, verticalOffset, 0 );
                this.frustumTarget.set( 0, verticalOffset, 0 );
                this.frustumCam.lookAt( this.frustumTarget );
            }
            
            this.light.position.copy( this.frustumCam.position);
            
            /* viewport render */
            /* setScissor could be set just once in this particular case, since it never changes, and then just enabled/disabled */
            this.renderer.enableScissorTest( true );
            
            let viewsize = 0.45;
            let borderh = 4 / this.width;
            let borderv = 4 / this.height;
            let margin = 0.00;
            
            // background black
            /* this.renderer.setClearColor( 0xff0000, 1.0 );
            this.renderer.setScissor( ( 1.0 - margin - viewsize - borderh ) * this.width, 
                                      margin * this.height, 
                                      ( viewsize + borderh ) * this.width, 
                                      ( viewsize + borderv ) * this.height 
                                    );
                                    
            this.renderer.setViewport( ( 1.0 - margin - viewsize - borderh ) * this.width, 
                                      margin * this.height, 
                                      ( viewsize + borderh ) * this.width, 
                                      ( viewsize + borderv ) * this.height 
                                    );
            
            this.renderer.clear();
            */
            /* viewport itself, main scene rendering with frustum camera */
            /* Rendering only required viewport, not full */
            
            this.renderer.setClearColor( this.clearColor, 1.0 );
            this.renderer.setScissor( ( 1.0 - margin - viewsize - borderh / 2 ) * this.width, 
                                      ( margin + borderv / 2 ) * this.height,
                                      viewsize * this.width, 
                                      viewsize * this.height 
                                    );
                                    
            this.renderer.setViewport( ( 1.0 - margin - viewsize - borderh / 2 ) * this.width, 
                                      ( margin + borderv / 2 ) * this.height,
                                      viewsize * this.width, 
                                      viewsize * this.height 
                                    );
            this.renderer.clear();
            this.renderer.render( this.scene, this.frustumCam );	

            /* create frustum and display */
            this.createFrustum( ( this.effectController.viewport == 'depths') ? 5: 2,
                                ( this.effectController.viewport == 'volume'),
                                this.oldViewport !== this.effectController.viewport 
                              );

            this.oldViewport = this.effectController.viewport;
            
            /* Rendering frustum camera */
            this.renderer.render( this.sceneFrustum, this.frustumCam );
            
            
            /* Restoring original viewport to render main scene */
            this.renderer.setViewport( 0, 0, this.width, this.height );
            this.renderer.enableScissorTest( false );
        }
       
       /* Rendering sprite scene with orthographic camera */
       this.renderer.render( this.sceneText, this.orthoCamera );
       
       /* End of 1 stats cycle */
       this.stats.end();

    }
    
    makeTextSprite( messageList: Array<any>, parameter: makeTextSpriteParam ): THREE.Sprite {
        /**
         * This method creates sprite object
         */
        let fontFace = parameter.fontFace;
        let fontSize = parameter.fontSize;
        let borderThickness = parameter.borderThickness ?  parameter.borderThickness : 1.5;
        
        let borderColor = parameter.borderColor ? parameter.borderColor : { r:0, g:0, b:0, a:1.0 };
        
        let textColor = parameter.textColor ? parameter.textColor : { r:60, g:60, b:60, a:1.0 };

        let highlightColor = parameter.highlightColor ? parameter.highlightColor : { r:0, g:0, b:0, a:1.0 };

        let backgroundColor = parameter.backGroundColor ? parameter.backGroundColor : { r:0, g:0, b:0, a:1.0 };

        let textAlignment = parameter.textAlignment ? parameter.textAlignment : 'left' ;

        let fill = parameter.fill ? parameter.fill : true ;
            
        let showRect = parameter.showRect ? parameter.showRect : true ;
            
        let canvas = document.createElement( "canvas" );
        canvas.width = this.width;
        canvas.height = this.height;
        
        let context = canvas.getContext( "2d" );
        context.font = `Bold ${ fontSize }px ${ fontFace }`;
        
        /* border color */
        context.strokeStyle = `rgba( ${ borderColor.r }, ${ borderColor.g }, ${ borderColor.b }, ${ borderColor.a } )`;
        
        let offsetx = 0;
        let metrics;
        for ( let mchunk in  messageList ) {
            let dofill = true;
            let message = messageList[ parseInt( mchunk ) ];

            /* find number of lines in text message */
            let rawStringList = [];
            rawStringList = message.split("\n");
            let lines = rawStringList.length;
                
            /* normal text, so remove all inside * *     */
            let normalText = 1;

            let normalStringList = [];
            let highlightStringList = [];
            /* make a list with no "*" in it, so we can get line lengths */
            let cleanStringList = [];
            for ( let ln in  rawStringList )
            {
                let buffer = rawStringList[parseInt( ln ) ];
                normalStringList[parseInt( ln ) ] = "";
                highlightStringList[parseInt( ln ) ] = "";
                cleanStringList[parseInt( ln ) ] = "";
                for ( let chpos = 0; chpos < buffer.length; chpos++ )
                {
                    if ( buffer.charAt(chpos) == '=' )
                        dofill = false;

                    if ( buffer.charAt(chpos) == '*' )
                    {
                        normalText = 1 - normalText;
                    }
                    else
                    {
                        cleanStringList[parseInt( ln ) ] += buffer.charAt(chpos);
                        if ( normalText )
                        {
                            normalStringList[parseInt( ln ) ] += buffer.charAt(chpos);
                            highlightStringList[parseInt( ln ) ] += " ";
                        }
                        else
                        {
                            normalStringList[parseInt( ln ) ] += " ";
                            highlightStringList[parseInt( ln ) ] += buffer.charAt(chpos);
                        }
                    }
                }
            }
            if ( dofill )
            {
                context.font = `Bold ${fontSize}px ${fontFace}`;
            }
            else
            {
                /* if no rectangle surrounds, make text faster */
                context.font = `Bold ${ fontSize }px ${ fontFace }`;
            }
            
            let textWidth = -99;
            for ( let i = 0; i < cleanStringList.length; i++ )
            {
                /* get size data (height depends only on font size) */
                metrics = context.measureText( cleanStringList[i] );
                if ( metrics.width > textWidth )
                    textWidth = metrics.width;
            }
            
            if ( showRect && dofill )
            {
                context.lineWidth = borderThickness;
                context.fillStyle = `rgba( ${backgroundColor.r}, ${backgroundColor.g}, ${backgroundColor.b}, ${backgroundColor.a} )`;
                // 1.2 + 0.2 is extra height factor for text below baseline: g,j,p,q.
                this.roundRect( context, offsetx, borderThickness / 2, borderThickness / 2, textWidth + borderThickness + 2 * this.EXTRA_CUSHION,
                        fontSize * ( 1.2 * lines + 0.2 ) + borderThickness + 2 * this.EXTRA_CUSHION, 6, fill );
            }
                
            for ( let style = 0; style < 2; style++ ) {
                /* text color */
                if ( style === 0 ){
                    context.fillStyle = `rgba( ${textColor.r}, ${textColor.g}, ${textColor.b}, ${textColor.a} )`;
                } else {
                    context.fillStyle = `rgba( ${highlightColor.r}, ${highlightColor.g}, ${highlightColor.b}, ${highlightColor.a} )`;
                }

                for ( let i = 0; i < cleanStringList.length; i++ ) {
                    metrics = context.measureText( cleanStringList[ i ] );
                    context.fillText( style ? highlightStringList[ i ] : normalStringList[ i ], 
                                      offsetx + borderThickness + this.EXTRA_CUSHION + ( textAlignment == 'right' ? textWidth - metrics.width : 0 ),
                                      ( i + 1 ) * ( fontSize * 1.2 ) + borderThickness + this.EXTRA_CUSHION
                                    );
                }
            }
            /* reset to default font size */
            context.font = `Bold ${ fontSize }px ${ fontFace }`;
            offsetx += textWidth + 2.5*borderThickness + 2*this.EXTRA_CUSHION;
        }
        
        /* canvas contents will be used for a texture on sprite */
        let texture = new THREE.Texture( canvas );
        texture.needsUpdate = true;

        let spriteMaterial = new THREE.SpriteMaterial( { map: texture,  } );
        spriteMaterial.map.minFilter = THREE.LinearFilter;

        /* Creating sprite */
        let sprite = new THREE.Sprite( spriteMaterial );
        
        return sprite;
        
    }
    
    roundRect( ctx: CanvasRenderingContext2D, offsetx: number, x: number, y: number, w: number, h: number, r: number, fill: boolean ): void {
        /**
         * method for drawing rounded rectangles
         */
        ctx.beginPath();
        ctx.moveTo( offsetx + x + r, y );
        ctx.lineTo( offsetx + x + w - r, y );
        ctx.quadraticCurveTo( offsetx + x + w, y, offsetx + x + w, y + r );
        ctx.lineTo( offsetx + x + w, y + h - r );
        ctx.quadraticCurveTo( offsetx + x + w, y + h, offsetx + x + w - r, y + h );
        ctx.lineTo( offsetx + x + r, y + h );
        ctx.quadraticCurveTo( offsetx + x, y + h, offsetx + x, y + h - r );
        ctx.lineTo( offsetx + x, y + r );
        ctx.quadraticCurveTo( offsetx + x, y, offsetx + x + r, y );
        ctx.closePath();
        // doesn't work with multiple fills
        if ( fill ) ctx.fill();
        ctx.stroke();   
    }
    
    removeText(): void {
        /**
         * Removes all sprite objects form this scene 
         */
       for ( let sprite of this.sceneText.children ) {
          this.sceneText.remove( sprite );
        }
    }
    
    matrixMatch( mtx1: THREE.Matrix4, mtx2: THREE.Matrix4 ): boolean {
        /**
         * Compares two input matrix for equality
         * Matrix size 4 X 4
         */
        for ( let i = 0; i < 16; i++ ) {
            if ( mtx1.elements[ i ] != mtx2.elements[ i ] )
                return false;
        }
        return true;
    }
    
    setVector4Highlights( pt: THREE.Vector4, prevPt: THREE.Vector4, hl: Array<any> ): void {
        /**
         * Highlights changed values
         */
        hl[0] = hl[1] = ( Math.abs(pt.x - prevPt.x ) < this.EPSILON ) ? "" : "*";
        hl[2] = hl[3] = ( Math.abs(pt.y - prevPt.y ) < this.EPSILON ) ? "" : "*";
        hl[4] = hl[5] = ( Math.abs(pt.z - prevPt.z ) < this.EPSILON ) ? "" : "*";
        hl[6] = hl[7] = ( Math.abs(pt.w - prevPt.w ) < this.EPSILON ) ? "" : "*";
    }
    
    setHighlights( val: number, prevVal: number, hl: Array<any> ): void {
        
        hl[0] = hl[1] = ( Math.abs(val - prevVal ) < this.EPSILON ) ? "" : "*";
    }

    createText( force: boolean ): void {
        /**
         * This method generates sprites text and add it to screen 
         */

        /* Corner point location */        
        let pt = new THREE.Vector4( this.corner.position.x, this.corner.position.y, this.corner.position.z );
        /* Corner point model coordinate */
        let ptm = new THREE.Vector4();
        ptm.copy( pt );
        ptm.applyMatrix4( this.cube.matrixWorld );	

        /* Corner point vector */
        let ptv = new THREE.Vector4();
        ptv.copy( ptm );
        ptv.applyMatrix4( this.camera.matrixWorldInverse );

        /* Corner point projection matrix */
        let ptvp = new THREE.Vector4();
        ptvp.copy( ptv );
        ptvp.applyMatrix4( this.camera.projectionMatrix );
 
        /* Corner point normal coordinates */
        let ptndc = new THREE.Vector4();
        ptndc.copy( ptvp );
        ptndc.divideScalar( ptvp.w );

        let windowMatrix = new THREE.Matrix4( );
        windowMatrix.set(   this.width/2, 0, 0, this.width/2,
                            0, this.height/2, 0, this.height/2, 
                            0, 0, 0.5, 0.5,
                            0, 0, 0, 1
                        );
        
        /* Normal Device to window coordinates */
        let ptpix = new THREE.Vector4();
        ptpix.copy( ptndc );
        ptpix.applyMatrix4( windowMatrix );
        
        /* Factor amount to scale sprite objects */ 
        let scale = { x: 370, y: 175, z: 1 };
        /* Factor amount to position sprite objects */
        let offset = { x: -this.width /2 + 185 , y: this.height / 2 - 140 , z: 0 };
        /* Font size of sprite text */
        let myfontsize = 39;
        
        
        /* if there is no change from the previous */
        if ( !force ) {
            // check previous values
            if ( this.matrixMatch( this.prevMatrixWorld, this.cube.matrixWorld ) &&
                this.prevPtm.equals( ptm ) &&
                this.matrixMatch( this.prevMatrixWorldInverse, this.camera.matrixWorldInverse ) &&
                this.prevPtv.equals( ptv ) &&
                this.matrixMatch( this.prevProjectionMatrix, this.camera.projectionMatrix ) &&
                this.prevPtvp.equals( ptvp ) &&
                this.prevPtndc.equals( ptndc ) &&
                this.matrixMatch( this.prevWindowMatrix, windowMatrix ) &&
                this.prevPtpix.equals( ptpix ) )
            {
                // nothing changed, don't update
                return;
            }
        }
        
        /* remove old sprite(s) */
        this.removeText();
        
        let displayList = [ this.viewMode ];
        if ( this.viewMode == 'all' ) {
            /* Display all sprites */
            displayList = [ 'model', 'view', 'projection', 'window' ];
        }
        
        /* Message list ( text ) of sprite object */
        let messageList = [];
        /* Matrix to display */
        let hl = [];
        
        /* Looping through each mode to display */
        for ( let modenum in displayList ){
            
            messageList = [];	// clear each time
            let i = 0;
            let c,r;

            switch ( displayList[ parseInt( modenum ) ] ) {
                default:
                case 'model':
                        /**
                         *   World Space Matrix = [ World Matrix ][ Model Point Matrix  ] 
                         */
                        
                        messageList[i] = " World-space \n point\n";
                        this.setVector4Highlights( ptm, this.prevPtm, hl );
                        
                        messageList[i] += sprintf( "%s%9.2f%s\n%s%9.2f%s\n%s%9.2f%s\n%s%6.0f%s",
                                hl[ 0 ], ptm.x, hl[ 1 ], hl[ 2 ], ptm.y, hl[ 3 ], hl[ 4 ], ptm.z, hl[ 5 ], hl[ 6 ], ptm.w, hl[ 7 ]  );
                        i++;
                        messageList[i] = "\n\n\n=";
                        i++;
                        
                        messageList[i] = " Model (World) Matrix \n\n";
                        for ( c = 0; c < 4; c++ ) {
                            for ( r = 0; r < 4; r++ ) {
                                this.setHighlights( this.cube.matrixWorld.elements[ r * 4 + c ], 
                                                    this.prevMatrixWorld.elements[ r * 4 + c ], hl 
                                                );
                                messageList[i] += sprintf( "%s%6.2f%s", hl[ 0 ], this.cube.matrixWorld.elements[ r * 4 + c ], hl[ 1 ] );
                                    messageList[i] += " ";
                            }
                            if ( c < 3 )
                                messageList[ i ] += "\n";
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
                    messageList[ i ] = " view-space \n point\n";
                    this.setVector4Highlights( ptv, this.prevPtv, hl );
                    messageList[i] += sprintf( "%s%9.2f%s\n%s%9.2f%s\n%s%9.2f%s\n%s%6.0f%s",
                            hl[ 0 ], ptv.x, hl[ 1 ], hl[ 2 ], ptv.y, hl[ 3 ], hl[ 4 ], ptv.z, hl[ 5 ], hl[ 6 ], ptv.w, hl[ 7 ]  );
                    i++;

                    messageList[i] = "\n\n\n=";
                    i++;

                    messageList[i] = " View Matrix\n\n";
                    for ( c = 0; c < 4; c++ ) {
                        for ( r = 0; r < 4; r++ ) {
                            this.setHighlights( this.camera.matrixWorldInverse.elements[r*4+c], 
                                                this.prevMatrixWorldInverse.elements[ r * 4 + c ], hl 
                                              );
                            messageList[i] += sprintf( "%s%7.2f%s", hl[ 0 ], this.camera.matrixWorldInverse.elements[ r * 4 + c ], hl[ 1 ] );
                        }
                        if ( c < 3 )
                            messageList[i] += " \n";
                    }
                    i++;
                    
                    messageList[i] = " world\n\n";
                    this.setVector4Highlights( ptm, this.prevPtm, hl );
                    messageList[i] += sprintf( "%s%6.2f%s \n%s%6.2f%s \n%s%6.2f%s \n%s%3.0f%s   ",
                            hl[ 0 ], ptm.x, hl[ 1 ], hl[ 2 ], ptm.y, hl[ 3 ], hl[ 4 ], ptm.z, hl[ 5 ], hl[ 6 ], ptm.w, hl[ 7 ]  );
                    i++;
                    break;
                
                case 'projection':
                    /**
                     * Projection matrix is calculated, Then  
                     * Normal Device coordinate( unit matrix of clip coordinate matrix ) = [ Clip coordinates ] = [ Projection Matrix ][ View Matrix ] 
                     */
                    messageList[ i ] = " W-divide \n for NDC \n";
                    this.setVector4Highlights( ptndc, this.prevPtndc, hl );
                    messageList[i] += sprintf( "%s%7.3f%s\n%s%7.3f%s\n%s%7.3f%s\n%s%3.0f%s ",
                            hl[ 0 ], ptndc.x, hl[ 1 ], hl[ 2 ], ptndc.y, hl[ 3 ], hl[ 4 ], ptndc.z, hl[ 5 ], hl[ 6 ], ptndc.w, hl[ 7 ]  );
                    i++;

                    messageList[ i ] = "\n\n\n<=";
                    i++;

                    if ( ptndc.x < -1 || ptndc.x > 1 || ptndc.y < -1 || ptndc.y > 1 || ptndc.z < -1 || ptndc.z > 1 ) {
                        messageList[ i ] = " *clip* \n";
                        this.sphereMaterial.color.set( 0xff0000 );
                    } else {
                        messageList[ i ] = " clip \n";
                        this.sphereMaterial.color.set( 0x00cccc );
                    }
                    messageList[ i ] += " coords \n";
                    this.setVector4Highlights( ptvp, this.prevPtvp, hl );
                    messageList[ i ] += sprintf( "%s%6.2f%s\n%s%6.2f%s\n%s%6.2f%s\n%s%6.2f%s ",
                            hl[ 0 ], ptvp.x, hl[ 1 ], hl[ 2 ], ptvp.y, hl[ 3 ], hl[ 4 ], ptvp.z, hl[ 5 ], hl[ 6 ], ptvp.w, hl[ 7 ]  );
                    i++;

                    messageList[ i ] = "\n\n\n=";
                    i++;

                    messageList[ i ] = " Projection Matrix\n\n";
                    for ( c = 0; c < 4; c++ ) {
                        this.setHighlights( this.camera.projectionMatrix.elements[ c ], this.prevProjectionMatrix.elements[ c ], hl );
                        messageList[ i ] += sprintf( "%s%6.2f%s", hl[ 0 ], this.camera.projectionMatrix.elements[ c ], hl[ 1 ] );
                        this.setHighlights( this.camera.projectionMatrix.elements[ 4 + c ], this.prevProjectionMatrix.elements[ 4 + c ], hl );
                        messageList[ i ] += sprintf( "%s%6.2f%s", hl[ 0 ], this.camera.projectionMatrix.elements[ 4 + c ], hl[ 1 ] );
                        this.setHighlights( this.camera.projectionMatrix.elements[ 8 + c ], this.prevProjectionMatrix.elements[ 8 + c ], hl );
                        messageList[ i ] += sprintf( "%s%7.2f%s", hl[ 0 ], this.camera.projectionMatrix.elements[ 8 + c ], hl[ 1 ] );
                        this.setHighlights( this.camera.projectionMatrix.elements[ 12 + c ], this.prevProjectionMatrix.elements[ 12 + c ], hl );
                        messageList[ i ] += sprintf( "%s%7.2f%s ", hl[ 0 ], this.camera.projectionMatrix.elements[ 12 + c ], hl[ 1 ] );

                        if ( c < 3 )
                            messageList[ i ] += "\n";
                    }
                    i++;
                    
                    messageList[ i ] = " view\n point\n";
                    this.setVector4Highlights( ptv, this.prevPtv, hl );
                    messageList[ i ] += sprintf( "%s%6.2f%s \n%s%6.2f%s \n%s%6.2f%s \n%s%3.0f%s ",
                            hl[ 0 ], ptv.x, hl[ 1 ], hl[ 2 ], ptv.y, hl[ 3 ], hl[ 4 ], ptv.z, hl[ 5 ], hl[ 6 ], ptv.w, hl[ 7 ]  );
                    i++;
                    break;

                case 'window':
                    /**
                     * NDC to pixel coordinates
                     * [ Window coordinate ] = [ Window Matrix ][ NDC ] 
                     */
                    messageList[ i ] = " window \n coords\n";
                    this.setVector4Highlights( ptpix, this.prevPtpix, hl );
                    messageList[ i ] += sprintf( "%s%7.1f%s\n%s%7.1f%s\n%s%7.3f%s\n%s%4.0f%s ",
                            hl[ 0 ], ptpix.x, hl[ 1 ], hl[ 2 ], ptpix.y, hl[ 3 ], hl[ 4 ], ptpix.z, hl[ 5 ], hl[ 6 ], ptpix.w, hl[ 7 ]  );
                    i++;

                    messageList[ i ] = "\n\n\n=";
                    i++;

                    messageList[ i ] = " Window (Screen) Matrix\n\n";
                    for ( c = 0; c < 4; c++ ) {
                        this.setHighlights( windowMatrix.elements[ c ], this.prevWindowMatrix.elements[ c ], hl );
                        messageList[i] += sprintf( "%s%7.2f%s", hl[ 0 ], windowMatrix.elements[ c ], hl[ 1 ] );
                        this.setHighlights( windowMatrix.elements[ 4 + c ], this.prevWindowMatrix.elements[ 4 + c ], hl );
                        messageList[i] += sprintf( "%s%7.2f%s", hl[ 0 ], windowMatrix.elements[ 4 + c ], hl[ 1 ] );
                        this.setHighlights( windowMatrix.elements[ 8 + c ], this.prevWindowMatrix.elements[ 8 + c ], hl );
                        messageList[i] += sprintf( "%s%5.2f%s", hl[ 0 ], windowMatrix.elements[ 8 + c ], hl[ 1 ] );
                        this.setHighlights( windowMatrix.elements[ 12 + c ], this.prevWindowMatrix.elements[ 12 + c ], hl );
                        messageList[i] += sprintf( "%s%7.2f%s ", hl[ 0 ], windowMatrix.elements[ 12 + c ], hl[ 1 ] );

                        if ( c < 3 )
                            messageList[ i ] += "\n";
                    }
                    i++;
                    
                    messageList[ i ] = " NDC  \n\n";
                    this.setVector4Highlights( ptndc, this.prevPtndc, hl );
                    messageList[i] += sprintf( "%s%7.3f%s \n%s%7.3f%s \n%s%7.3f%s \n%s%3.0f%s ",
                            hl[ 0 ], ptndc.x, hl[ 1 ], hl[ 2 ], ptndc.y, hl[ 3 ], hl[ 4 ], ptndc.z, hl[ 5 ], hl[ 6 ], ptndc.w, hl[ 7 ]  );
                    i++;
                    break;
            }
            
            /* Creating spri object */
            this.spritey[ parseInt(modenum) ] = this.makeTextSprite( messageList, 
                        { fontSize: myfontsize, 
                        fontFace: "Courier New", 
                        borderColor: { r:0, g:0, b:255, a:1.0 }, 
                        textColor: { r:50, g:50, b:50, a:1.0 }, 
                        highlightColor: { r:255, g:0, b:0, a:1.0 },
                        backGroundColor: { r:255, g:255, b:255, a:0.8 },
                        fill: true 
            } );
            
            /* Draw individual sprite, i don't have better logic for THREEjs r72 */
            if( $.inArray( "model", displayList ) !== -1 && displayList.length === 1 ) {
                
                this.spritey[parseInt(modenum) ].position.set( offset.x , offset.y , offset.z );
                this.spritey[ parseInt(modenum) ].scale.set( scale.x, scale.y, scale.z )
                this.sceneText.add( this.spritey[ parseInt(modenum) ] );
                
            } else if( $.inArray( "view", displayList ) !== -1 && displayList.length === 1 ) {
                
                this.spritey[ parseInt(modenum) ].position.set( offset.x , offset.y, offset.z );
                this.spritey[ parseInt(modenum) ].scale.set( scale.x, scale.y, scale.z )
                this.sceneText.add( this.spritey[ parseInt(modenum) ] );
                
            } else if( $.inArray( "projection", displayList ) !== -1 && displayList.length === 1 ) {
                
                this.spritey[ parseInt(modenum) ].position.set( offset.x , offset.y, offset.z );
                this.spritey[ parseInt(modenum) ].scale.set( scale.x, scale.y, scale.z  )
                this.sceneText.add( this.spritey[ parseInt(modenum) ] );
                
            } else if( $.inArray( "window", displayList ) !== -1 && displayList.length === 1 ) {
                
                this.spritey[ parseInt(modenum) ].position.set( offset.x , offset.y, offset.z );
                this.spritey[ parseInt(modenum) ].scale.set( scale.x, scale.y, scale.z  )
                this.sceneText.add( this.spritey[ parseInt(modenum) ] );
                
            } 
            
        }
        
        if( this.viewMode === "all"  ) {
            /* Draw all sprite, i don't have better logic for THREEjs r72 */
            
            this.spritey[ 0 ].position.set( offset.x , offset.y, offset.z );
            this.spritey[ 0 ].scale.set( scale.x, scale.y, scale.z )
            this.sceneText.add( this.spritey[ 0 ] );
            
            this.spritey[ 1 ].position.set( offset.x , offset.y - 110 , offset.z );
            this.spritey[ 1 ].scale.set( scale.x, scale.y, scale.z )
            this.sceneText.add( this.spritey[ 1 ] );
            
            this.spritey[ 2 ].position.set( offset.x , offset.y - 220 , offset.z );
            this.spritey[ 2 ].scale.set( scale.x, scale.y, scale.z )
            this.sceneText.add( this.spritey[ 2 ] );
            
            this.spritey[ 3 ].position.set( offset.x , offset.y - 330 , offset.z );
            this.spritey[ 3 ].scale.set( scale.x, scale.y, scale.z )
            this.sceneText.add( this.spritey[ 3 ] );
            }
        
        /* Updating matrices */
        this.prevMatrixWorld.copy( this.cube.matrixWorld );
        this.prevPtm.copy( ptm );
        this.prevMatrixWorldInverse.copy( this.camera.matrixWorldInverse );
        this.prevPtv.copy( ptv );
        this.prevProjectionMatrix.copy( this.camera.projectionMatrix );
        this.prevPtvp.copy( ptvp );
        this.prevPtndc.copy( ptndc );
        this.prevWindowMatrix.copy( windowMatrix );
        this.prevPtpix.copy( ptpix );
        
    }
    
    getWorldLocation( ndc: THREE.Vector4, world: THREE.Vector4 ): void {
        /**
         * This method convert Normal device coordinates to world coordinates 
         */
        let view = new THREE.Vector4();
        view.copy( ndc );
        let invMatrix = new THREE.Matrix4();
        invMatrix.getInverse( this.camera.projectionMatrix );
        view.applyMatrix4( invMatrix );
        view.divideScalar( view.w );
        world.copy( view );
        world.applyMatrix4( this.camera.matrixWorld );
    }

    createFrustum( pointsForDepth: number, faces: boolean, refresh: boolean ): void {
            
            /** 
             * For fastest updating when viewport is on, only remake the frustum when refresh is true. 
             * This is set to true only when the type of viewport changes. 
             * Otherwise, we update the vertice's positions, which is much faster (no memory allocate/free). 
             */
            if ( refresh ) {
                this.sceneFrustum = new THREE.Scene();

                /* turn on depth cueing for perspective (doesn't work for orthographic) */
                if ( faces )
                    this.sceneFrustum.fog = new THREE.Fog( this.clearColor, 30, 140 );
            }

            /** 
             * Draw 12 lines:
             * 4 for frustum edges
             * 4 for near
             * 4 for far
             */
            let world = new THREE.Vector4();
            let v;
            let x,y,z;
            /**
             * Get the points' new locations. 
             * Note that once we have these, many of the follow objects are all set
             * And only need to have their "update" flag set to true.
             */
            for ( x = 0; x <= 1; x++ ) {
                for ( y = 0; y <= 1; y++ ) {
                    for ( z = 0; z < pointsForDepth; z++ ) {
                        let ndc = new THREE.Vector4( x*2-1, y*2-1, (z/(pointsForDepth-1))*2-1 );
                        this.getWorldLocation( ndc, world );
                        this.frustumPoints[ x * 2 * pointsForDepth + y * pointsForDepth + z ] = new THREE.Vector3( world.x, world.y, world. z );
                    }
                }
            }
            
            /* frustum edges */
            let line, mtl, mesh, vcount;
            let gcount = 0;
            for ( x = 0; x <= 1; x++ ) {
                for ( y = 0; y <= 1; y++ ) {
                    if ( refresh ) {
                        this.lineGeometry[ gcount ] = new THREE.Geometry();
                        this.lineGeometry[ gcount ].vertices.push( this.camera.position );
                        this.lineGeometry[ gcount ].vertices.push( this.frustumPoints[ x * 2 * pointsForDepth + y * pointsForDepth + ( pointsForDepth- 1 ) ] );

                        line = new THREE.Line( this.lineGeometry[ gcount++ ], this.lineMaterial[ 0 ] );
                        this.sceneFrustum.add( line );
                    }
                    else {
                        /* Change vertex locations */
                        /*- we don't actually need to update these, as they're linked to the proper points! */
                        this.lineGeometry[ gcount++ ].verticesNeedUpdate = true;
                    }
                }
            }
            
            // planes
            // do first plane always, as it outlines image
            for ( z = 0; z < pointsForDepth; z++ ) {
                if ( refresh ) {
                    this.lineGeometry[ gcount ] = new THREE.Geometry();
                    for ( v = 0; v < 5; v++ ) {
                        x = Math.floor( v / 2 ) % 2;
                        y = Math.floor( ( v + 1 ) / 2 ) % 2;
                        this.lineGeometry[ gcount ].vertices.push( this.frustumPoints[ x * 2 * pointsForDepth + y * pointsForDepth + z] );
                    }
                    mtl = this.lineMaterial[z];
                    line = new THREE.Line( this.lineGeometry[ gcount++ ], mtl );
                    this.sceneFrustum.add( line );
                } else {
                    /* Change vertex locations */
                    /*- we don't actually need to update these, as they're linked to the proper points! */
                    this.lineGeometry[ gcount++ ].verticesNeedUpdate = true;
                }
            }
            
            /* do front face with image - always there */
            if ( refresh ) {
                this.depthFaceGeometry[ 0 ] = new THREE.Geometry();
                let uvs = [];
                for ( v = 0; v < 4; v++ ) {
                    x = Math.floor( v / 2 ) % 2;
                    y = Math.floor( ( v + 1 ) / 2 ) % 2;
                    this.depthFaceGeometry[ 0 ].vertices.push( this.frustumPoints[ x * 2 * pointsForDepth + y * pointsForDepth ] );

                    uvs.push( new THREE.Vector2( 0.0, 0.0 ) );
                    uvs.push( new THREE.Vector2( 0.0, 1.0 ) );
                    uvs.push( new THREE.Vector2( 1.0, 1.0 ) );
                    uvs.push( new THREE.Vector2( 1.0, 0.0 ) );
                }

                this.depthFaceGeometry[ 0 ].faces.push( new THREE.Face3( 2, 1, 0 ) );
                this.depthFaceGeometry[ 0 ].faceVertexUvs[ 0 ].push( [ uvs[ 2 ], uvs[ 1 ], uvs[ 0 ] ] );
                this.depthFaceGeometry[ 0 ].faces.push( new THREE.Face3( 0, 3, 2 ) );
                this.depthFaceGeometry[ 0 ].faceVertexUvs[ 0 ].push( [ uvs[ 0 ], uvs[ 3 ], uvs[ 2 ] ] );

                mtl = this.screenMaterial;

                mesh = new THREE.Mesh( this.depthFaceGeometry[ 0 ], mtl );
                this.sceneFrustum.add( mesh );
            } else {
                /**
                 * For some strange reason I do have to copy these vertices over - I thought
                 * they would be linked to frustumPoints, but they don't appear to be, if I switch
                 * among the viewport modes.
                 */
                for ( v = 0; v < 4; v++ ) {
                    x = Math.floor( v / 2 ) % 2;
                    y = Math.floor( ( v + 1 ) / 2 ) % 2;
                    this.depthFaceGeometry[ 0 ].vertices[ v ].copy( this.frustumPoints[ x * 2 * pointsForDepth + y * pointsForDepth ] );
                }
                this.depthFaceGeometry[0].verticesNeedUpdate = true;
            }
            
            // depth faces
            if ( this.effectController.viewport === 'depths' ) {
                if ( refresh ) {
                    for ( z = 1; z < pointsForDepth; z++ ) {
                        this.depthFaceGeometry[ z ] = new THREE.Geometry();
                        for ( v = 0; v < 4; v++ ) {
                            x = Math.floor( v / 2 ) % 2;
                            y = Math.floor( ( v + 1 ) / 2 ) % 2;
                            this.depthFaceGeometry[ z ].vertices.push( this.frustumPoints[ x * 2 * pointsForDepth + y * pointsForDepth + z ] );
                        }
                        this.depthFaceGeometry[ z ].faces.push( new THREE.Face3( 0, 1, 2 ) );
                        this.depthFaceGeometry[ z ].faces.push( new THREE.Face3( 2, 3, 0 ) );

                        mtl = new THREE.MeshBasicMaterial( { color: this.lineMaterial[ z ].color.getHex(), transparent: true,
                                opacity: 0.05 + 0.25*(pointsForDepth-z)/pointsForDepth,
                                // for last face, show just front side - back side is blue
                                side: ( z == pointsForDepth - 1 ) ? THREE.BackSide : THREE.DoubleSide } );

                        mesh = new THREE.Mesh( this.depthFaceGeometry[z], mtl );
                        this.sceneFrustum.add( mesh );
                    }
                } else {
                    for ( z = 1; z < pointsForDepth; z++ ) {
                        vcount = 0;
                        for ( v = 0; v < 4; v++ ) {
                            x = Math.floor( v / 2 ) % 2;
                            y = Math.floor(( v + 1 ) / 2 ) % 2;
                            this.depthFaceGeometry[ z ].vertices[ vcount++ ].copy( this.frustumPoints[ x * 2 * pointsForDepth + y * pointsForDepth + z ] );
                        }
                        this.depthFaceGeometry[ z ].verticesNeedUpdate = true;
                    }
                }
            }
            
            let side;
            if ( faces ) {
                // side faces
                if ( refresh ) {
                    for ( side = 0; side < 4; side++ ) {
                        this.sideFaceGeometry[ side ] = new THREE.Geometry();
                        for ( v = 0; v < 4; v++ ) {
                            x = Math.floor( ( side * 4 + v + 6 ) / 8 ) % 2;
                            y = Math.floor( ( side * 4 + v + 2 ) / 8 ) % 2;
                            z = Math.floor( ( v + 1 ) /2 ) % 2;
                            this.sideFaceGeometry[ side ].vertices.push( this.frustumPoints[ x * 2 * pointsForDepth + y * pointsForDepth + z * ( pointsForDepth - 1 ) ] );
                        }
                        this.sideFaceGeometry[ side ].faces.push( new THREE.Face3( 0, 1, 2 ) );
                        this.sideFaceGeometry[ side ].faces.push( new THREE.Face3( 2, 3, 0 ) );

                        mtl = new THREE.MeshBasicMaterial( { color: ( side % 2 === 0 ) ? 0x00ff00 : 0xff0000, transparent: true, opacity: 0.2 } );
                        mesh = new THREE.Mesh( this.sideFaceGeometry[ side ], mtl );
                        this.sceneFrustum.add( mesh );
                    }
                }
                else {
                    for ( side = 0; side < 4; side++ ) {
                        vcount = 0;
                        for ( v = 0; v < 4; v++ ) {
                            x = Math.floor( ( side * 4 + v + 6 ) / 8 ) % 2;
                            y = Math.floor( (side * 4 + v + 2 ) / 8 ) % 2;
                            z = Math.floor( ( v + 1 ) / 2 ) % 2;
                            this.sideFaceGeometry[ side ].vertices[ vcount++ ].copy( this.frustumPoints[ x * 2 * pointsForDepth + y * pointsForDepth + z * ( pointsForDepth - 1 ) ] );
                        }
                        this.sideFaceGeometry[ side ].verticesNeedUpdate = true;
                    }
                }
            }
            /* far face - give a clue that you're looking at the bottom, so always show it */
            if ( refresh ) {
                this.sideFaceGeometry[ 4 ] = new THREE.Geometry();
                for ( v = 0; v < 4; v++ ) {
                    x = Math.floor( v / 2 ) % 2;
                    y = Math.floor( ( v + 1 ) / 2 ) % 2;
                    this.sideFaceGeometry[ 4 ].vertices.push( this.frustumPoints[ x * 2 * pointsForDepth + y * pointsForDepth + ( pointsForDepth - 1 ) ] );
                }
                this.sideFaceGeometry[ 4 ].faces.push( new THREE.Face3( 0, 1, 2 ) );
                this.sideFaceGeometry[ 4 ].faces.push( new THREE.Face3( 2, 3, 0 ) );

                mtl = new THREE.MeshBasicMaterial( { color: 0x0000ff, transparent: true, opacity: 0.2 } );

                mesh = new THREE.Mesh( this.sideFaceGeometry[ 4 ], mtl );
                this.sceneFrustum.add( mesh );
            } else {
                vcount = 0;
                for ( v = 0; v < 4; v++ ) {
                    x = Math.floor( v / 2 ) % 2;
                    y = Math.floor( ( v + 1 ) / 2 ) % 2;
                    this.sideFaceGeometry[ 4 ].vertices[ vcount++ ].copy( this.frustumPoints[ x * 2 * pointsForDepth + y * pointsForDepth + ( pointsForDepth - 1 ) ] );
                }
                this.sideFaceGeometry[ 4 ].verticesNeedUpdate = true;
            }

            // frustum tip
            let lerpVal = 0.85;
            let vertex;
            if ( refresh ) {
                // sides of tip
                for ( side = 0; side < 4; side++ ) {
                    this.tipGeometry[ side ] = new THREE.Geometry();
                    for ( v = 0; v < 2; v++ ) {
                        x = Math.floor( ( side * 2 + v + 3 ) / 4 ) % 2;
                        y = Math.floor( (side * 2 + v + 1 ) / 4 ) % 2;
                        vertex = new THREE.Vector3();
                        vertex.copy( this.frustumPoints[ x * 2 * pointsForDepth + y * pointsForDepth ] );
                        vertex.lerp( this.camera.position, lerpVal );
                        this.tipGeometry[ side ].vertices.push( vertex );
                    }
                    this.tipGeometry[ side ].vertices.push( this.camera.position );
                    this.tipGeometry[ side ].faces.push( new THREE.Face3( 0, 1, 2 ) );

                    mtl = new THREE.MeshBasicMaterial( { color: ( side % 2 === 0 ) ? 0x00ff00 : 0xff0000 } );
                    mesh = new THREE.Mesh( this.tipGeometry[ side ], mtl );
                    this.sceneFrustum.add( mesh );
                }
            }
            else {
                vertex = new THREE.Vector3();
                for ( side = 0; side < 4; side++ ) {
                    vcount = 0;
                    for ( v = 0; v < 2; v++ )
                    {
                        x = Math.floor( ( side * 2 + v + 3 ) / 4 ) % 2;
                        y = Math.floor( ( side * 2 + v + 1 ) / 4 ) % 2;
                        vertex.copy( this.frustumPoints[ x * 2 * pointsForDepth + y * pointsForDepth ] );
                        vertex.lerp( this.camera.position, lerpVal );
                        this.tipGeometry[ side ].vertices[ vcount++ ].copy( vertex );
                    }
                    this.tipGeometry[ side ].vertices[vcount++].copy( this.camera.position );

                    this.tipGeometry[ side ].verticesNeedUpdate = true;
                }
            }

            // base of tip
            if ( refresh ) {
                this.tipGeometry[ 4 ] = new THREE.Geometry();
                /* bit lazy - we could reuse the 4 points computed for the sides */
                for ( v = 0; v < 4; v++ ) {
                    x = Math.floor( v / 2 ) % 2;
                    y = Math.floor( ( v + 1 ) / 2 ) % 2;
                    vertex = new THREE.Vector3();
                    vertex.copy( this.frustumPoints[ x * 2 * pointsForDepth + y * pointsForDepth ] );
                    vertex.lerp( this.camera.position, lerpVal );
                    this.tipGeometry[ 4 ].vertices.push( vertex );
                }
                this.tipGeometry[ 4 ].faces.push( new THREE.Face3( 0, 1, 2 ) );
                this.tipGeometry[ 4 ].faces.push( new THREE.Face3( 2, 3, 0 ) );

                mtl = new THREE.MeshBasicMaterial( { color: 0x0000ff } );
                mesh = new THREE.Mesh( this.tipGeometry[ 4 ], mtl );
                this.sceneFrustum.add( mesh );
            } else {
                // note we allocated the vertex once, above
                vcount = 0;
                for ( v = 0; v < 4; v++ ) {
                    x = Math.floor( v / 2 ) % 2;
                    y = Math.floor( ( v + 1 ) / 2 ) % 2;
                    vertex.copy( this.frustumPoints[ x * 2 * pointsForDepth + y * pointsForDepth ] );
                    vertex.lerp( this.camera.position, lerpVal );
                    this.tipGeometry[ side ].vertices[ vcount++ ].copy( vertex );
                }
                this.tipGeometry[ 4 ].verticesNeedUpdate = true;
            }
            
    }
    
    resize( self: PipelineComponent ): void {
      /**
       * Fired when window size changes
       * Minimum dimention of renderer is 1060*500 px
       * If width changes below 1060px, simple return
       */  
      let b = this.container;
      if(  ( b.width() ) < 1060 ) return;
      self.width = b.width();
      
      /* Updating renderer */
      self.renderer.setSize( self.width, self.height );
      
      /* Updating main camera */
      self.camera.aspect = self.width / self.height;
      self.camera.updateProjectionMatrix();
      
      /* Updating sprite rendering camera */
      self.orthoCamera.left = -self.width/2;
      self.orthoCamera.right = self.width/2
      self.orthoCamera.top = self.height/2;
      self.orthoCamera.bottom = -self.height/2;
      self.orthoCamera.updateProjectionMatrix();
      
      /* Removing any left sprite on screen, coz anyway animation function will redraw sprites because screen size changed */
      self.removeText();
      
    }

}