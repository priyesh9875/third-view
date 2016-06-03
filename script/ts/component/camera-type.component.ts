import { Component, OnInit } from '@angular/core';

import { animateCallback } from  '../assets';

@Component( {
  selector: "camera-type",
  templateUrl: 'partials/camera-type.html',
} )

/**
 * This component demonstrates two types of camera.
 * Perspective camera and Orthographic camera
 */
export class CameraTypeComponent implements OnInit {
    
    title: string = "Camera Application";
    
    private renderer: THREE.WebGLRenderer;                /* Main renderer */
    private scene: THREE.Scene;                           /* Main scene */
    private camera: THREE.PerspectiveCamera;              /* Main camera, left viewport */
    private cameraPerspective: THREE.PerspectiveCamera;
    private cameraPerspectiveHelper: THREE.CameraHelper;
    private cameraOrtho: THREE.OrthographicCamera;
    private cameraOrthoHelper: THREE.CameraHelper; 
    private activeCamera; 
    private activeHelper;
    private controls: THREE.OrbitControls;
    private gui;
    private container;
    private clock: THREE.Clock;
    private morph: THREE.MorphAnimMesh;
    private lights: THREE.Object3D[];
    private stats: Stats;                                   /* Performance moniter */
    
    private width: number;
    private height = 500;
    private animationID: number;
    
    constructor( ) {
      console.clear();
      
      /* Creating scene object */
      this.scene = new THREE.Scene();
 
      
      /* Initializing GUI menu object */
   
      this.gui = new dat.GUI( { autoplace: false });
      this.gui.domElement.id = "gui";

      
      /* Creating clock object to animate morph object */
      this.clock = new THREE.Clock();
      
      /* Dont know why it doesnt work well */
      window.addEventListener("resize", () => { this.resize( this ) }, false );
      

    }
    
    ngOnInit() {
      /**
       * This function will be called when Component has been placed in DOM 
       */
      this.container = $("#graphics-space");
     // this.container.hide();  
      this.width = this.container.width() - 25 ;
      
      /**
       * Setting up renderer engine
       * This can't be done in constructor function 
       * Because in constructor, #graphics-space won't be available
       */
       
      this.renderer = new THREE.WebGLRenderer();  
      this.renderer.setSize( this.width, this.height ); 
      this.renderer.setPixelRatio( window.devicePixelRatio );
      this.renderer.autoClear = false;    /* TO draw multiple viewports */
      this.renderer.shadowMap.enabled = true;;
      
      
      /* Setting up main camera */ 
      this.camera = new THREE.PerspectiveCamera( 50, 0.5 * this.width / this.height, 1, 10000 );
      this.camera.position.z = 2500;
      this.camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );
      
      /* Appending renderer in dom as native DOM element ( canvas ) */
      this.container.append( this.renderer.domElement );
      
      /* Positioning GUI menu */
       this.container.append( $("#gui") );
       

