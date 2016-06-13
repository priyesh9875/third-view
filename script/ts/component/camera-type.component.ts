import { Component } from "@angular/core";

/* Callbacks for animation function */
export interface animateCallback {
  (): void;
};


@Component( {
    selector: 'camera-type',
    templateUrl: `partials/camera-type.html`
    
} )
/**
 * This component demonstrates two types of camera.
 * Perspective camera and Orthographic camera
 */
export class CameraTypeComponent {
    
    public camera: THREE.PerspectiveCamera;
    public container;
	public scene: THREE.Scene;
	public renderer: THREE.WebGLRenderer;
	public animationID: number;
	private arr: Array<any> = [];
	public morph;
	public controls: THREE.OrbitControls;
	public stats: Stats;
	public cameraPerspective: THREE.PerspectiveCamera;
    public cameraPerspectiveHelper: THREE.CameraHelper;
    public cameraOrtho: THREE.OrthographicCamera;
    public cameraOrthoHelper: THREE.CameraHelper; 
    public activeCamera; 
    public activeHelper;
	public gui;
    public clock: THREE.Clock = new THREE.Clock();
    public dirLight: THREE.DirectionalLight;
    public height = 500;
    public width: number;

    ngOnInit() {
		console.log( "I am going in: CameraTypeComponent" );
		
	    this.init();
	    this.animate();
	}
    
	ngOnDestroy() {
        /**
         * This function removes all references from variables and releases some memory. May be not perfect
         */
        window.removeEventListener( "resize", () => { this.resize( this ); } );
		cancelAnimationFrame( this.animationID );
		for( let i = this.scene.children.length; i >= 0; i-- ) {
			
			let node = this.scene.children[i];
			this.scene.remove( node );
			let mat: any = node;
			if( node instanceof THREE.Mesh ) {
				if (node.geometry) {
					node.geometry.dispose();
				}

				if (node.material) {
					
					if (node.material instanceof THREE.MeshFaceMaterial) {
						$.each ( mat.material.materials, function ( idx, mtrl ) {
							if (mtrl.map)           mtrl.map.dispose ();
							if (mtrl.lightMap)      mtrl.lightMap.dispose ();
							if (mtrl.bumpMap)       mtrl.bumpMap.dispose ();
							if (mtrl.normalMap)     mtrl.normalMap.dispose ();
							if (mtrl.specularMap)   mtrl.specularMap.dispose ();
							if (mtrl.envMap)        mtrl.envMap.dispose ();
							mtrl.dispose();         // disposes any programs associated with the material
						} );
					} else {
						if ( mat.material.map)          mat.material.map.dispose ();
						if ( mat.material.lightMap)     mat.material.lightMap.dispose ();
						if ( mat.material.bumpMap)      mat.material.bumpMap.dispose ();
						if ( mat.material.normalMap)    mat.material.normalMap.dispose ();
						if ( mat.material.specularMap)  mat.material.specularMap.dispose ();
						if ( mat.material.envMap)       mat.material.envMap.dispose ();

						node.material.dispose();   // disposes any programs associated with the material
					}
				}
			}
		}
		
		let controls: any = this.controls;
		controls.dispose();
		controls = undefined;
		
        this.renderer.dispose();
        
		this.scene = undefined;
		this.renderer = undefined;
		this.camera = undefined;
		this.morph = undefined;
		this.controls = undefined;
		this.stats = undefined;
		this.cameraPerspective = undefined;
		this.cameraPerspectiveHelper = undefined;
		this.cameraOrtho = undefined;
		this.cameraOrthoHelper = undefined;
		this.activeCamera = undefined;
		this.activeHelper = undefined;
        this.clock = undefined;
        
		$( "#gui" ).empty().remove();
		this.gui = undefined;
		
		console.log( "I am going out: CameraTypeComponent" );
        
		for( let i = 0; i < this.arr.length; i++ ) {
			this.arr[ i ] = "undefined";
		}
        
        $( "#graphics-space" ).empty();
		
	}
	
	init() {
        
		//$( '#graphics-space' ).fadeIn();
		this.container = $( '#graphics-space' );
		this.width = this.container.width() - 25;
        /* Setting up main camera */ 
		this.camera = new THREE.PerspectiveCamera( 50, 0.5 * this.width / this.height, 1, 10000 );
		this.camera.position.set( 0, 0, 1200 );
		this.camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );
       
