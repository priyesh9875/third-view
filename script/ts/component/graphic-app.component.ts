import { Component } from  '@angular/core';
import { ROUTER_DIRECTIVES, ROUTER_PROVIDERS, RouteConfig } from  '@angular/router-deprecated';

import { CameraTypeComponent } from  './camera-type.component';
import { HomeComponent } from  './home.component';
import { MaterialTypeComponent } from  './material-type.component';
import { LightTypeComponent } from  './light-type.component';
import { DirectionalLightComponent } from  './directional-light.component';
import { AboutComponent } from  './about.component';
import { DemoComponent } from  './demo.component';
import { ColorRGBComponent } from  './color-rgb.component';

@Component( {
  selector: "graphics-app",
  templateUrl: 'partials/graphics-app.html',
  directives: [ ROUTER_DIRECTIVES ],
  providers: [ ROUTER_PROVIDERS ]
} )

@RouteConfig( [

    {
        path: "/home",
        name: "Home",
        component: HomeComponent,
        useAsDefault: true,
    }, {
        path: "/demo/cameraType",
        name: "CameraType",
        component: CameraTypeComponent
    }, {
        path: "/demo/materialType",
        name: "MaterialType",
        component: MaterialTypeComponent
    }, {
        path: "/demo/lightType",
        name: "LightType",
        component: LightTypeComponent
    }, {
        path: "/demo/directionalLightType",
        name: "DirectionalLightType",
        component: DirectionalLightComponent
    }, {
        path: "/demo/colorRGB",
        name: "ColorRGB",
        component: ColorRGBComponent
    }, {
        path: "/about",
        name: "About",
        component: AboutComponent
    }, {
        path: "/demo",
        name: "Demo",
        component: DemoComponent
    }
    
] )

export class GraphicsAppComponent {
    title: string;
    constructor() {
        this.title = `Angular2 Bootstrap TypeScrispt threeJS`;
    }
}