      /*  Attaching mouse control to renderer */
      this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );

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

      /**
       * Temporary variable self = this 
       * Required becausein toggleCamera.change(), 'this' object changes, so it doesnt point to expected object
       */  
      let self = this;
      ///dataset for toggleCamera in dat.gui munu
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
         }  
      };
          
      /// adding control menus
      this.gui.add( toggleCamera, "change" );
      let guiOrtho = this.guiAddCameraControls( this.cameraOrtho, this.cameraOrthoHelper, "Orthographic Camera", camOrthoRot );
      guiOrtho.domElement.id = "OrthoCameraControls";
          
      let guiPerspective = this.guiAddCameraControls( this.cameraPerspective, this.cameraPerspectiveHelper, "Perspective Camera", camPerspectiveRot );
      guiPerspective.domElement.id = "PerspectiveCameraControls";
      
      /* Initially, perspective camera will be active, so hide orthographic camera controls */    
      $("#OrthoCameraControls").hide();     
          

      /**
       * ====================Your turn========================
       * Main scene editing should start here  
       */

      this.createScene();
        
       /* Axis of camera */
       /*
       let axisX = new THREE.ArrowHelper( new THREE.Vector3( 1, 0, 0 ), new THREE.Vector3( this.activeCamera.position.x, this.activeCamera.position.y, this.activeCamera.position.z ), 250, 0xff0000 );
       let axisY = new THREE.ArrowHelper( new THREE.Vector3( 0, 1, 0 ), new THREE.Vector3( this.activeCamera.position.x, this.activeCamera.position.y, this.activeCamera.position.z ), 250, 0x00ff00 );
       let axisZ = new THREE.ArrowHelper( new THREE.Vector3( 0, 0, 1 ), new THREE.Vector3( this.activeCamera.position.x, this.activeCamera.position.y, this.activeCamera.position.z ), 250, 0x0000ff );
       
       this.scene.add( axisX );
       this.scene.add( axisY );
       this.scene.add( axisZ );
       */
      
      /**
       * ====================STOP, its my turn========================
       * Main scene editing should end here  
       */
      
      
      /**
       * Animation callback array
       * Each element is in the form () => { your animation logic }
       */
      let c: animateCallback[] =  [ ];
      this.animate( c );
      
    }
    
    createScene() {
        /**
         * This method actually created all the objects in the scene 
         */
        
        let self = this;
        
        /* lightings */
        let dirLight1 = new THREE.DirectionalLight( 0x1ac6ff, 1 ); 
        
        /* Light array to access there in animate method */
        this.lights = [];
        this.lights.push( dirLight1 );
        
        dirLight1.castShadow = true;
        
        dirLight1.position.set( 200,500,100 );
        this.scene.add( dirLight1 );
         
        let pointLight1 = new THREE.PointLight( 0xff0000, 1 , 0 );
        pointLight1.position.set( -400,210, 200 );

        let helperPointLight1 = new THREE.PointLightHelper( pointLight1, 5);
        this.scene.add( pointLight1 );
        this.scene.add( helperPointLight1 );
          
        let pointLight2 = new THREE.PointLight( 0xff80ff, 1 , 0);
        pointLight2.position.set( 400,210, 200 );
        let helperPointLight2 = new THREE.PointLightHelper( pointLight2, 5);
        this.scene.add( pointLight2 )
        this.scene.add( helperPointLight2 );
          
        /* Loading morph model */
        let loader = new THREE.JSONLoader();
        loader.load( "assets/models/sittingBox.js", ( geometry ) => {
            
            let material = new THREE.MeshPhongMaterial({
                  color : 0xaaaacc, shininess : 45, specular : 0xbbddbb, morphTargets : true,  side : THREE.DoubleSide 
            } );
              
            self.morph = new THREE.MorphAnimMesh( geometry, material );
            self.morph.scale.set( 200,200,200);
            self.morph.duration = 8000;
            self.morph.mirroredLoop = true;
            self.morph.castShadow = true;
            self.morph.receiveShadow  = true;
            /* quick fix, scene needed Object3D, but morph is MorphAnimMesh */
            let scene: any = self.scene;
            scene.add( self.morph );

        } );
         
         
        /* Creating plane geometry */
        let texture = THREE.ImageUtils.loadTexture('assets/textures/grass.jpg');
        let plane = new THREE.Mesh( new THREE.PlaneGeometry( 500, 500 ), new THREE.MeshPhongMaterial({ side : THREE.DoubleSide, map:texture})  );
        
        /* Placing and rotation the plane little bit */
        plane.position.set( 12, -50, -130 );
        plane.rotation.x = -(Math.PI*70) / 180;
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

    } 
    
    guiAddCameraControls( camera, helper, heading, rotation ) {
        /* This method adds GUI menu for perspective and orthographic camera */
              
              let cameraFolder = this.gui.addFolder( heading );
              if ( camera instanceof THREE.PerspectiveCamera ) {
                  cameraFolder.add( camera, "fov", 0, 120)
                     .listen()
                     .onChange( function(v) {
                           camera.updateProjectionMatrix();
                           helper.update();
                       });
              };
              
              if ( camera instanceof THREE.OrthographicCamera ) {
                  cameraFolder.add( camera, "top", 0, 500 )
                      .listen()
                      .onChange( function(v) {
                          camera.updateProjectionMatrix();
                          helper.update();
                       });

                  cameraFolder.add( camera, "bottom", -500, 0 )
                      .listen()
                      .onChange( function(v) {
                          camera.updateProjectionMatrix();
                          helper.update();
                       });
                  
                  cameraFolder.add( camera, "left", -500, 0 )
                      .listen()
                      .onChange( function(v) {
                          camera.updateProjectionMatrix();
                          helper.update();
                       });
                  
                  cameraFolder.add( camera, "right", 0, 500 )
                      .listen()
                      .onChange( function(v) {
                          camera.updateProjectionMatrix();
                          helper.update();
                       });
              };
              

              cameraFolder.add( camera, "near", 0.1,1000)
                  .listen()
                  .onChange( function(v) { 
                       camera.updateProjectionMatrix();
                       helper.update();
              });

              cameraFolder.add( camera, "far", 0.1,5000)
                  .listen()
                  .onChange( function(v) { 
                       camera.updateProjectionMatrix();
                       helper.update();
              });
           
              let folder = cameraFolder.addFolder("Rotation");
              folder.add( rotation, "x", -180,180)
                  .listen()
                  .onChange( function(v) {
                     camera.rotation.x = v * 3.14/180;
              });
              folder.add( rotation, "y", -180,180)
                  .listen()
                  .onChange( function(v) {
                     camera.rotation.y = v * 3.14/180;
              });
              folder.add( rotation, "z", -180,180)
                  .listen()
                  .onChange( function(v) {
                     camera.rotation.z = v * 3.14/180;
              });

              folder = cameraFolder.addFolder("Position");
              folder.add( camera.position, "x", -1000, 1000).listen();
              folder.add( camera.position, "y", -1000, 1000).listen();
              folder.add( camera.position, "z", -1000, 1000 ).listen();

              return cameraFolder;
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
    
    animate( callback: animateCallback[] ) {
        /**
         * Animation method for scene
         * User can pass array of callbacks implementing their own animation logic 
        */
      
        this.animationID = window.requestAnimationFrame( () => { this.animate( callback ) } );
        this.stats.begin();
        for ( var f of callback ) {
           if( typeof f === 'function') {
               f();
           }
        }
        
        let delta = this.clock.getDelta() * 1200;
        /* if morph model is loaded, then call its animate method */
        if( this.morph ) this.morph.updateAnimation( delta ); 
        
        /* Animation lights */      
        let x = this.lights[0].position.x
        let z = this.lights[0].position.z
        this.lights[0].position.x = x * Math.cos( 0.005 ) + z * Math.sin( 0.005 );
        this.lights[0].position.z = z * Math.cos( 0.005 ) - x * Math.sin( 0.005 );
        
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
        this.stats.end();
    }

}