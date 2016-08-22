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

{/**
    * Loading and initializing YUI library and HSL widget
    */
    YUI().use('dial', 'slider', 'event-valuechange', 'color', function(Y) {
        Y.one('.picker').addClass('yui3-skin-sam');

            var hue = new Y.Dial({
                    min: 0,
                    max: 360,
                    stepsPerRevolution: 360,
                    continuous: true,
                    centerButtonDiameter: 0.4,
                    render: '#hue-dial'
            });

            var sat = new Y.Slider({
                    min: 0,
                    max: 100,
                    value: 100,
                    render: '#sat-slider'
            });

            var lum = new Y.Slider({
                    min: 0,
                    max: 100,
                    value: 50,
                    render: '#lum-slider'
            }),
            
            satValue = Y.one('#sat-slider span'),
            lumValue = Y.one('#lum-slider span'),
            color = Y.one('.color');

            hue.after('valueChange', function(e) {
                updatePickerUI();
            });

            sat.after('thumbMove', function(e) {
                updatePickerUI();
            });

            lum.after('thumbMove', function(e) {
                lumValue.set('text', lum.get('value') + '%');
                updatePickerUI();
            });

            function setPickerUI(hsl) {
                if (typeof hsl.h !== 'undefined') {
                    hue.set('value', +hsl.h);
                }

                if (typeof hsl.s !== 'undefined') {
                    sat.set('value', +hsl.s);
                }

                if (typeof hsl.l !== 'undefined') {
                    lum.set('value', +hsl.l);
                }
            }

            function updatePickerUI() {
                var h = hue.get('value'),
                    s = sat.get('value'),
                    l = lum.get('value'),
                    hslString = Y.Color.fromArray([h, s, l], Y.Color.TYPES.HSL),
                    hexString = Y.Color.toHex(hslString);

                satValue.set('text', s + '%');
                lumValue.set('text', l + '%');

                color.setStyle('backgroundColor', hexString);

                updateOutput(hslString);
            }

            var hexOutput = Y.one('#hex-output'),
                rgbOutput = Y.one('#rgb-output'),
                hslOutput = Y.one('#hsl-output'),
                focused = null;


            hexOutput.on('focus', setFocused);
            hexOutput.on('blur', unsetFocused);
            hexOutput.on('valueChange', updatePickerFromValue);

            rgbOutput.on('focus', setFocused);
            rgbOutput.on('blur', unsetFocused);
            rgbOutput.on('valueChange', updatePickerFromValue);

            hslOutput.on('focus', setFocused);
            hslOutput.on('blur', unsetFocused);
            hslOutput.on('valueChange', updatePickerFromValue);

            function updateOutput(hslString) {
                if (hexOutput !== focused) {
                    hexOutput.set('value', Y.Color.toHex(hslString));
                }
                if (rgbOutput !== focused) {
                    rgbOutput.set('value', Y.Color.toRGB(hslString));
                }
                if (hslOutput !== focused) {
                    hslOutput.set('value', hslString);
                }
            }

            function updatePickerFromValue(e) {
                var val = e.newVal,
                    hsl = [];

                if (Y.Color.toArray(val)) {
                    hsl = Y.Color.toArray(Y.Color.toHSL(val));
                    setPickerUI({
                        h: hsl[0],
                        s: hsl[1],
                        l: hsl[2]
                    });
                }
            }

            function setFocused(e) {
                focused = e.currentTarget;
            }

            function unsetFocused(e) {
                if (focused === e.currentTarget) {
                    focused = null;
                }
            }

            updatePickerUI();

    } );}