require.config({
    baseUrl: 'js',

    paths: {
        Three: 'libs/three/three',
        OrbitControls: "libs/three/OrbitControls",
        Detector: "libs/three/Detector",
        STLLoader: "libs/three/STLLoader",
        Stats: "libs/stats.min",
        Colour: "libs/Colour",
        DatGUI: "libs/dat.gui.min",
        Underscore: "libs/underscore"
    },
    shim: {
        Three: {
            exports: "THREE",
        },
        "OrbitControls": {
            deps: ['Three'],
            exports: "THREE.OrbitControls",
        },
        "Detector": {
            exports: "Detector",
        },
        "STLLoader": {
            deps: ['Three'],
            exports: "THREE.STLLoader",
        },

        Stats: {
            exports: "Stats",
        },

        Underscore: {
            exports: "_",
        },

        Colour: {
            deps: [],
            exports: "Colour",
            init: function() {
                return {
                    RGBColour: RGBColour,
                    HSVColour: HSVColour,
                };
            }
        },

        DatGUI: {
            exports: "dat",
        }

    }
});


require([
        "Utils", "AnimPaths", "Three", "Detector", "DatGUI", "Stats", "Colour", "OrbitControls", "STLLoader"],
    function (Utils, AnimPaths, THREE, Detector, dat, Stats, Colour) {
        "use strict";

        var simState = {
            enableMouseView: true,
            ms: 1,

            showTop: true,
            showBottom: true,

            colorTop: "#222222",
            colorBottom: "#222222",

            renderWidth: 2800,
            renderHeight: 1575,
            render: function() {
                CmdRender();
            },

            shake: function () {
                CmdShake();
            },
            clear: function () {
                CmdClear();
            }
        };


        // renderer
        if (!Detector.webgl) Detector.addGetWebGLMessage();
        var renderer = new THREE.WebGLRenderer({ antialias: false });
        renderer.setSize(window.innerWidth, window.innerHeight);

        var container = document.getElementById('container');
        container.appendChild(renderer.domElement);


        //var stats = new Stats();
        //stats.domElement.style.position = 'absolute';
        //stats.domElement.style.top = '0px';
        ///stats.domElement.style.zIndex = 100;
        //container.appendChild(stats.domElement);

        window.addEventListener('resize', onWindowResize, false);
        function onWindowResize() {
            resize(window.innerWidth, window.innerHeight);
        }

        var scene = new THREE.Scene();

        var camera, controls, scene;
        var group = new THREE.Object3D();
        var group2 = new THREE.Object3D();
        var shifterGroup = new THREE.Object3D();
        var ledGroup = new THREE.Object3D();
        var leds = [], ledMeshes = [];
        var povGroup = new THREE.Object3D();

        shifterGroup.add(group);
        shifterGroup.add(group2);
        shifterGroup.add(ledGroup);

        group.visible = simState.showTop;
        group2.visible = simState.showBottom;

        var geometryPcb = new THREE.BoxGeometry( 25, 100, 1 );
        var materialPcb = new THREE.MeshLambertMaterial( {color: 0x000000} );
        var mPcb = new THREE.Matrix4();
        mPcb.makeTranslation(0, -50, 3.5);
        geometryPcb.applyMatrix(mPcb);
        var pcb = new THREE.Mesh( geometryPcb, materialPcb );
        shifterGroup.add( pcb );


        var geometryC = new THREE.CylinderGeometry(3.9, 3.9, 2, 4, 1);
        var ledM = new THREE.Matrix4();
        ledM.makeRotationX(-Math.PI/2);
        geometryC.applyMatrix(ledM);
        ledM.makeRotationZ(-Math.PI/4);
        geometryC.applyMatrix(ledM);
        ledM.makeTranslation(0, 0, 2.5);
        geometryC.applyMatrix(ledM);

        var rLed = 2.1;
        var geometry = new THREE.CylinderGeometry(rLed, rLed, 2, 16, 1);
        ledM = new THREE.Matrix4();
        ledM.makeRotationX(-Math.PI/2);
        geometry.applyMatrix(ledM);
        ledM.makeTranslation(0, 0, 1.5);
        geometry.applyMatrix(ledM);

        var rPovLed = 2.3;
        var geometryPov  = new THREE.CylinderGeometry(rPovLed, rPovLed, 2, 16, 1);
        ledM = new THREE.Matrix4();
        ledM.makeRotationX(-Math.PI/2);
        geometryPov.applyMatrix(ledM);
        ledM.makeTranslation(0, 0, -4);
        geometryPov.applyMatrix(ledM);

        for (var i = 0; i < 16; i++) {
            var led = new THREE.Object3D();
            led.translateY(-(5+i*(95/16)));
            ledGroup.add(led);

            var col = new Colour.HSVColour(360*i/16, 100, 100);
            //var material = new THREE.MeshLambertMaterial({ color: col.getCSSHexadecimalRGB(), shading: THREE.FlatShading });
            var material = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, shading: THREE.FlatShading });
            //var material = new THREE.MeshBasicMaterial({color: 0});//new THREE.MeshLambertMaterial({ color: col.getCSSHexadecimalRGB(), shading: THREE.FlatShading });

            var mesh = new THREE.Mesh(geometry, material);

            var materialC = new THREE.MeshLambertMaterial({ color: 0x000000, shading: THREE.FlatShading });
            //var material = new THREE.MeshBasicMaterial({color: 0});//new THREE.MeshLambertMaterial({ color: col.getCSSHexadecimalRGB(), shading: THREE.FlatShading });

            var meshC = new THREE.Mesh(geometryC, materialC);

            mesh.matrixAutoUpdate = false;
            led.add(mesh);
            led.add(meshC);
            ledMeshes[i] = mesh;
            leds[i] = led;
        }




        function createShaderMaterial(id, light, vs, fs) {

            // could be a global, defined once, but here for convenience
            var shaderTypes = {
                'phongDiffuse' : {

                    uniforms: {

                        "uDirLightPos":	{ type: "v3", value: new THREE.Vector3() },
                        "uDirLightColor": { type: "c", value: new THREE.Color( 0xFFFFFF ) },

                        "uMaterialColor": { type: "c", value: new THREE.Color( 0xFFFFFF ) },

                        uKd: {
                            type: "f",
                            value: 0.7
                        },
                        uBorder: {
                            type: "f",
                            value: 0.4
                        }
                    }
                }
            };

            var shader = shaderTypes[id];

            var u = THREE.UniformsUtils.clone(shader.uniforms);

            // this line will load a shader that has an id of "vertex" from the .html file
            //var vs = loadShader("vertex");
            // this line will load a shader that has an id of "fragment" from the .html file
            //var fs = loadShader("fragment");
            var material = new THREE.ShaderMaterial({ uniforms: u, vertexShader: vs, fragmentShader: fs });

            material.uniforms.uDirLightPos.value = light.position;
            material.uniforms.uDirLightColor.value = light.color;

            return material;

        }

        var loader = new Utils.ResLoader();
        loader.load("vertexShader", "shader/vertex.glsl", "text");
        loader.load("fragmentShader", "shader/fragment.glsl", "text");
        loader.load("glowV", "shader/glowV.glsl", "text");
        loader.load("glowF", "shader/glowF.glsl", "text");
        loader.start(false, setupFn);

        var toonShader, glowShader;
        var light = new THREE.DirectionalLight(0xffffff);
        light.position.set(1, 1, -1);

        function setupFn(data) {

            toonShader = createShaderMaterial("phongDiffuse", light, data.vertexShader, data.fragmentShader);
            //shifterBottom.material = toonShader;

            init();
            var sphereGeom = new THREE.SphereGeometry(100, 32, 16);
            // create custom material from the shader code above
            //   that is within specially labeled script tags
            var customMaterial = new THREE.ShaderMaterial(
                {
                    uniforms:
                    {
                        "c":   { type: "f", value: 0.1 },
                        "p":   { type: "f", value: 3.0 },
                        glowColor: { type: "c", value: new THREE.Color(0xffff00) },
                        viewVector: { type: "v3", value: new THREE.Vector3(0, 1, 0) },
                    },
                    vertexShader:   data.glowV,
                    fragmentShader: data.glowF,
                    side: THREE.FrontSide,
                    blending: THREE.AdditiveBlending,
                    transparent: true
                }   );

            glowShader = customMaterial;
            var moonGlow = new THREE.Mesh( sphereGeom.clone(), customMaterial );
            //scene.add( moonGlow );

            render();
        }

        var gui = new dat.GUI();


        function SetupOnChange(controller) {
            controller.onChange(function (value) {
                // Fires on every change, drag, keypress, etc.
                animLoop.ms = simState.ms;
                group.visible = simState.showTop;
                group2.visible = simState.showBottom;

                controls.enabled = simState.enableMouseView;
                if (shifterTop) {
                    shifterTop.material.color = new THREE.Color(simState.colorTop);
                }
                if (shifterBottom) {
                    shifterBottom.material.color = new THREE.Color(simState.colorBottom);
                }
                render();
            });
        }


        SetupOnChange(gui.add(simState, 'enableMouseView'));
        SetupOnChange(gui.add(simState, 'ms', 1, 500));
        SetupOnChange(gui.add(simState, 'showTop'));
        SetupOnChange(gui.addColor(simState, 'colorTop'));
        SetupOnChange(gui.add(simState, 'showBottom'));
        SetupOnChange(gui.addColor(simState, 'colorBottom'));
        SetupOnChange(gui.add(simState, 'renderWidth'));
        SetupOnChange(gui.add(simState, 'renderHeight'));
        gui.add(simState, 'render');
        gui.add(simState, 'shake');
        gui.add(simState, 'clear');

        function loadHandler(url, callback) {
            var img = new Image;
            img.onload = function() {
                var canvas = document.getElementById('canvasActiveBitmap');

                var w = img.width;
                var h = img.height;
                canvas.width = w;
                canvas.height = h;

                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                imgData = ctx.getImageData(0,0,w,h);
                if (callback)
                    callback();
            };
            img.src = url;
        }

        function addImgHandler(img) {
            img.addEventListener("click", function(evt) {
                var target = evt.target;
                loadHandler(target.src, CmdShake);
            }, false);
        }

        var images = document.getElementsByClassName("images");
        for (var i = 0; i < images.length; i++) {
            var img = images[i];
            addImgHandler(img);
        }

        var imgData;
        document.getElementById("filePicture").addEventListener("change", function(event) {
            loadHandler(URL.createObjectURL(event.target.files[0]), CmdShake);
        });
        loadHandler("imgs/NyanCatFinal2.png", CmdShake);


        var shakePath = AnimPaths.shakePath;
        var shakeRotZ = AnimPaths.shakeRotZ;


        //init();


        function animate() {

            requestAnimationFrame(animate);
            controls.update();

        }

        var shifterBottom;
        var shifterTop;


        function init() {

            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
            camera.position.z = -150;
            camera.position.y = 80;

            controls = new THREE.OrbitControls(camera);
            controls.damping = 0.2;
            controls.addEventListener('change', render);

            scene.add(shifterGroup);
            scene.add(povGroup);
            scene.fog = null; // new THREE.FogExp2(0x000000, 0.002);
            renderer.setClearColor(0x000000, 1);


            // load STLs async
            var loader = new THREE.STLLoader();
            loader.load("stl/magicshifter_case_104_top.stl", function (geometry) {
                console.log(geometry);
                var mat = new THREE.MeshLambertMaterial({color: simState.colorBottom});
                mat = new THREE.MeshPhongMaterial({color: simState.colorBottom});
                //mat = toonShader;
                var stl = new THREE.Mesh(geometry, mat);
                shifterBottom = stl;
                //stl.rotateX(Math.PI);
                group2.add(stl);
                render();
            });

            var loader = new THREE.STLLoader();
            loader.load("stl/magicshifter_case_104_bottom.stl", function (geometry) {
                console.log(geometry);
                var mat = new THREE.MeshLambertMaterial({color: simState.colorTop});
                mat = new THREE.MeshPhongMaterial({color: simState.colorTop})
                //mat = toonShader;
                var stl = new THREE.Mesh(geometry, mat);
                shifterTop = stl;
                //stl.rotateX(Math.PI)
                group.add(stl);
                render();
            });


            // lights
            var light;

            light = new THREE.DirectionalLight(0xffffff);
            light.position.set(1, 1, 1);
            scene.add(light);

            light = new THREE.DirectionalLight(0xffffff);
            light.position.set(-1, -1, -1);
            scene.add(light);

            light = new THREE.DirectionalLight(0xffffff);
            light.position.set(-1, 1, -1);
            scene.add(light);




            light = new THREE.AmbientLight(0x000000);
            scene.add(light);
        }

        function render() {
            if (glowShader) {
                glowShader.uniforms.viewVector.value = camera.position.clone();
            }

            renderer.render(scene, camera);
            //stats.update();
        }


        var pos = -1;
        var dir = 1;
        var endPos = -1;

        var animLoop = new Utils.AnimationLoop(simState.ms, function () {
            if (pos >= 0) {
                var groups = shifterGroup.children;
                for (var gi in groups) {
                    var g = groups[gi];
                    g.rotation.z = shakeRotZ[pos];
                    g.rotation.y = pos/250;
                    g.rotation.x = pos/140;
                }
                shifterGroup.position.x = shakePath[pos].x;
                shifterGroup.position.y = shakePath[pos].y;
                shifterGroup.position.z = shakePath[pos].z;

                if (dir > 0) {
                    for (var i in leds) {
                        var led = leds[i];
                        var ledMesh = ledMeshes[i];

                        var col = new Colour.HSVColour(360*pos/shakePath.length, 100, 100, 0.3);

                        if (imgData) {
                            var x = pos + Math.round(imgData.width/2 - shakePath.length/2);
                            //x = pos;
                            if (x < 0 || x >= imgData.width){
                                col = new Colour.RGBColour(0,0,0);
                            }
                            else {
                                var y = 15 - i;

                                var raw = imgData.data;
                                var idx = x * 4 + imgData.width * 4 * y;
                                if (idx >= 0 && idx < raw.length) {
                                    col = new Colour.RGBColour(raw[idx], raw[idx + 1], raw[idx + 2], raw[idx + 3] / 255.0, 0.3);
                                }
                            }
                        }
                        var rgb = col.getRGB();
                        var mC = new THREE.Color(rgb.r/255, rgb.g/255, rgb.b/255);

                        if (rgb.r > 0 || rgb.g > 0 || rgb.b > 0)
                        {
                            ledMesh.material = new THREE.MeshBasicMaterial({color: mC});;
                            var material = new THREE.MeshBasicMaterial({color: mC});//new THREE.MeshLambertMaterial({ color: col.getCSSHexadecimalRGB(), shading: THREE.FlatShading });
                            //material.color = new THREE.Color(col.getCSSIntegerRGBA());
                            //material = glowShader;
                            var mesh = new THREE.Mesh(geometryPov, material);
                            mesh.matrix = led.matrixWorld.clone();
                            mesh.matrixAutoUpdate = false;
                            povGroup.add(mesh);
                        }
                        else {
                            ledMesh.material = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, shading: THREE.FlatShading });
                        }
                    }
                }

                pos += dir;
                if (pos >= shakePath.length - 1 || pos > endPos) {
                    pos = -1;
                    dir = -1;
                }
                render();
            }
        });
        animLoop.start();

        function CmdShake() {
            CmdClear();
            if (imgData) {
                dir = 1;
                var padding = 7;
                pos = Math.round(shakePath.length / 2 - (imgData.width / 2 + padding));
                endPos = Math.round(shakePath.length / 2 + (imgData.width / 2 + padding));
                if (pos < 0)
                    pos = 0;
                //pos = 0;
            }
        }

        function CmdClear() {
            while (povGroup.children.length > 0)
                povGroup.remove(povGroup.children[0]);
            render();
        }

        function resize(w, h) {
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
            render();
        }

        function CmdRender() {
            var w = simState.renderWidth;
            var h = simState.renderHeight;
            resize(w, h);
            window.open( renderer.domElement.toDataURL("image/png"), "Final");
            onWindowResize()
        }

        window.addEventListener('keydown', onKeyDown, false);
        function onKeyDown(event) {
            switch (event.keyCode) {

                case 0x53:
                    CmdShake();
                    break;

                case 0x43:
                    CmdClear();
                    break;

                case 0x42: // B
                    CmdRender();
                    break;

            }
        }

    });