	    /* Initializing GUI menu object */
        this.gui = new dat.GUI( { autoplace: false } );
        this.gui.domElement.id = "gui";
        /* Positioning GUI menu */
        this.container.append( $( "#gui" ) );
		
        this.scene = new THREE.Scene();
		this.arr.push(  this.camera, this.scene );
        
        
		this.renderer = new THREE.WebGLRenderer( { antialias: true } );
		this.renderer.autoClear = false;
		this.renderer.setSize( this.width, this.height );
		this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.shadowMap.enabled = true; 
        
        /* Attaching event resize listener on window */
        window.addEventListener( "resize", () => { this.resize( this )  }, false );

		this.container.append( this.renderer.domElement );
		this.arr.push( this.renderer );
		
        /*  Attaching mouse control to renderer */
        this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );

		/* Stats moniter, top left */
		this.stats = new Stats();
		/* quick fix, domElement doesn't exists on stats. Instead "dom" property exists but not working */
		let stats: any = this.stats;
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.left = "13px";
		stats.domElement.style.top = this.container.offset().top  + "px";
		this.container.append( stats.domElement );
	  
		
        this.dirLight = new THREE.DirectionalLight( 0x1ac6ff, 1 ); 
        this.dirLight.castShadow = true;
        this.dirLight.position.set( 200, 500, 100 );
        this.scene.add( this.dirLight );
        this.arr.push( this.dirLight );
        
        let pointLight1 = new THREE.PointLight( 0xff0000, 1 , 0 );
        pointLight1.position.set( -400, 210, 200 );
        let helperPointLight1 = new THREE.PointLightHelper( pointLight1, 5 );
        this.scene.add( pointLight1 );
        this.scene.add( helperPointLight1 );
        this.arr.push( pointLight1, helperPointLight1 );
          
        let pointLight2 = new THREE.PointLight( 0xff80ff, 1 , 0 );
        pointLight2.position.set( 400,210, 200 );
        let helperPointLight2 = new THREE.PointLightHelper( pointLight2, 5 );
        this.scene.add( pointLight2 )
        this.scene.add( helperPointLight2 );
        this.arr.push( pointLight2, helperPointLight2 );
        
		let texture = THREE.ImageUtils.loadTexture( 'assets/textures/grass.png' );
        let floorMaterial = new THREE.MeshPhongMaterial({ side : THREE.DoubleSide, map:texture } ); 
        floorMaterial.map.wrapS = floorMaterial.map.wrapT = THREE.RepeatWrapping;
        floorMaterial.map.repeat.set( 4, 4 );
        let plane = new THREE.Mesh( new THREE.PlaneGeometry( 500, 500 ), floorMaterial );
        
		
        /* Placing and rotation the plane little bit */
        plane.position.set( 12, -50, -130 );
        plane.rotation.x = -( Math.PI * 70 ) / 180;
        plane.castShadow = true;
        plane.receiveShadow = true;
        this.scene.add( plane ); 
		
        /* Creating a simple 3D space */
        let geometry = new THREE.Geometry();
		for ( let i = 0; i < 10000; i ++ ) {
			let vertex = new THREE.Vector3();
			vertex.x = THREE.Math.randFloatSpread( 2000 );
			vertex.y = THREE.Math.randFloatSpread( 2000 );
			vertex.z = THREE.Math.randFloatSpread( 2000 );
			geometry.vertices.push( vertex );
		}

		let particles = new THREE.Points( 
             geometry,
             new THREE.PointsMaterial( { color: 0x888888 } )
         );
		this.scene.add( particles );

		let self = this;
        /* Loading morph model */
        let loader = new THREE.JSONLoader();
        loader.load( "assets/models/sittingBox.js", ( geometry ) => {
            
            let material = new THREE.MeshPhongMaterial({
                  color : 0xaaaacc, shininess : 45, specular : 0xbbddbb, morphTargets : true,  side : THREE.DoubleSide 
            } );
              
            self.morph = new THREE.MorphAnimMesh( geometry, material );
            self.morph.scale.set( 200, 200, 200 );
            self.morph.duration = 8000;
            self.morph.mirroredLoop = true;
            self.morph.castShadow = true;
            self.morph.receiveShadow  = true;
            /* quick fix, scene needed Object3D, but morph is MorphAnimMesh */
            let scene: any = self.scene;
            scene.add( self.morph );
			this.arr.push( self.morph );
			this.arr.push( geometry, material );

        } );
        
        /* Setting up objects for GUI menu to work on */ 
        /* rotational dataset for ortho camera  */
        let camOrthoRot = {
            x: 0,
            y: 0,
            z: 0
        };  
            
        /* rotational dataset for perspective camera */
        let camPerspectiveRot = {
            x: 0,
            y: 0,
            z: 0
        };
        
        /* Setting up secondary cameras, and their helpers */    
        this.cameraPerspective = new THREE.PerspectiveCamera( 50, 0.5 * this.width / this.height, 150, 1000 );
        this.cameraPerspectiveHelper = new THREE.CameraHelper( this.cameraPerspective );
        this.scene.add( this.cameraPerspectiveHelper );
        this.cameraPerspectiveHelper.visible = false;

        this.cameraOrtho = new THREE.OrthographicCamera( -0.5 * 1000 / 2, 0.5 * 1000 / 2, 0.5 * 1000 / 2, -0.5 * 1000 / 2, 150, 1000 );
        this.cameraOrthoHelper = new THREE.CameraHelper( this.cameraOrtho );
        this.scene.add( this.cameraOrthoHelper );
        this.cameraOrthoHelper.visible = false;
            
        /* initial camera is perspective */
        this.activeCamera = this.cameraPerspective;   
        this.activeHelper = this.cameraPerspectiveHelper;
        this.activeCamera.position.z = 450;
        this.activeCamera.position.y = 50;
        
        let toggleCamera = {
            change() {
                let inactiveCamera;
                /**
                 * If current camera is Perspective, change it to Orthographics
                 * Else vice versa
                 * Update the camera Helper
                 * Hide inactive GUI control 
                 */
                if( self.activeCamera instanceof THREE.PerspectiveCamera ) {
                    self.activeCamera = self.cameraOrtho;
                    inactiveCamera = self.cameraPerspective;
                    self.activeHelper = self.cameraOrthoHelper;
                    $("#PerspectiveCameraControls").fadeOut();
                    $("#OrthoCameraControls").fadeIn();
                } else {
                    self.activeCamera = self.cameraPerspective;
                    inactiveCamera = self.cameraOrtho;
                    self.activeHelper = self.cameraPerspectiveHelper;
                    $("#PerspectiveCameraControls").fadeIn();
                    $("#OrthoCameraControls").fadeOut();
                }

                /* Restoring previous camera state to change( new camera ) */
                self.activeCamera.near = inactiveCamera.near;
                self.activeCamera.far = inactiveCamera.far;
                self.activeCamera.position.x = inactiveCamera.position.x;
                self.activeCamera.position.y = inactiveCamera.position.y;
                self.activeCamera.position.z = inactiveCamera.position.z;
                        
                self.activeCamera.rotation.x = inactiveCamera.rotation.x;
                self.activeCamera.rotation.y = inactiveCamera.rotation.y;
                self.activeCamera.rotation.z = inactiveCamera.rotation.z; 
                self.activeCamera.updateProjectionMatrix();
                self.activeHelper.update();
                inactiveCamera = undefined;
                
            }  
        };
      
        /// adding control menus
        this.gui.add( toggleCamera, "change" );
        
        // perspective camera controls
        let pc = this.gui.addFolder( "PerspectiveCamera " );
        pc.add( this.cameraPerspective, "near", 0.1, 1000 ); 
        pc.add( this.cameraPerspective, "far", 200, 5000 );
        
        let folder = pc.addFolder("Rotation");
        folder.add( camPerspectiveRot, "x", -180,180)
            .onChange( function(v) {
                self.cameraPerspective.rotation.x = v * 3.14/180;
            });
        folder.add( camPerspectiveRot, "y", -180,180)
            .onChange( function(v) {
                self.cameraPerspective.rotation.y = v * 3.14/180;
            });
        folder.add( camPerspectiveRot, "z", -180,180)
            .onChange( function(v) {
                self.cameraPerspective.rotation.y = v * 3.14/180;
            });
        
        folder = pc.addFolder("Position");
        folder.add( this.cameraPerspective.position, "x", -1000, 1000);
        folder.add( this.cameraPerspective.position, "y", -1000, 1000 );
        folder.add( this.cameraPerspective.position, "z", -1000, 1000 );
        pc.domElement.id = "PerspectiveCameraControls";
        
        
        // orthographics camera controls
        let oc = this.gui.addFolder( "OrthographicCamera " );
        oc.add( this.cameraOrtho, "near", 0.1,600);
        oc.add( this.cameraOrtho, "far", 500,1001);
        oc.add( this.cameraOrtho, "left", -500, 50 );
        oc.add( this.cameraOrtho, "right", -50,500 );
        oc.add( this.cameraOrtho, "top", -50, 500);
        oc.add( this.cameraOrtho, "bottom",  -500, 50 );

        folder = oc.addFolder("Rotation");
        folder.add( camOrthoRot, "x", -180,180)
            .onChange( function(v) {
                self.cameraOrtho.rotation.x = v * 3.14/180;
            });
        folder.add( camOrthoRot, "y", -180,180)
            .onChange( function(v) {
                self.cameraOrtho.rotation.y = v * 3.14/180;
            });
        folder.add( camOrthoRot, "z", -180,180)
            .onChange( function(v) {
                self.cameraOrtho.rotation.y = v * 3.14/180;
            });
        
        folder = oc.addFolder("Position");
        folder.add( this.cameraOrtho.position, "x", -1000, 1000);
        folder.add( this.cameraOrtho.position, "y", -1000, 1000 );
        folder.add( this.cameraOrtho.position, "z", -1000, 1000 );
        oc.domElement.id = "OrthoCameraControls";
        
        /* Initially, Perspective camera will be active, so hide orthographic camera controls */
        $("#OrthoCameraControls").hide();  
	
	}

	animate() {
		if( this.stats )this.stats.begin();
		this.animationID = requestAnimationFrame( () => { this.animate() } );
		if( this.scene ) this.render();
		if( this.stats )this.stats.end();
	}
	
	render() {
        
        this.cameraPerspective.updateProjectionMatrix();
        this.cameraPerspectiveHelper.update();
        this.cameraOrtho.updateProjectionMatrix();
        this.cameraOrthoHelper.update();
		
        /* Animation lights */      
        let x = this.dirLight.position.x
        let z = this.dirLight.position.z
        this.dirLight.position.x = x * Math.cos( 0.005 ) + z * Math.sin( 0.005 );
        this.dirLight.position.z = z * Math.cos( 0.005 ) - x * Math.sin( 0.005 );
        
        let delta = this.clock.getDelta() * 1200;
        /* if morph model is loaded, then call its animate method */
        if( this.morph ) this.morph.updateAnimation( delta ); 
        
		/* Checking which camera helper should be enabled */             
        if( this.activeCamera instanceof THREE.PerspectiveCamera ) {
            this.cameraPerspectiveHelper.visible = true;
            this.cameraOrthoHelper.visible = false;
        } else {
            this.cameraPerspectiveHelper.visible = false;
            this.cameraOrthoHelper.visible = true;
        }
		
		/* Rendering left half of view with camera( main ) */       
        this.renderer.setViewport( 0, 0, this.width/2, this.height );    //// first half, perspective camera
		this.renderer.render( this.scene,  this.camera );
        
        /* Rendering right half of view with secondary camera, and disabling helpers in second viewport */
        this.cameraPerspectiveHelper.visible = false;
        this.cameraOrthoHelper.visible = false;
              
        this.renderer.setViewport( this.width/2, 0, this.width/2, this.height );    /// right half
        this.renderer.render( this.scene, this.activeCamera );
	}
    
     resize( self ) {
      /**
       * Parameter is Class
       * Fired when window size changes
       * Minimum dimention of renderer is 900*500 px
       * If width changes below 900px, simple return
       */  
      let b = this.container;
      if( b.width() - 25 < 900 ) return;
      
      self.width = b.width() - 25;
      
      /* Resetting renderer with new size */
      self.renderer.setSize( self.width, self.height );

      /* Updating camera */
      self.camera.aspect = 0.5 * self.width / self.height;
      self.camera.updateProjectionMatrix();
              
      self.cameraPerspective.aspect = self.camera.aspect;
      self.cameraPerspective.updateProjectionMatrix()
       
    }
}