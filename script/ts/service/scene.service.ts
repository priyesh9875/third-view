/**
 * This file contains functions to quickly create scenes
 */

//import { Injectable } from  '@angular/core';
import { animateCallback } from  '../assets';

/* Constants for THREE.Material */ 
let constants = {
    
        side : {
            "THREE.FrontSide" : THREE.FrontSide,
            "THREE.BackSide" : THREE.BackSide,
            "THREE.DoubleSide" : THREE.DoubleSide
        },

        shading : {
            "THREE.FlatShading" : THREE.FlatShading,
            "THREE.SmoothShading" : THREE.SmoothShading
        }
};
    
//@Injectable()

export class makeScene {
    /**
     * This service provides major services for bare minimum functionality to scene
     */
    
    animation( callbacks: animateCallback[], renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera, stats?: Stats, animationID?: number ) {
        /**
         * Animation method for scene
         * User can pass array of callbacks implementing their own animation logic 
        */
        
        if( stats ) stats.begin();
        
        /* Requesting window to allocate frame for rendering */
        if( stats && scene )  animationID = window.requestAnimationFrame( () => { this.animation( callbacks, renderer, scene, camera, stats ) } );
        else animationID = window.requestAnimationFrame( () => { this.animation( callbacks, renderer, scene, camera ) } );
        
        /* Calling each animation callbacks provided */
        for ( var f of callbacks ) {
           if( typeof f === 'function') {
               f();
           }
        }
        /* Re-rendering the scene */
        renderer.render( scene,  camera ); renderer.dispose()
        if( stats ) stats.end();
        
    }

    resize( self ) {
        /**
         * Parameter is class from which call was made
         * Fired when window size changes
         * Minimum dimention of renderer is 900*500 px
         * If width changes below 900px, simple return
         */
        if ( ( self.container.width() - 25 ) < 900 ) return;
        self.width = self.container.width() - 25 ;
        
        /* Resetting renderer to new size */
        self.renderer.setSize( self.width, self.height );
        
        /* Updating camera */
        self.camera.aspect = self.width / self.height;
        self.camera.updateProjectionMatrix();
        
    }
    
    addBBLRWalls(scene: THREE.Scene, width = 500, height = 300, textureURL = "assets/textures/Brick-2399.jpg", bumpMap = "assets/textures/Brick-2399-bump-map.jpg" ) {
        /**
         * This function add BBLR { a.k.a Bottom, Back, Left, right } walls  
         */
        
        /* Floor */        
        let floorGeometry = new THREE.PlaneGeometry( width, height * 2, 40, 40 );
        let floorMaterial = new THREE.MeshPhongMaterial( { side: THREE.DoubleSide } );
        floorMaterial.map = THREE.ImageUtils.loadTexture( textureURL );
        floorMaterial.bumpMap = THREE.ImageUtils.loadTexture( bumpMap );
        floorMaterial.map.wrapS = floorMaterial.map.wrapT = THREE.RepeatWrapping;
        floorMaterial.map.repeat.set( 8, 8 );
        floorMaterial.bumpMap.wrapS = floorMaterial.bumpMap.wrapT = THREE.RepeatWrapping;
        floorMaterial.bumpMap.repeat.set( 8, 8 );

        var floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
        floorMesh.castShadow = true;
        floorMesh.receiveShadow = true;
        floorMesh.rotation.x = -0.5 * Math.PI;
        floorMesh.name = 'floor';
        scene.add( floorMesh );
        
        /* Back wall */
        let wallGeometry = new THREE.PlaneGeometry( width, height, 40, 40 );
        let backwall = new THREE.Mesh( wallGeometry, floorMaterial );
        backwall.castShadow = true;
        backwall.receiveShadow = true;
        backwall.position.set( 0, height/2, -width/2 );
        scene.add( backwall );
        
        /* Left wall */
        let leftwall = new THREE.Mesh( wallGeometry, floorMaterial );
        leftwall.position.set( -width/2, height/2, 0 );
        leftwall.rotation.y = Math.PI / 180 * 90;
        leftwall.castShadow = true;
        leftwall.receiveShadow = true;
        scene.add( leftwall );
        
        /* Right wall */
        let rightwall = new THREE.Mesh( wallGeometry, floorMaterial );
        rightwall.position.set( width/2, height/2, 0 );
        rightwall.rotation.y = Math.PI / 180 * -90;
        rightwall.castShadow = true;
        rightwall.receiveShadow = true;
        scene.add( rightwall );
        
        
        wallGeometry.dispose();
        floorGeometry.dispose();
        floorMaterial.dispose();
        
    }
    
