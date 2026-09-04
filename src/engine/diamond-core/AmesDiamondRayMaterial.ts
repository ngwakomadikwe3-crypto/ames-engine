import { Color, CubeTexture, Matrix4, ShaderMaterial, Vector3 } from 'three'
import { MeshBVHUniformStruct, shaderIntersectFunction, shaderStructs } from 'three-mesh-bvh'
import { DIAMOND_OPTICS } from './diamondOptics'

/**
 * AMES Diamond Ray Material v0.1
 * Dedicated GPU facet transport. No MeshPhysicalMaterial / generic glass path.
 * Rays enter the real diamond mesh, intersect its BVH facets, undergo Snell
 * refraction / TIR, and RGB channels use different diamond IORs for dispersion.
 */
export function createAmesDiamondRayMaterial(bvh: MeshBVHUniformStruct, envMap: CubeTexture | null) {
  return new ShaderMaterial({
    name: 'AMES Diamond Ray Engine v0.1',
    transparent: false,
    depthWrite: true,
    uniforms: {
      bvh: { value: bvh },
      envMap: { value: envMap },
      invModelMatrix: { value: new Matrix4() },
      cameraWorld: { value: new Vector3() },
      iorRGB: { value: new Vector3(
        DIAMOND_OPTICS.spectralIor.red,
        DIAMOND_OPTICS.spectralIor.green,
        DIAMOND_OPTICS.spectralIor.blue,
      ) },
    },
    vertexShader: /* glsl */`
      varying vec3 vWorldPosition;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorldPosition = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */`
      precision highp float;
      precision highp int;
      ${shaderStructs}
      ${shaderIntersectFunction}

      uniform BVH bvh;
      uniform samplerCube envMap;
      uniform mat4 invModelMatrix;
      uniform vec3 cameraWorld;
      uniform vec3 iorRGB;
      varying vec3 vWorldPosition;

      const float EPS = 0.0001;
      const int MAX_BOUNCES = 12;

      vec3 worldToLocalPoint(vec3 p) {
        return (invModelMatrix * vec4(p, 1.0)).xyz;
      }
      vec3 worldToLocalDir(vec3 d) {
        return normalize((invModelMatrix * vec4(d, 0.0)).xyz);
      }

      // Trace a wavelength after the camera ray has entered the diamond.
      vec3 traceChannel(vec3 origin, vec3 direction, float ior) {
        vec3 ro = origin;
        vec3 rd = normalize(direction);

        for (int bounce = 0; bounce < MAX_BOUNCES; bounce++) {
          uvec4 faceIndices = uvec4(0u);
          vec3 faceNormal = vec3(0.0);
          vec3 barycoord = vec3(0.0);
          float side = 1.0;
          float dist = 0.0;

          bool hit = bvhIntersectFirstHit(
            bvh, ro, rd, faceIndices, faceNormal, barycoord, side, dist
          );
          if (!hit) break;

          vec3 hitPoint = ro + rd * dist;
          vec3 n = normalize(faceNormal);
          if (dot(rd, n) > 0.0) n = -n;

          // Ray is inside diamond: attempt diamond -> air refraction.
          float eta = ior;
          float cosI = max(0.0, -dot(n, rd));
          float sinT2 = eta * eta * (1.0 - cosI * cosI);

          if (sinT2 > 1.0) {
            // Total internal reflection from the actual facet.
            rd = normalize(reflect(rd, n));
            ro = hitPoint + rd * EPS;
          } else {
            float cosT = sqrt(max(0.0, 1.0 - sinT2));
            vec3 exitDir = normalize(eta * rd + (eta * cosI - cosT) * n);
            return textureCube(envMap, exitDir).rgb;
          }
        }

        return textureCube(envMap, rd).rgb;
      }

      void main() {
        vec3 worldIncident = normalize(vWorldPosition - cameraWorld);
        vec3 ro = worldToLocalPoint(vWorldPosition);
        vec3 rd = worldToLocalDir(worldIncident);

        // Surface normal comes from the rasterized entry facet.
        vec3 dx = dFdx(ro);
        vec3 dy = dFdy(ro);
        vec3 entryN = normalize(cross(dx, dy));
        if (dot(rd, entryN) > 0.0) entryN = -entryN;

        vec3 result = vec3(0.0);
        for (int c = 0; c < 3; c++) {
          float ior = c == 0 ? iorRGB.x : (c == 1 ? iorRGB.y : iorRGB.z);
          vec3 insideDir = refract(rd, entryN, 1.0 / ior);
          vec3 sampleColor;
          if (length(insideDir) < EPS) {
            sampleColor = textureCube(envMap, reflect(rd, entryN)).rgb;
          } else {
            sampleColor = traceChannel(ro + insideDir * EPS, insideDir, ior);
          }
          if (c == 0) result.r = sampleColor.r;
          else if (c == 1) result.g = sampleColor.g;
          else result.b = sampleColor.b;
        }

        // Physical Fresnel reflection at the air/diamond entry interface.
        float f0 = pow((iorRGB.y - 1.0) / (iorRGB.y + 1.0), 2.0);
        float cosV = clamp(-dot(entryN, rd), 0.0, 1.0);
        float fresnel = f0 + (1.0 - f0) * pow(1.0 - cosV, 5.0);
        vec3 reflected = textureCube(envMap, reflect(rd, entryN)).rgb;
        result = mix(result, reflected, fresnel);

        gl_FragColor = vec4(result, 1.0);
      }
    `,
  })
}
