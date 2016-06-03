import { Component } from  '@angular/core';
import { ROUTER_DIRECTIVES, ROUTER_PROVIDERS, RouteConfig } from  '@angular/router-deprecated';

import { CameraTypeComponent } from  './camera-type.component';
import { HomeComponent } from  './home.component';
import { MaterialTypeComponent } from  './material-type.component';
import { LightTypeComponent } from  './light-type.component';
import { DirectionalLightComponent } from  './directional-light.component';
import { PipelineComponent } from  './pipeline.component';
import { AboutComponent } from  './about.component';

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
    },
    
    {
        path: "/cameraType",
        name: "CameraType",
        component: CameraTypeComponent
    },
    
    {
        path: "/materialType",
        name: "MaterialType",
        component: MaterialTypeComponent
    },
    
    {
        path: "/lightType",
        name: "LightType",
        component: LightTypeComponent
    },
    
    {
        path: "/directionalLightType",
        name: "DirectionalLightType",
        component: DirectionalLightComponent
    },
    
    {
        path: "/viewPipeline",
        name: "ViewPipeline",
        component: PipelineComponent
    }
    ,
    
    {
        path: "/about",
        name: "About",
        component: AboutComponent
    }
     
    
] )

export class GraphicsAppComponent {
    title: string;
    constructor() {
        this.title = `Angular2 Bootstrap TypeScrispt threeJS`;
    }
}