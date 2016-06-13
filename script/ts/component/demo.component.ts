import { Component } from  '@angular/core';
import { ROUTER_DIRECTIVES, ROUTER_PROVIDERS } from  '@angular/router-deprecated';
@Component( {
  selector: "demp",
  templateUrl: 'partials/demo.html',
  directives: [ ROUTER_DIRECTIVES ] 
} )


export class DemoComponent {
    title: string;
    constructor() {
        this.title = `Select your demo`;
    }
}