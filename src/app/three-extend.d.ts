/// <reference path="../../typings/globals/three/index.d.ts" />

declare namespace THREE {

    export class MorphAnimMesh extends THREE.Mesh {
        constructor(Geometry?: Geometry, material?: THREE.MeshBasicMaterial);
        constructor(Geometry?: THREE.Geometry, material?: THREE.MeshDepthMaterial);
        constructor(Geometry?: THREE.Geometry, material?: THREE.MeshFaceMaterial);
        constructor(Geometry?: THREE.Geometry, material?: THREE.MeshLambertMaterial);
        constructor(Geometry?: THREE.Geometry, material?: THREE.MeshNormalMaterial);
        constructor(Geometry?: THREE.Geometry, material?: THREE.MeshPhongMaterial);
        constructor(Geometry?: THREE.Geometry, material?: THREE.ShaderMaterial);
        directionBackwards: boolean;
        direction: number;
        endKeyframe: number;
        mirroredLoop: boolean;
        startKeyframe: number;
        lastKeyframe: number;
        length: number;
        time: number;
        duration: number; // milliseconds
        currentKeyframe: number;
        setDirectionForward(): void;
        playAnimation(label: string, fps: number): void;
        setFrameRange(start: number, end: number): void;
        setDirectionBackward(): void;
        parseAnimations(): void;
        updateAnimation(delta: number): void;
        setAnimationLabel(label: string, start: number, end: number): void;
        clone(object?: MorphAnimMesh): MorphAnimMesh;
    }

    export class OrbitControls {
        constructor(object: Camera, domElement?: HTMLElement);

        object: Camera;
        domElement: HTMLElement;

        // API
        enabled: boolean;
        target: THREE.Vector3;

        // deprecated
        center: THREE.Vector3;

        enableZoom: boolean;
        zoomSpeed: number;
        minDistance: number;
        maxDistance: number;
        enableRotate: boolean;
        rotateSpeed: number;
        enablePan: boolean;
        keyPanSpeed: number;
        autoRotate: boolean;
        autoRotateSpeed: number;
        minPolarAngle: number;
        maxPolarAngle: number;
        minAzimuthAngle: number;
        maxAzimuthAngle: number;
        enableKeys: boolean;
        keys: { LEFT: number; UP: number; RIGHT: number; BOTTOM: number; };
        mouseButtons: { ORBIT: MOUSE; ZOOM: MOUSE; PAN: MOUSE; };
        enableDamping: boolean;
        dampingFactor: number;


        rotateLeft(angle?: number): void;
        rotateUp(angle?: number): void;
        panLeft(distance?: number): void;
        panUp(distance?: number): void;
        pan(deltaX: number, deltaY: number): void;
        dollyIn(dollyScale: number): void;
        dollyOut(dollyScale: number): void;
        update(): void;
        reset(): void;
        getPolarAngle(): number;
        getAzimuthalAngle(): number;

        // EventDispatcher mixins
        addEventListener(type: string, listener: (event: any) => void): void;
        hasEventListener(type: string, listener: (event: any) => void): void;
        removeEventListener(type: string, listener: (event: any) => void): void;
        dispatchEvent(event: { type: string; target: any; }): void;
    }

}


declare namespace dat {
    interface params {
        name?: string;  // @param {String} [params.name] The name of this GUI.
        load?: Object;  // @param {Object} [params.load] JSON object representing the saved state of
        auto?: boolean; // @param {Boolean} [params.auto=true]
        parent?: GUI;   // @param {dat.gui.GUI} [params.parent] The GUI I'm nested in.
        closed?: boolean; // @param {Boolean} [params.closed] If true, starts closed
        scrollable?: boolean;
    }

    export interface GUIParameters {
        params?: params; // @param {Object} [params]
        autoplace?: boolean;

    }

    export class GUI {
        constructor(parameters: GUIParameters);

        /**
         * Returns parent of called GUI
         */
        parent(): GUI;

        /**
         * Scrollable
         */
        scrollable(): boolean;
    }
}
