require.config({
    baseUrl: 'js',

    paths: {
        Three: 'libs/three/three',
        OrbitControls: "libs/three/OrbitControls",
        Detector: "libs/three/Detector",
        STLLoader: "libs/three/STLLoader",
        Stats: "libs/stats.min",
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

    }
});


require([
        "Utils", "AnimPaths", "Three", "Detector", "Stats", "OrbitControls", "STLLoader"],
    function (Utils, AnimPaths, THREE, Detector, Stats) {
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

        var shakePath = AnimPaths.shakePath;
        var shakeRotZ = AnimPaths.shakeRotZ;



// http://www.gingerleprechaun.com/javascript/threejs-tween-along-motion-path
// get the position data half way along the path
//var pathPosition = motionGuide.getPoint(0.5);
// move the man to that position
//object3D.position.x = pathPosition.x;
//object3D.position.z = pathPosition.z;
// get the orientation angle quarter way along the path
//var tangent = motionGuide.getTangent(0.25);
//var angle = Math.atan2(-tangent.z, tangent.x);
// set angle of the man at that position
//object3D.rotation.y = angle;

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
            camera.position.z = 200;
            camera.position.y = 50;

            controls = new THREE.OrbitControls(camera);
            controls.damping = 0.2;
            controls.addEventListener('change', render);
            controls.addEventListener('change', render);

            scene = new THREE.Scene();
            scene.fog = new THREE.FogExp2(0xcccccc, 0.002);
            renderer.setClearColor(scene.fog.color, 1);

            // world

            var geometry = new THREE.CylinderGeometry(0, 10, 30, 4, 1);
            var material = new THREE.MeshLambertMaterial({ color: 0xffffff, shading: THREE.FlatShading });

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
                var mat = new THREE.MeshLambertMaterial({color: 0x4444FF});
                group2 = new THREE.Mesh(geometry, mat);
                group2.rotateX(Math.PI);
                //group2.rotation.x = -0.5 * Math.PI;
                //group2.scale.set(0.6, 0.6, 0.6);
                scene.add(group2);
                render();
            });

            var loader = new THREE.STLLoader();
            loader.load("stl/magicshifter_case_104_bottom.stl", function (geometry) {
                console.log(geometry);
                var mat = new THREE.MeshLambertMaterial({color: 0xFF4444});
                group = new THREE.Mesh(geometry, mat);
                group.rotateX(Math.PI)
                //group.rotation.x = -0.5 * Math.PI;
                //group.scale.set(0.6, 0.6, 0.6);
                scene.add(group);
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


            animate();

        }

        function render() {
            renderer.render(scene, camera);
            stats.update();

        }


        var pos = 0;
        var dir = 1;
        var animLoop = new Utils.AnimationLoop(1000 / 60, function () {
            if (pos >= 0) {
                var groups = [group, group2];
                for (var gi in groups) {
                    var g = groups[gi];
                    g.position.x = shakePath[pos].x;
                    g.position.y = shakePath[pos].y;
                    g.position.z = shakePath[pos].z;
                    g.rotateOnAxis(new THREE.Vector3(0, 0, 1), shakeRotZ[pos] / 10)
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
