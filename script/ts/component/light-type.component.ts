import { Component, OnInit } from '@angular/core';
import { Router } from  '@angular/router-deprecated';

import { animateCallback, getRandomColor } from  '../assets';

import { makeScene } from  '../service/scene.service';    /* Scene service */
import { Lights } from  '../service/light.service';       /* Lights service */

function randomNumberFromRange( min: number = 0, max: number = 1 ) {
    return Math.floor( Math.random() * ( max - min + 1 ) + min );
}

@Component( {
  selector: "light-type",
  templateUrl: 'partials/light-type.html',
  providers: [ makeScene, Lights ]
} )

/**
 * This component shows behaviour of Light models.
 * Point light, spot light and ambient light are presented
 * Directional light cannot be intergrated because it caused conflict with spotlight.
 * And too much of light is dangerous for your eyes. I do care for you. 
 */
export class LightTypeComponent implements OnInit {
    
    title: string = "Lights Component";
    private renderer: THREE.WebGLRenderer;  /* Main renderer to render scene */
    private scene: THREE.Scene;             /* Main scene */
    private camera: THREE.PerspectiveCamera /* Main camera */
    private controls: THREE.OrbitControls;  /* Mouse controller */
    private gui;                            /* Graphical menu */
    private width: number;                  /* Width of renderer */
    private height: number = 500;           /* Height of renderer */
    private container;                      /* Container to hold renderer */
    private stats: Stats;                                   /* Performance moniter */
    
    pointLight: THREE.PointLight[] = [];
    spotLight: THREE.SpotLight[] = [];
    ambientLight: THREE.AmbientLight;
    pyramidArray: THREE.Mesh[] = [];
    lightHelper: Array<any> = [];           /* Array to hold light helpers, used in animation loop to update helper according to respective light */
    
    aniCallback: animateCallback[];         /* List of animation callbacks */
    
    constructor( private router: Router, private makeScene: makeScene, private Lights: Lights ) {
        console.clear();

        /* Creating scene object */
        this.scene = new THREE.Scene();
    
        /* Initializing GUI menu object */
        this.gui = new dat.GUI( { autoplace: false });
        this.gui.domElement.id = "gui";
        
        /* Initializing animation callbacks */
        this.aniCallback = [];
        
    };
    
    ngOnInit() {
        /**
         * This function will be called when Component has been placed in DOM 
         */
        this.container = $( "#graphics-space" );
        this.width = this.container.width() - 25;
        
        /**
         * Setting up renderer engine
         * This can't be done in constructor function 
         * Because in constructor, #graphics-space won't be available
         */
        this.renderer = new THREE.WebGLRenderer(); 
        this.renderer.setSize( this.width, this.height ); 
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.shadowMap.enabled = true;
        
        /* Attaching event resize listener on window */
        window.addEventListener("resize", () => { this.makeScene.resize( this )  }, false );
        
        /* Setting up main camera */ 
        this.camera = new THREE.PerspectiveCamera( 50, this.width / this.height, 1, 10000 );
        this.camera.position.z = 250;
        this.camera.position.y = 55;
        this.camera.position.x = 0;
        
        /* Moving the scene little bit down to see scene properly */
        this.scene.translateY( -50 )
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
        this.createScene();
        
        /**
         * ====================STOP, its my turn========================
         * Main scene editing should end here  
         */
        
        /* Calling animation loop */
        this.makeScene.animation( this.aniCallback, this.renderer, this.scene, this.camera, this.stats );
        
    }

