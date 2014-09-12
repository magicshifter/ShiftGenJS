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

    var numPoints = 65;
    var rx = 150;
    var ry = 70;
    for (var i = 0; i < numPoints; i++) {
        var a = Math.PI * 0.1 + 0.8*Math.PI * i / numPoints;
        var xx = rx * Math.cos(a);
        var yy = ry * Math.sin(a)
        shakeRotZ[i] = Math.atan2(xx/(rx*rx), -yy/(ry*ry))//Math.atan2(xx, -yy); // Math.PI/2 - a;
        shakePath[i] = new THREE.Vector3(xx, yy-ry-50, 0);
    }

    return {
        shakePath: shakePath,
        shakeRotZ: shakeRotZ,
    }
});