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
            ms: 100,
            shake: function () {
                CmdShake();
            },
            clear: function () {
                CmdClear();
            }
        };

        var gui = new dat.GUI();


        function SetupOnChange(controller) {
            controller.onChange(function (value) {
                // Fires on every change, drag, keypress, etc.
                animLoop.ms = simState.ms;
            });
        }


        SetupOnChange(gui.add(simState, 'ms', 1, 500));
        gui.add(simState, 'shake');
        gui.add(simState, 'clear');


        var imgData;
        document.getElementById("filePicture").addEventListener("change", function(event) {
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
                simState.steps = w;
            };
            img.src = URL.createObjectURL(event.target.files[0]);
        });

        // renderer
        if (!Detector.webgl) Detector.addGetWebGLMessage();
        var renderer = new THREE.WebGLRenderer({ antialias: false });
        renderer.setSize(window.innerWidth, window.innerHeight);

        var container = document.getElementById('container');
        container.appendChild(renderer.domElement);

        var stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        stats.domElement.style.zIndex = 100;
        container.appendChild(stats.domElement);

        window.addEventListener('resize', onWindowResize, false);
        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            render();
        }

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


        var geometryC = new THREE.CylinderGeometry(3.9, 3.9, 2, 4, 1);
        var ledM = new THREE.Matrix4();
        ledM.makeRotationX(-Math.PI/2);
        geometryC.applyMatrix(ledM);
        ledM.makeRotationZ(-Math.PI/4);
        geometryC.applyMatrix(ledM);
        ledM.makeTranslation(0, 0, 2.5);
        geometryC.applyMatrix(ledM);

        var geometry = new THREE.CylinderGeometry(2.1, 2.1, 2, 16, 1);
        ledM = new THREE.Matrix4();
        ledM.makeRotationX(-Math.PI/2);
        geometry.applyMatrix(ledM);
        ledM.makeTranslation(0, 0, 1.5);
        geometry.applyMatrix(ledM);

        var rLed = 3;
        var geometryPov  = new THREE.CylinderGeometry(rLed, rLed, 2, 16, 1);
        ledM = new THREE.Matrix4();
        ledM.makeRotationX(-Math.PI/2);
        geometryPov.applyMatrix(ledM);
        ledM.makeTranslation(0, 0, -3);
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

        var shakePath = AnimPaths.shakePath;
        var shakeRotZ = AnimPaths.shakeRotZ;

        var axis = new THREE.Vector3(simState.axisX, simState.axisY, simState.axisZ);
        axis.normalize();
        var m = new THREE.Matrix4();
        m.makeRotationAxis(axis, simState.rotSpeed);
        var t = new THREE.Matrix4();
        t.makeTranslation(simState.transX, simState.transY, simState.transZ);
        m.multiply(t);



        init();
        render();

        function animate() {

            requestAnimationFrame(animate);
            controls.update();

        }


        function init() {

            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
            camera.position.z = -150;
            camera.position.y = 0;

            controls = new THREE.OrbitControls(camera);
            controls.damping = 0.2;
            controls.addEventListener('change', render);

            scene = new THREE.Scene();
            scene.add(shifterGroup);
            scene.add(povGroup);
            scene.fog = null; // new THREE.FogExp2(0x000000, 0.002);
            renderer.setClearColor(0x000000, 1);


            // load STLs async
            var loader = new THREE.STLLoader();
            loader.load("stl/magicshifter_case_104_top.stl", function (geometry) {
                console.log(geometry);
                var mat = new THREE.MeshLambertMaterial({color: 0xFFFF00});
                var stl = new THREE.Mesh(geometry, mat);
                //stl.rotateX(Math.PI);
                group2.add(stl);
                render();
            });

            var loader = new THREE.STLLoader();
            loader.load("stl/magicshifter_case_104_bottom.stl", function (geometry) {
                console.log(geometry);
                var mat = new THREE.MeshLambertMaterial({color: 0x000000});
                var stl = new THREE.Mesh(geometry, mat);
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

            light = new THREE.AmbientLight(0x333333);
            scene.add(light);
        }

        function render() {
            renderer.render(scene, camera);
            stats.update();
        }


        var pos = -1;
        var dir = 1;
        var animLoop = new Utils.AnimationLoop(1, function () {
            if (pos >= 0) {
                var groups = [group, group2, ledGroup];
                for (var gi in groups) {
                    var g = groups[gi];
                    g.rotation.z = shakeRotZ[pos];
                    g.rotation.y = pos/200;
                    g.rotation.x = pos/100;
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
                if (pos >= shakePath.length - 1) {
                    pos = -1;
                    dir = -1;
                }
                render();
            }
        });
        animLoop.start();

        document.getElementById("cmdShake").addEventListener("click", CmdShake, false);

        function CmdShake() {
            CmdClear();
            dir = 1;
            pos = 0;
        }

        function CmdClear() {
            while (povGroup.children.length > 0)
                povGroup.remove(povGroup.children[0]);
            render();
        }

        window.addEventListener('keydown', onKeyDown, false);
        function onKeyDown(event) {
            switch (event.keyCode) {

                case 42:
                    alert("sp")
                    break;

                case 27:
                    var i = 0;
                    var l = new AnimationLoop(1000 / 60, function () {
                        group.position.x = shakePath[i].x;
                        group.position.y = shakePath[i].y;
                        group.position.z = shakePath[i].z;
                        i++;
                        if (i >= shakePath.length)
                            i = 0;
                        render();
                    });
                    l.start();
                    break;

            }
        }

    });