    addFloor( scene: THREE.Scene, width = 200, height = 200, textureURL = "assets/textures/Brick-2399.jpg", bumpMap = "assets/textures/Brick-2399-bump-map.jpg" ) {
        /* This method adds a ground floor */
        let floorGeometry = new THREE.PlaneGeometry( width, height, width/2, height/2 );
        let floorMaterial = new THREE.MeshPhongMaterial();
        floorMaterial.map = THREE.ImageUtils.loadTexture( textureURL );
        floorMaterial.bumpMap = THREE.ImageUtils.loadTexture( bumpMap );

        floorMaterial.map.wrapS = floorMaterial.map.wrapT = THREE.RepeatWrapping;
        floorMaterial.map.repeat.set( 8 , 8 );
        floorMaterial.bumpMap.wrapS = floorMaterial.bumpMap.wrapT = THREE.RepeatWrapping;
        floorMaterial.bumpMap.repeat.set( 8, 8 );

        var floorMesh = new THREE.Mesh( floorGeometry, floorMaterial );
        floorMesh.receiveShadow = true;
        floorMesh.position.y = -10;
        floorMesh.rotation.x = -0.5 * Math.PI;
        floorMesh.name = 'floor';
        scene.add( floorMesh );
        
        floorMaterial.dispose();
        floorMaterial.dispose();
    }
    
    loadFlamingo( scene: THREE.Scene, gui, aniCallback: animateCallback[] ) {
        /**
         * This method loads a flamingo object into the scene
         * Example and reference : http://threejs.org/examples/webgl_lights_hemisphere.html
         */
        
        let loader = new THREE.JSONLoader();
        loader.load( "assets/models/flamingo.js", ( geometry ) => {
            
            /* quick fix, morphColor doesnt exists on THREE.Geometry. It does on Morph geometry */
            let geo: any = geometry;
            if( geo.morphColors && geo.morphColors.length ) {
                let colorMap = geo.morphColors[ 0 ];
                for( let i in colorMap.color )
                   geometry.faces[ parseInt(i) ].color = colorMap.colors[ parseInt(i) ];
                
            };
            
            /* Default material settings */
            let material = new THREE.MeshPhongMaterial( {
                color: 0xffffff,
                specular: 0xffffff,
                shininess: 20,
                morphTargets: true,
                vertexColors: THREE.FaceColors,
                shading: THREE.FlatShading
            } );
            
            let mesh = new THREE.MorphAnimMesh( geometry, material );
            
            mesh.duration = 1000;
            mesh.scale.set( 0.5, 0.5, 0.5 );
            mesh.position.y = 100;
            mesh.rotation.y = -1;
            
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            /* quick fix, because mesh is morph object and scene.add wants Object3D object */
            let s: any = scene;
            s.add( mesh );
            
            let flamingo = [];
            flamingo.push( mesh );
            
            let data = {
                isAnimation: true
            }
            
            /* GUI menu for morph( flamingo ) object */
            this.guiMeshPhongMaterial( gui, mesh, material, geometry, "Flamingo", data );
            
            /* Animation logic of morph object */
            let clock = new THREE.Clock();
            let c = () => {
                if( data.isAnimation ) {
                  let delta = clock.getDelta();
                     for( let morph of flamingo )
                        morph.updateAnimation( 1000 * delta );  
                }; 
            };
            
            aniCallback.push( c );
            material.dispose();
            geo.dispose();
            
        } );
    }
    
    guiMeshPhongMaterial ( gui, mesh, material, geometry: THREE.Geometry, header: string, animateData?: any, envMap = false ) {
       /**
        * This function add gui menu for phong material
        * Reference : http://threejs.org/docs/#Reference/Materials/MeshPhongMaterial 
        */
        
        /* Data for GUI to act on */
        var data = {
            color : material.color.getHex(),
            emissive : material.emissive.getHex(),
            specular : material.specular.getHex(),
        };
        
        var folder = gui.addFolder( header );
        folder.add( material, 'transparent' );
        folder.add( material, 'opacity', 0, 1 );
        folder.add( material, 'depthTest' );
        folder.add( material, 'visible' ).listen();
        folder.add( material, 'wireframe' ).listen();
        folder.add( mesh, 'castShadow' ).listen();
        
        /* Setting up animation */
        if( animateData ){
            if( animateData.isAnimation === false || animateData.isAnimation == true )
                folder.add( animateData, "isAnimation" );  
        } 
        
        folder.addColor( data, 'color' ).onChange( this.handleColorChange( material.color ) );
        folder.addColor( data, 'emissive' ).onChange( this.handleColorChange( material.emissive ) );
        folder.addColor( data, 'specular' ).onChange( this.handleColorChange( material.specular ) );
        folder.add( material, 'shading', constants.shading).onChange( this.needsUpdate( material, geometry ) );
        folder.add( material, 'shininess', 1, 240 );
        folder.add( material, "side", constants.side ).onChange( this.needsUpdate( material, geometry ) );
       
        /* If envMap is set, add reflection and refraction */
        if( envMap ) {
            let envMapKeys = this.getObjectsKeys( this.envMaps() );
            data[ 'envMaps' ] = envMapKeys;
            folder.add( data, 'envMaps', envMapKeys ).onChange( this.updateTexture( material, 'envMap', this.envMaps() ) );
        }
        
    }
    
