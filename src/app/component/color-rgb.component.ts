import { Component, OnInit, ViewContainerRef, ElementRef } from '@angular/core';

import { animateCallback } from  '../assets';

import { makeScene } from  '../service/scene.service';    /* Scene service */

@Component({
    selector: "color-models",
    templateUrl: 'partials/color-rgb.html',
    providers: [makeScene]
})

/**
 * This component demonstrate RGB color model 
 */
export class ColorRGBComponent {

    title: string = "Color Models";
    private renderer: THREE.WebGLRenderer;  /* Main renderer to render scene */
    private scene: THREE.Scene;             /* Main scene */
    private camera: THREE.PerspectiveCamera /* Main camera */
    private controls: THREE.OrbitControls;  /* Mouse controller */
    private gui;                            /* Graphical menu */
    private width: number;                  /* Width of renderer */
    private height: number = 500;           /* Height of renderer */
    private container;                      /* Container to hold renderer */
    private stats: Stats;                   /* Performance moniter */
    public animationID: number;             /*  Animation id which will be used to cancelAnimationFrame */

    aniCallback: animateCallback[];

    constructor(private makeScene: makeScene) {
        console.clear();

        /* Creating scene object */
        this.scene = new THREE.Scene();

        /* Initializing GUI menu object */
        this.gui = new dat.GUI({ autoplace: false });
        this.gui.domElement.id = "gui";

        /* Initializing animation callbacks */
        this.aniCallback = [];

    }

    ngOnInit() {
        /**
           * This function will be called when Component has been placed in DOM 
           */
        this.container = $("#graphics-space");
        this.width = this.container.width() - 25;

        /**
         * Setting up renderer engine
         * This can't be done in constructor function 
         * Because in constructor, #graphics-space won't be available
         */
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        /* Gamma input and output is true to see constant color  */
        this.renderer.gammaInput = true;
        this.renderer.gammaOutput = true;
        /* Attaching event resize listener on window */
        window.addEventListener("resize", () => { this.makeScene.resize(this) }, false);

        /* Setting up main camera */
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 1000);
        this.camera.position.z = 450;
        this.camera.position.y = 0;
        this.camera.position.x = 0;

        this.camera.lookAt(new THREE.Vector3(0, 0, 0));

        /* Appending renderer in dom as native DOM element ( canvas ) */
        this.container.append(this.renderer.domElement);

        /* Positioning GUI menu */
        this.container.append($("#gui"));

        /*  Attaching mouse control to renderer */
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);

        /* Stats moniter, top left */
        this.stats = new Stats();
        /* quick fix, domElement doesn't exists on stats. Instead "dom" property exists but not working */
        let stats: any = this.stats;
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = "13px";
        stats.domElement.style.top = this.container.offset().top - $(window).scrollTop() + "px";
        this.container.append(stats.domElement);

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
        this.makeScene.animation(this.aniCallback, this.renderer, this.scene, this.camera, this.stats, this.animationID);

    }

    createScene() {
        /**
         * This method actually created all the objects in the scene 
         */

        let self = this;

        var groungGeo = new THREE.PlaneGeometry(500, 500);
        var groungMat = new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.DoubleSide });
        groungMat.specular.setRGB(0, 0, 0);

        var ground = new THREE.Mesh(groungGeo, groungMat);
        this.scene.add(ground);


        // Lightings 
        // ambient light
        let a = new THREE.AmbientLight(0x111111);
        this.scene.add(a);
        a.visible = false;
        this.gui.add(a, "visible").name("Ambient Light");

        // red light
        let red = new THREE.SpotLight();
        red.color.setRGB(1, 0, 0);
        red.angle = 1;
        red.exponent = 0;
        red.position.set(0, 50, 80);
        red.target.position.set(0, 50, 0);
        red.intensity = 0.7;
        this.scene.add(red.target);
        this.scene.add(red);
        this.gui.add(red, "intensity", 0, 1).name("Red");

        // green light
        let green = new THREE.SpotLight();
        green.color.setRGB(0, 1, 0);
        green.angle = 1;
        green.exponent = 0;
        green.position.set(-61, -25, 80);
        green.intensity = 0.7;
        green.target.position.set(-61, -25, 0);
        this.scene.add(green.target);
        this.scene.add(green);
        this.gui.add(green, "intensity", 0, 1).name("Green");

        // blue light
        let blue = new THREE.SpotLight();
        blue.color.setRGB(0, 0, 1);
        blue.angle = 1;
        blue.exponent = 0;
        blue.position.set(61, -25, 80);
        blue.intensity = 0.7;
        blue.target.position.set(61, -25, 0);
        this.scene.add(blue.target);
        this.scene.add(blue);
        this.gui.add(blue, "intensity", 0, 1).name("Blue");

    }

    ngOnDestroy() {
        /**
         * Doing some clean up
         */

        window.removeEventListener("resize", () => { this.makeScene.resize(this) }, false);
        cancelAnimationFrame(this.animationID);
        for (let i = this.scene.children.length; i >= 0; i--) {

            let node = this.scene.children[i];
            this.scene.remove(node);
            let mat: any = node;
            if (node instanceof THREE.Mesh) {
                if (node.geometry) {
                    node.geometry.dispose();
                }

                if (node.material) {

                    if (node.material instanceof THREE.MeshFaceMaterial) {
                        $.each(mat.material.materials, function (idx, mtrl) {
                            if (mtrl.map) mtrl.map.dispose();
                            if (mtrl.lightMap) mtrl.lightMap.dispose();
                            if (mtrl.bumpMap) mtrl.bumpMap.dispose();
                            if (mtrl.normalMap) mtrl.normalMap.dispose();
                            if (mtrl.specularMap) mtrl.specularMap.dispose();
                            if (mtrl.envMap) mtrl.envMap.dispose();
                            mtrl.dispose();         // disposes any programs associated with the material
                        });
                    } else {
                        if (mat.material.map) mat.material.map.dispose();
                        if (mat.material.lightMap) mat.material.lightMap.dispose();
                        if (mat.material.bumpMap) mat.material.bumpMap.dispose();
                        if (mat.material.normalMap) mat.material.normalMap.dispose();
                        if (mat.material.specularMap) mat.material.specularMap.dispose();
                        if (mat.material.envMap) mat.material.envMap.dispose();

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
        this.controls = undefined;
        this.stats = undefined;

        $("#gui").empty().remove();
        this.gui = undefined;

        console.log("I am going out: ColorModelsComponent");

        for (let callback of this.aniCallback) {
            callback = undefined;
        }

        $("#graphics-space").empty();

    }

}