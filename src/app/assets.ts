/**
 * This file contains all the common interfaces required
 */

/* Callbacks for animation function */
export interface animateCallback {
    (): void;
};


export interface Vertex {
    /*
    ** Interafce to represent Vertices
    */
    x: number;
    y: number;
    z?: number;
    material?: any;
    color?: THREE.Color;
    colorHash?: string;
}

export interface Factor {
    /*
    ** Interface to represent scale, rotation, translate factor
    */
    x: number;
    y: number;
    z?: number;
}

export function getRandomColor() {
    /**
     *  This method generates random color in hex 
     */
    var letters = '0123456789abcdef'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}