    createScene() {
        /**
         * This method actually created all the objects in the scene 
         */
        
        /* Loading model */
        this.makeScene.loadFlamingo( this.scene, this.gui, this.aniCallback );
            
        /* Adding BBLR( bottom, back, left, right ) walls */
        this.makeScene.addBBLRWalls( this.scene );
        
        /* Creating mesh at random position */
        for( let i = 0; i < 35; i++) {
            
            let height = randomNumberFromRange( 20, 100 );
            let coneGeo = new THREE.CylinderGeometry( 0, height/4, height, randomNumberFromRange(3, 5) );
            let coneMat = new THREE.MeshPhongMaterial( { color:  getRandomColor(), side: THREE.DoubleSide, shading: THREE.FlatShading  } );
            let coneMesh = new THREE.Mesh( coneGeo, coneMat );
        
            coneMesh.castShadow = true;
            coneMesh.receiveShadow = true;
            
            coneMesh.position.x = randomNumberFromRange( -200, 200 );
            coneMesh.position.z = randomNumberFromRange( -200, 270 );            
            coneMesh.position.y = height/2;
            
            this.scene.add( coneMesh );
            this.pyramidArray.push( coneMesh );
        }
        
        /* Quick fix */
        let pyramid: any = { ObjectShadow: this.pyramidArray[0].visible };
        this.gui.add( pyramid, "ObjectShadow" ).onChange( (v) => {
            for( let item of this.pyramidArray ) {
                item.castShadow = v;
                item.receiveShadow = v;
            }
        });
        
        /**
         * Adding lights to scene
         * Each light has GUI menu
         * Each GUI menu has className to toggle based on user interaction
         */
        
        /* PointLights */
        let pointlight = this.Lights.addPointLight( this.scene, 0xff0000, -150, 150, 150, 1, this.lightHelper ,this.pointLight  );
        let folder = this.Lights.addPointLightGUI( this.scene, this.gui, pointlight.light, pointlight.helper,  "Point Light 0" );
        folder.domElement.className = "PointLight";
        
        pointlight = this.Lights.addPointLight( this.scene, 0x00ff00, 150, 150, 150, 1, this.lightHelper, this.pointLight );
        folder = this.Lights.addPointLightGUI( this.scene, this.gui, pointlight.light, pointlight.helper, "Point Light 1" );
        folder.domElement.className = "PointLight";
        
        pointlight = this.Lights.addPointLight( this.scene, 0x0000ff, 0, 150, -150, 1, this.lightHelper, this.pointLight );
        folder = this.Lights.addPointLightGUI( this.scene, this.gui, pointlight.light, pointlight.helper, "Point Light 2" );
        folder.domElement.className = "PointLight";
        
        /* SpotLights */
        let spot = this.Lights.addSpotLight( this.scene, 0xffffff, 0, 350, 0, this.spotLight );
        let sfolder = this.Lights.addSpotLightGUI( this.scene, this.gui, spot, "SpotLight 0"  );
        sfolder.domElement.className = "SpotLight";

        /* Ambient light */
        this.ambientLight = this.Lights.addAmbientLight( this.scene, 0x404040 );
        folder = this.Lights.addAmbientLightGUI( this.gui , this.ambientLight, "Ambient Light" );
        folder.domElement.className = "AmbientLight";
        
        
        /* Callback to update light helper */
        let c = () => {
            for( let helper of this.lightHelper )
              helper.update();
        }
        this.aniCallback.push( c );

    } 
    
    toggle( target, what ) {
        /**
         * This method toggles on/off the lights
         * "target" is HTML component which was clicked
         * "which" is the light to toggle
         */
        switch( what ){
            case "point" : if( ! this.pointLight[0] ) break; /* if light is undefined, exit */
                           /* If light is visible, make visible = false, and hide respective GUI menu */
                           if( this.pointLight[0].visible ) {
                                $(".PointLight").fadeOut();
                                target.innerHTML = "Show point lights"
                                for( let light of this.pointLight ) {
                                    light.visible = false;
                                }
                           } else {
                                $(".PointLight").fadeIn();
                                target.innerHTML = "Hide point lights"
                                for( let light of this.pointLight ) {
                                    light.visible = true;
                                }
                           } 
                           
                           break;
         case "spot" :     if( ! this.spotLight[0] ) break;
                           if( this.spotLight[0].visible ) {
                                $(".SpotLight").fadeOut();
                                target.innerHTML = "Show spot lights"
                           } else {
                                $(".SpotLight").fadeIn();
                                target.innerHTML = "Hide spot lights"
                                
                           } 
                           for( let light of this.spotLight ) {
                                    light.visible = !light.visible;
                                }
                           break;
         case "ambient" :  if( ! this.ambientLight ) break;
                           if( this.ambientLight.visible ) {
                               this.ambientLight.visible = false;
                               target.innerHTML = "Show Ambient light";
                               $( ".AmbientLight" ).fadeOut();
                           } else {
                               this.ambientLight.visible = true;
                               target.innerHTML = "Hide Ambient light";
                               $( ".AmbientLight" ).fadeIn();
                           }
                           
                           break;
         case "directional" : let answer = confirm( `SpotLight and directional lights cannot be seen properly together. 
                                                     Do you want to navigate to spotLight page ` );
                           if( answer ) {
                               this.router.navigate( ['/DirectionalLightType'] );
                           }
                           break;

                                                           
         default: console.log( "Oopssss" ); break;
        }
    }

    
}