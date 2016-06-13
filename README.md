# third-view


#### An interactive 3D learning tool.

Build with :

 * [Angular2]( https://angular.io/ )
 * [TypeScript](https://www.typescriptlang.org/)
 * [threeJS](http://threejs.org/)
 

## How to use

### Make sure you have nodejs and typescript installed globally

#### Clone the repository
```
git clone https://github.com/priyesh9875/third-view.git
```

#### Build the project
Open nodejs command prompt in cloned directory and run
```
npm install
```

This will install all the required packages.

Now run  ```typings install -save -global  ```

This will install all required typings for development and compilation of typescript files.
#### Start the project
After successfully installing all the packages, run
```
npm start
```

That's it. Enjoy ;)


#### Note
* To access view pipeline and HSL color model in local server, you need to run nodejs server.js. Because their routes are handled by expressjs.
* If your scene becomes slow, just REFRESH the page.
* Sometimes npm install stuck at a point or you might get error, cannot find lite-server as a command. Then just clone the repository into another directory and again run ``` npm install ``` and ```typings install -save -global  ```. 
