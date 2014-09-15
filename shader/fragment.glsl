uniform vec3 uMaterialColor;

uniform vec3 uDirLightPos;
uniform vec3 uDirLightColor;

uniform float uKd;
uniform float uBorder;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vBC;

void main() {
	// compute direction to light
	vec4 lDirection = viewMatrix * vec4( uDirLightPos, 0.0 );
	vec3 lVector = normalize( lDirection.xyz );

	// diffuse: N * L. Normal must be normalized, since it's interpolated.
	vec3 normal = normalize( vNormal );

	// Student: check the diffuse dot product against uBorder and adjust
	// this diffuse value accordingly.
	//float diffuse = max( dot( normal, lVector ), 0.0) > uBorder ? 1.0 : 0.5;
    float diffuse = max( dot( normal, lVector ), 0.0);

 gl_FragColor = vec4( uKd * uMaterialColor * uDirLightColor * diffuse, 1.0 );
/*	if(any(lessThan(vBC, vec3(0.02)))){
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
    else{

    }
    */
}