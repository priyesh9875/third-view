import { Component, OnInit } from  '@angular/core';
import { Router } from  '@angular/router-deprecated';

@Component( {
  selector: "home-app",
  templateUrl: 'partials/home.html',
} )

export class HomeComponent implements OnInit {
    title: string;
    constructor( private router: Router ) {
        this.title = 'third-view';
    }
    
    ngOnInit() {
        $('.carousel').carousel({
            interval: 3000 //changes the speed
        });
        $( "#graphics-space" ).hide();

    }
    
    changeRoute( to: string ) {
       this.router.navigate( [ to ] );   
    }

}