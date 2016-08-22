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


const express = require('express');
const path = require('path');
// Server
var server = express();
server.use(express.static(__dirname + '/dist'));

// redirecting custom routes that angular cant handle.
server.get('/demo/viewPipeline', (req, res) => {
    res.sendFile(path.resolve(__dirname, "./dist/partials/view-pipeline.html"))
});

server.get('/demo/colorHSL', (req, res) => {
    res.sendFile(path.resolve(__dirname, "./dist/partials/color-hsl.html"))
});


server.get('/*', (req, res) => {
    res.sendFile(path.resolve(__dirname, "./dist/index.html"));
})

server.listen(9875, () => {
    console.log("Listening on http://localhost:9875")
})
