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

    var numPoints = 350;
    var rx = 100;
    var ry = 100;
    for (var i = 0; i < numPoints; i++) {
        var a = 2*Math.PI * (i - numPoints / 2) / numPoints;
        var xx = rx * Math.cos(a);
        var yy = ry * Math.sin(a)
        shakeRotZ[i] = Math.atan2(xx, yy); // Math.PI/2 - a;
        shakePath[i] = new THREE.Vector3(xx, yy, 0);
    }

    return {
        shakePath: shakePath,
        shakeRotZ: shakeRotZ,
    }
});