import { Color, ShaderMaterial, Vector3 } from 'three'

/**
 * AMES Diamond Shader v0.1
 *
 * A deliberately isolated center-stone shader benchmark. This is not a glass
 * preset: it builds a diamond-like response from Fresnel/TIR, facet-facing
 * contrast, multi-bounce-inspired internal return and restrained spectral fire.
 * It is intentionally cheap enough for the browser while we validate the look.
 */
export function createAmesDiamondMaterial() {
  return new ShaderMaterial({
    name: 'AMES Diamond Shader v0.1',
    transparent: false,
    depthWrite: true,
    uniforms: {
      uIor: { value: 2.417 },
      uFire: { value: 0.42 },
      uBrilliance: { value: 1.28 },
      uContrast: { value: 0.72 },
      uCool: { value: new Color('#dfeeff') },
      uWarm: { value: new Color('#fff1d6') },
      uWhite: { value: new Color('#ffffff') },
      uDark: { value: new Color('#07090d') },
    },
    vertexShader: `
      varying vec3 vWorldNormal;
      varying vec3 vWorldPos;
      varying vec3 vObjectPos;
      void main() {
        vObjectPos = position;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      precision highp float;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPos;
      varying vec3 vObjectPos;
      uniform float uIor;
      uniform float uFire;
      uniform float uBrilliance;
      uniform float uContrast;
      uniform vec3 uCool;
      uniform vec3 uWarm;
      uniform vec3 uWhite;
      uniform vec3 uDark;

      float sat(float x){ return clamp(x, 0.0, 1.0); }
      float hash31(vec3 p){
        p = fract(p * 0.1031);
        p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }
      vec3 spectrum(float t){
        vec3 c = 0.5 + 0.5*cos(6.2831853*(t + vec3(0.00,0.33,0.67)));
        return pow(c, vec3(1.35));
      }

      void main(){
        vec3 N = normalize(vWorldNormal);
        vec3 V = normalize(cameraPosition - vWorldPos);
        float ndv = sat(dot(N,V));

        // Physical diamond normal-incidence reflectance from IOR 2.417 (~17%).
        float f0 = pow((uIor - 1.0)/(uIor + 1.0), 2.0);
        float fresnel = f0 + (1.0-f0)*pow(1.0-ndv, 5.0);

        // Facets need alternating bright/dark return to read as a cut stone.
        vec3 L1 = normalize(vec3(-0.42,0.84,0.34));
        vec3 L2 = normalize(vec3(0.72,0.28,-0.63));
        vec3 L3 = normalize(vec3(-0.15,-0.25,0.96));
        float a = abs(dot(N,L1));
        float b = abs(dot(N,L2));
        float c = abs(dot(N,L3));
        float facetReturn = pow(max(max(a,b),c), 5.0);
        float crossReturn = pow(sat(1.0-abs(a-b)), 9.0);

        // Approximate repeated internal reflection / TIR as angular light return.
        float critical = asin(1.0/uIor);
        float grazing = acos(clamp(ndv,0.0,1.0));
        float tir = smoothstep(critical*0.70, critical*1.45, grazing);
        float internal = sat(0.24 + 0.76*facetReturn + 0.30*crossReturn);

        // Dark arrow-like contrast is essential to brilliant-cut readability.
        float az = atan(N.z,N.x);
        float star = pow(abs(cos(4.0*az)), 14.0) * pow(1.0-ndv, 0.55);
        float darkMask = sat(star*uContrast + (1.0-internal)*0.42);

        // Restrained spectral fire: isolated flashes, never rainbow plastic.
        float seed = hash31(floor(vObjectPos*19.0));
        float fireMask = pow(facetReturn, 10.0) * smoothstep(0.58,0.98,seed);
        vec3 fire = spectrum(seed + az/6.2831853) * fireMask * uFire * 2.2;

        vec3 body = mix(uCool,uWarm,sat(dot(N,L2)*0.5+0.5));
        vec3 brilliance = body * (0.28 + internal*uBrilliance);
        brilliance += uWhite * fresnel * 1.55;
        brilliance += uWhite * tir * facetReturn * 0.48;
        brilliance += fire;
        brilliance = mix(brilliance,uDark,darkMask*0.62);

        // Preserve crisp facet boundaries and avoid the white-plastic failure mode.
        float edge = pow(1.0-ndv,3.0);
        brilliance += vec3(0.12,0.17,0.24)*edge;
        gl_FragColor = vec4(brilliance,1.0);
      }
    `,
  })
}
