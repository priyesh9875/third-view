// MIT License

// Copyright (c) [2016] [Priyesh Kumar]

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.


const gulp = require('gulp');
const webpack = require('webpack-stream');
const express = require('express');
const path = require('path');
const gulpSequence = require('gulp-sequence');
const del = require("del");

// Server
var server = express();
server.use(express.static(__dirname + '/src'));

// redirecting custom routes that angular cant handle.
server.get('/demo/viewPipeline', (req, res) => {
  res.sendFile(path.resolve(__dirname, "./src/partials/view-pipeline.html"))
});

server.get('/demo/colorHSL', (req, res) => {
  res.sendFile(path.resolve(__dirname, "./src/partials/color-hsl.html"))
});

server.get('/*', (req, res) => {
  res.sendFile(path.resolve(__dirname, "src/index.html"));
})

gulp.task("server", () => {
  server.listen(9875, () => {
    console.log("Listening on http://localhost:9875")
  })
});


// Webpack
gulp.task('bundle', function () {
  gulp.src('./src/app/main.ts')
    .pipe(webpack(require('./webpack.js')))
    .pipe(gulp.dest('./src/bundle'));
});

// // Watch
gulp.task('watch', function () {
  gulp.watch('./src/app/**/*', ['bundle'])
})

// Production
gulp.task('clean', (cb) => {
  return del(["dist"], cb);
});

gulp.task('copyFiles', () => {
  gulp.src(['src/**', '!src/app/**'])
    .pipe(gulp.dest('dist'))
})

gulp.task('build', gulpSequence('clean', 'copyFiles'))

gulp.task('default', gulpSequence('bundle', 'server', 'watch'));