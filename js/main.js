require.config({
    baseUrl: 'js',

    paths: {
        Three: 'libs/three/three',
        OrbitControls: "libs/three/OrbitControls",
        Detector: "libs/three/Detector",
        STLLoader: "libs/three/STLLoader",
        Stats: "libs/stats.min",
        Colour: "libs/Colour",
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
        }

    }
});


require([
        "Utils", "AnimPaths", "Three", "Detector", "Stats", "Colour", "OrbitControls", "STLLoader"],
    function (Utils, AnimPaths, THREE, Detector, Stats, Colour) {
        "use strict";

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
        var leds = [];
        var povGroup = new THREE.Object3D();

        shifterGroup.add(group);
        shifterGroup.add(group2);
        shifterGroup.add(ledGroup);


        var geometry = new THREE.CylinderGeometry(2.5, 2.5, 2, 16, 1);
        var ledM = new THREE.Matrix4();
        ledM.makeRotationX(-Math.PI/2);
        geometry.applyMatrix(ledM);
        ledM.makeTranslation(0, 0, 1.5);
        geometry.applyMatrix(ledM);




        for (var i = 0; i < 16; i++) {
            var led = new THREE.Object3D();
            led.translateY(-(5+i*(95/16)));
            ledGroup.add(led);

            var col = new Colour.HSVColour(360*i/16, 100, 100);
            var material = new THREE.MeshLambertMaterial({ color: col.getCSSHexadecimalRGB(), shading: THREE.FlatShading });
            var mesh = new THREE.Mesh(geometry, material);
            mesh.matrixAutoUpdate = false;
            led.add(mesh);
            leds[i] = led;
        }

        var shakePath = AnimPaths.shakePath;
        var shakeRotZ = AnimPaths.shakeRotZ;


        var simState = {
            steps: 50,
            startStep: 0,
            ledRadius: 2,

            axisX: 0.1,
            axisY: 0.9,
            axisZ: 0.11,

            startX: -100,
            startY: 0,
            startZ: 200,

            shifterDirX: 0,
            shifterDirY: 10,
            shifterDirZ: 0,

            transX: 0,
            transY: 0,
            transZ: 0,

            rotSpeed: 0.035,
        };

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
            camera.position.z = -200;
            camera.position.y = 50;

            controls = new THREE.OrbitControls(camera);
            controls.damping = 0.2;
            controls.addEventListener('change', render);

            scene = new THREE.Scene();
            scene.add(shifterGroup);
            scene.add(povGroup);
            scene.fog = new THREE.FogExp2(0xcccccc, 0.002);
            renderer.setClearColor(scene.fog.color, 1);

            // world


            for (var i = 0; i < 0; i++) {

                var mesh = new THREE.Mesh(geometry, material);
                mesh.position.x = ( Math.random() - 0.5 ) * 1000;
                mesh.position.y = ( Math.random() - 0.5 ) * 1000;
                mesh.position.z = ( Math.random() - 0.5 ) * 1000;
                mesh.updateMatrix();
                mesh.matrixAutoUpdate = false;
                scene.add(mesh);

            }

            var loader = new THREE.STLLoader();
            loader.load("stl/magicshifter_case_104_top.stl", function (geometry) {
                console.log(geometry);
                var mat = new THREE.MeshLambertMaterial({color: 0xFFFF00});
                var stl = new THREE.Mesh(geometry, mat);
                //group2.rotateX(Math.PI);
                //group2.rotation.x = -0.5group2 * Math.PI;
                //group2.scale.set(0.6, 0.6, 0.6);
                group2.add(stl);
                render();
            });

            var loader = new THREE.STLLoader();
            loader.load("stl/magicshifter_case_104_bottom.stl", function (geometry) {
                console.log(geometry);
                var mat = new THREE.MeshLambertMaterial({color: 0x000000});
                var stl = new THREE.Mesh(geometry, mat);
                //group.rotateX(Math.PI)
                //group.rotation.x = -0.5 * Math.PI;
                //group.scale.set(0.6, 0.6, 0.6);
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
        var animLoop = new Utils.AnimationLoop(1000 / 60, function () {
            if (pos >= 0) {
                var groups = [group, group2, ledGroup];
                for (var gi in groups) {
                    var g = groups[gi];
                    g.rotation.z  = shakeRotZ[pos];
                }
                shifterGroup.position.x = shakePath[pos].x;
                shifterGroup.position.y = shakePath[pos].y;
                shifterGroup.position.z = shakePath[pos].z;

                if (dir > 0 && pos % 2 == 0) {
                    //var geometry = new THREE.CylinderGeometry(0, 10, 30, 4, 1);
                    var material = new THREE.MeshLambertMaterial({ color: 0xffffff, shading: THREE.FlatShading });

                    for (var i in leds) {
                        var led = leds[i];

                        var mesh = new THREE.Mesh(geometry, material);
                        mesh.matrix = led.matrixWorld.clone();
                        mesh.matrixAutoUpdate = false;
                        povGroup.add(mesh);
                    }
                }

                pos += dir;
                if (pos >= shakePath.length - 1)
                    dir = -1;
                render();
            }
        });
        animLoop.start();

        document.getElementById("cmdShake").addEventListener("click", CmdShake, false);
        function CmdShake() {
            dir = 1;
            pos = 0;
            while (povGroup.children.length > 0)
                povGroup.remove(povGroup.children[0]);
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
