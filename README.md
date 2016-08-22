# third-view


#### An interactive 3D learning tool.
### Demo: https://third-view.herokuapp.com/ 

Build with :

 * [Angular2]( https://angular.io/ )
 * [TypeScript](https://www.typescriptlang.org/)
 * [threeJS](http://threejs.org/)
 

## How to use

### Make sure you have nodejs, webpack, gulp and typescript installed globally
```
sudo npm install  typescript gulp webpack -g
```

#### Clone the repository
```
git clone https://github.com/priyesh9875/third-view.git
```

#### For quick demo, run following commands, provided you havent deleted bundle folder in src folder.
```
npm install --save express gulp
gulp --gulpfile gulpDist.js
node deployServer.js
```

Open http://localhost:9875 in any browser


### Development 
#### Install the project
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

#### Building for distribution
```
gulp clean
gulp bundle
gulp build
```

##### Then run
```
node deployServer.js
```

Open http://localhost:9875 in any browser


That's it. Enjoy ;)


#### Note
* If your scene becomes slow, just REFRESH the page.