    guiMeshLambertMaterial ( gui, mesh, material, geometry: THREE.Geometry, header: string, animateData?: any, envMap = false ) {
       /**
        * This function add gui menu for lambert material 
        * Reference : http://threejs.org/docs/#Reference/Materials/MeshLambertMaterial
        */
        
        /* Data for GUI to act on */
        var data = {
            color : material.color.getHex(),
        };
        
        var folder = gui.addFolder( header );
        folder.add( material, 'transparent' );
        folder.add( material, 'opacity', 0, 1 );
        folder.add( material, 'depthTest' );
        folder.add( material, 'visible' ).listen();
        folder.add( material, 'wireframe' ).listen();
        folder.add( mesh, 'castShadow' ).listen();
        
        /* Setting up animation */
        if( animateData ){
            if( animateData.isAnimation === false || animateData.isAnimation == true )
                folder.add( animateData, "isAnimation" );  
        } 
        
        folder.addColor( data, 'color' ).onChange( this.handleColorChange( material.color ) );
        folder.add( material, "side", constants.side ).onChange( this.needsUpdate( material, geometry ) );
        
        /* If envMap is set, add reflection and refraction */
        if( envMap ) {
            let envMapKeys = this.getObjectsKeys( this.envMaps() );
            data[ 'envMaps' ] = envMapKeys;
            folder.add( data, 'envMaps', envMapKeys ).onChange( this.updateTexture( material, 'envMap', this.envMaps() ) );
        }
        
    }

    handleColorChange ( color ) {
        /**
         * Ensuring that color is properly applied 
         */
        return ( value ) => {
            if (typeof value === "string") {
                value = value.replace('#', '0x');
            }
            color.setHex( value );
        }
    };
         
    needsUpdate ( material, geometry ) {
        /**
         * Ensuring that changes are reflected on object correctly
         * Because after each render loop, all .*NeedUpdate variables are reset to false value. May be?
         */
        return () => {
            material.shading = +material.shading;             //Ensure number
            material.vertexColors = +material.vertexColors;   //Ensure number
            material.side = +material.side;                   //Ensure number
            material.needsUpdate = true;
            geometry.verticesNeedUpdate = true;
            geometry.normalsNeedUpdate = true;
            geometry.colorsNeedUpdate = true;
        };
    };
    
    getObjectsKeys( obj ) {
        /**
         * Reference : http://threejs.org/docs/#Reference/Materials/MeshPhongMaterial
         */
        var keys = [];
        for ( var key in obj ) {
            if ( obj.hasOwnProperty( key ) ) {
                keys.push( key );
            }
        }
        return keys; 
    };
  
    envMaps() {
        /**
         * Reference : http://threejs.org/docs/#Reference/Materials/MeshPhongMaterial
         */
        let path = "assets/textures/SwedishRoyalCastle/";
        let format = '.jpg';
        let urls = [
            path + 'px' + format, path + 'nx' + format,
            path + 'py' + format, path + 'ny' + format,
            path + 'pz' + format, path + 'nz' + format
        ];

        let reflectionCube = THREE.ImageUtils.loadTextureCube( urls );
        reflectionCube.format = THREE.RGBFormat;

        let refractionCube = THREE.ImageUtils.loadTextureCube( urls );
        refractionCube.mapping = THREE.CubeRefractionMapping;
        refractionCube.format = THREE.RGBFormat;

        return {
            none : null,
            reflection : reflectionCube,
            refraction : refractionCube
        };
        
    };
        
    updateTexture ( material, materialKey, textures ) {
        /**
         * Reference : http://threejs.org/docs/#Reference/Materials/MeshPhongMaterial
         */
        return ( key ) => {
            material[ materialKey ] = textures[ key ];
            material.needsUpdate = true;
	     };
    }
    
    
    
}