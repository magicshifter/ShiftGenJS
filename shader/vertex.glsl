varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vBC;
attribute vec3 barycentric;

void main() {
    vBC = barycentric;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
	vNormal = normalize( normalMatrix * normal );
	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
	vViewPosition = -mvPosition.xyz;

}