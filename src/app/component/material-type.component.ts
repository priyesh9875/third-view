import { Component, OnInit, ViewContainerRef, ElementRef } from '@angular/core';

import { animateCallback } from  '../assets';

import { makeScene } from  '../service/scene.service';    /* Scene service */
import { Lights } from  '../service/light.service';       /* Lights service */

@Component({
    selector: "camera-type",
    templateUrl: 'partials/material-type.html',
    providers: [makeScene, Lights]
})

/**
 * This component demonstrate difference between Phong and Lambert material type  
 */
export class MaterialTypeComponent {

    title: string = "Material Component";
    private renderer: THREE.WebGLRenderer;  /* Main renderer to render scene */
    private scene: THREE.Scene;             /* Main scene */
    private camera: THREE.PerspectiveCamera /* Main camera */
    private controls: THREE.OrbitControls;  /* Mouse controller */
    private gui;                            /* Graphical menu */
    private width: number;                  /* Width of renderer */
    private height: number = 500;           /* Height of renderer */
    private container;                      /* Container to hold renderer */
    private stats: Stats;                   /* Performance moniter */
    public arr = [];
    public animationID: number;

    aniCallback: animateCallback[];

    constructor(private makeScene: makeScene, private Lights: Lights) {
        console.clear();

        /* Creating scene object */
        this.scene = new THREE.Scene();

        /* Initializing GUI menu object */
        this.gui = new dat.GUI({ autoplace: false });
        this.gui.domElement.id = "gui";

        /* Initializing animation callbacks */
        this.aniCallback = [];
        this.arr.push(makeScene, Lights);


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

        /* Attaching event resize listener on window */
        window.addEventListener("resize", () => { this.makeScene.resize(this) }, false);

        /* Setting up main camera */
        this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 1, 10000);
        this.camera.position.z = 50;
        this.camera.position.y = 10;
        this.camera.position.x = 0;

        /* Moving the scene little bit down to see scene properly */
        this.scene.translateY(-5)
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
        this.arr.push(stats);

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
        let loader = new THREE.JSONLoader();
        /* Loading model and generating GUI menus */
        loader.load("assets/models/monkey.js", (geometry) => {

            /* Phong material */
            let material = new THREE.MeshPhongMaterial({ color: 0xffff33 });
            let mesh = new THREE.Mesh(geometry, material);
            mesh.scale.set(10, 10, 10);
            mesh.position.x = -15;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            self.scene.add(mesh);
            material.dispose();

            /* Animation data structure */
            let animateData = {
                isAnimation: false
            };

            /* Making GUI menu for phong material */
            self.makeScene.guiMeshPhongMaterial(self.gui, mesh, material, geometry, "Left Monkey PhongMaterial", animateData, true);

            /*  Callback for animation loop */
            let callback = () => {
                if (animateData.isAnimation)
                    mesh.rotation.y += 0.005;
            }

            self.aniCallback.push(callback);

            /* Lambert material */
            let lambertMaterial = new THREE.MeshLambertMaterial({ color: 0xffff33 });
            let lambertMesh = new THREE.Mesh(geometry, lambertMaterial);
            lambertMesh.scale.set(10, 10, 10);
            lambertMesh.position.x = 15;
            lambertMesh.castShadow = true;
            lambertMesh.receiveShadow = true;
            self.scene.add(lambertMesh);
            material.dispose();

            /* Animation data structure */
            let lambertAnimateData = {
                isAnimation: false
            };

            self.makeScene.guiMeshLambertMaterial(self.gui, lambertMesh, lambertMaterial, geometry, "Right Monkey LambertMaterial", lambertAnimateData, true);

            /*  Callback for animation loop */
            callback = () => {
                if (lambertAnimateData.isAnimation)
                    lambertMesh.rotation.y -= 0.005;
            }

            self.aniCallback.push(callback);

        });

        this.makeScene.addFloor(this.scene);

        /* Lightings */
        let spotlight1 = this.Lights.addSpotLight(this.scene, 0xffaaaa, -80, 60, 150);
        let folder1 = this.Lights.addSpotLightGUI(this.scene, this.gui, spotlight1, "SpotLight 1");

        let spotlight2 = this.Lights.addSpotLight(this.scene, 0x44ff22, -40, 60, -150);
        let folder2 = this.Lights.addSpotLightGUI(this.scene, this.gui, spotlight2, "SpotLight 2");

    }

    ngOnDestroy() {

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

        console.log("I am going out: CameraTypeComponent");

        for (let i = 0; i < this.arr.length; i++) {
            this.arr[i] = "undefined";
        }

        this.arr = undefined;
        for (let callback of this.aniCallback) {
            callback = undefined;
        }


        $("#graphics-space").empty();

    }

}