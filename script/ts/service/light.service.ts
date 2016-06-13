/**
 * This file contains functions for light to be added in scene
 */

//import { Injectable } from  '@angular/core';
import { animateCallback } from  '../assets';

//@Injectable()

export class Lights {
    
    addAmbientLight( scene: THREE.Scene, color: number ) {
        /**
         * This function add ambient light into scene 
         */
        let ambient = new THREE.AmbientLight( color );
        scene.add( ambient );
        
        return ambient;
    }
    
    addAmbientLightGUI( gui, light: THREE.AmbientLight, heading: string ) {
        /**
         * This function add ambient light controller 
         */
        let folder = gui.addFolder( heading );
        folder.domElement.className = "AmbientLight";
        /* Dataset for gui to act on */
        let data = {
            color : light.color.getHex()
        };
        
        folder.add( light, "visible", 0, 1 ).listen();
        folder.addColor( data, "color" ).onChange( ( value )=> { 
            light.color = new THREE.Color( value );
        } );        
        
    }
    
    addPointLight( scene: THREE.Scene, color: number, x: number, y: number, z: number, type: number, lightHelper: any[], targetArray?: any[] ) {
        /**
         * This function add point light and helper in scene
         */
        let point = new THREE.PointLight( color, type );
        let helper = new THREE.PointLightHelper( point, 2 );
        point.position.set( x, y, z );
        
        scene.add( helper );
        scene.add( point );
        
        /* If target array is given, push onto it */
        if( targetArray )
           targetArray.push( point );
        
        lightHelper.push( helper );
        
        return { light: point, helper: helper };
        
    }
    
    addPointLightGUI( scene: THREE.Scene, gui, light: THREE.PointLight, helper: THREE.PointLightHelper, header: string, className?: string ) {
        /**
         * This method adds GUI menu for Point light
         */
        let folder = gui.addFolder( header );
        let id = header.replace( /\s+/, "" );
        folder.domElement.id = id;
        
        if( className ) folder.domElement.className = className;
        
        let position = folder.addFolder( "Position" );
        position.add( light.position, "x", -350, 350 );
        position.add( light.position, "y", -350, 350 );
        position.add( light.position, "z", -350, 350 );
        
        folder.add( light, "visible", 0, 1 ).listen();
        folder.add( light, "intensity", 0, 10 );
        folder.add( light, "distance", 0, 500 );
        folder.add( light, "decay", 0, 1 );
                
        let data = {
            color : light.color.getHex(),
            
        }
        folder.addColor( data, "color" ).onChange( ( value )=> { 
            light.color = new THREE.Color( value );
        } );        
        
        return folder;
        
    }
    
    addSpotLight( scene: THREE.Scene, color: number, x, y, z, targetArray?: any[] ) {
        /**
         * This function add spot light and helper in scene
         */
        var spotLight = new THREE.SpotLight( );
        spotLight.color = new THREE.Color( color );
        spotLight.angle = Math.PI / 8;
        spotLight.exponent = 30;
        spotLight.position.set( x, y, z ) ;
        
        spotLight.castShadow = true;
        spotLight.shadowCameraNear = 50;
        spotLight.shadowCameraFar = 1000;
        spotLight.shadowCameraFov = 65;
        spotLight.shadowMapHeight = 2048;
        spotLight.shadowMapWidth = 2048;
        
        scene.add( spotLight );
        
        if( targetArray ) 
          targetArray.push( spotLight );
        
        return spotLight;
        
    }
    
    addSpotLightGUI( scene: THREE.Scene, gui, light: THREE.SpotLight, heading: string ) {
        /**
         * This method add GUI menu for spot light
         */
        let folder = gui.addFolder( heading );
        let id = heading.replace( /\s+/g, "" );
        folder.domElement.id = id;
        folder.domElement.className = "SpotLight";
        
        let position = folder.addFolder( "Position" );
        position.add( light.position, "x", -500, 500 ).listen();
        position.add( light.position, "y", -500, 500 ).listen();
        position.add( light.position, "z", -500, 500 ).listen();
        
        folder.add( light, "visible", 0, 1 ).listen();
        folder.add( light, "intensity", 0, 10 );
        folder.add( light, "distance", 0, 500 );
        folder.add( light, "decay", 0, 1 );
        
        let data = {
            color : light.color.getHex()
        };
        
        folder.addColor( data, "color" ).onChange( ( value )=> { 
            light.color.setHex( value );
        } );        
        
        let shadow = folder.addFolder( "Shadow" );
        shadow.add( light, "castShadow", 0, 1 );
        shadow.add( light, "onlyShadow" );
        shadow.add( light, "shadowCameraVisible", 0, 1 );
        shadow.add( light, "shadowDarkness", 0, 1 );
        
    }
    
    addDirectionalLight( scene: THREE.Scene, color: number, x: number, y: number, z: number ) {
        /**
         * This function add directional light in scene
         */
        
        let dir = new THREE.DirectionalLight( color );
        /* Setting up position */
        dir.position.set( x, y, z );
        
        /* Setting up shadow parameter */
        dir.castShadow = true;
        dir.shadowCameraNear = 50;
        dir.shadowCameraFar = 2000;
        dir.shadowCameraFov = 35;
        dir.shadowMapHeight = 2048;
        dir.shadowMapWidth = 2048;
        
        /* Adding in scene */
        scene.add( dir );

        return dir;
        
    }
    
    addDirectionalLightGUI( gui, light: THREE.DirectionalLight, aniCallback: animateCallback[]  ) {
        /**
         * This method add GUI menu for directional light
         */
        let folder = gui.addFolder( "DirectionalLight " );
        let position = folder.addFolder( "Direction" );
        folder.domElement.className = "DirectionalLight";
        
        let data = {
            color : light.color.getHex(),
            rotSpeed: 0.005
        }
        
        position.add( light.position, "x", -500, 500 );
        position.add( light.position, "y", -500, 500 );
        position.add( light.position, "z", -500, 500 );
        
        folder.add( light, "visible", 0, 1 ).listen();
        folder.add( light, "intensity", 0, 10 );
        
        folder.addColor( data, "color" ).onChange( ( value )=> { 
            light.color = new THREE.Color( value );
        } )        
        
        let shadow = folder.addFolder( "Shadow" );
        shadow.add( light, "castShadow" ).listen();
        shadow.add( light, "onlyShadow" ).listen();
        shadow.add( light, "shadowCameraVisible" ).listen();
        shadow.add( light, "shadowDarkness" ).listen();
        
        let c = () => {
            
            light.position.x = light.position.x * Math.cos( data.rotSpeed ) + light.position.z * Math.sin( data.rotSpeed );
            light.position.z = light.position.z * Math.cos( data.rotSpeed ) - light.position.x * Math.sin( data.rotSpeed );

        };
        
        /* Adding animation method to main animation callbacks */
        aniCallback.push( c );
        
    }
    
    
}