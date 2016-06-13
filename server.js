var express = require( 'express' );
var path = require( 'path' );
var app = express();


// set the port of our application
// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 8080;


// make express look in the root directory for assets (css/js/img)
app.use( express.static( __dirname ) );

// redirecting custome routes that angular cant handle.
app.get( '/demo/viewPipeline', ( req, res ) => {
    res.sendFile( path.resolve( __dirname, "partials/view-pipeline.html" ) )
} );

app.get( '/demo/colorHSL', ( req, res ) => {
    res.sendFile( path.resolve( __dirname, "partials/color-hsl.html" ) )
} );

// Forwarding all routes to angular2 to handle
app.get( '/*', ( req, res ) => {
    res.sendFile( path.resolve( __dirname, "index.html" ) );
} );

app.listen( port, function() {
    
	console.log( 'Our app is running on ' + port );

} );