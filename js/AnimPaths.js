define(["Three"], function(THREE) {

    function FigureEight3(radius, height, smoothness) {
        var loop = new THREE.ClosedSplineCurve3([
            new THREE.Vector3(0, height, radius * 2),
            new THREE.Vector3(radius, height, radius),

            new THREE.Vector3(-radius, height, -radius),
            new THREE.Vector3(0, height, -radius * 2),

            new THREE.Vector3(radius, height, -radius),
            new THREE.Vector3(-radius, height, radius)
        ]);
        return loop.getPoints(smoothness);
    };


    var shakePath = FigureEight3(30, 5, 200);

    var shakeRotZ = [];
    shakePath = [];

    var numPoints = 50;
    var rx = 100;
    var ry = 30;
    for (var i = 0; i < numPoints; i++) {
        var a = Math.PI / 2 + Math.PI * 0.8 * (i - numPoints / 2) / numPoints;
        shakeRotZ[i] = a;
        shakePath[i] = new THREE.Vector3(rx * Math.cos(a), ry * Math.sin(a) - (50 + ry / 2), 0);
    }

    return {
        shakePath: shakePath,
        shakeRotZ: shakeRotZ,
    }
});