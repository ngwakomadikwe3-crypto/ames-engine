import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  BackSide,
  Box3,
  CubeTexture,
  DoubleSide,
  HalfFloatType,
  Mesh,
  Matrix4,
  Object3D,
  Quaternion,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector4,
  Vector3,
  WebGLRenderTarget,
} from 'three'
import type { BufferAttribute, BufferGeometry } from 'three'
import type { RefObject } from 'react'
import { createCanonicalRoundBrilliantGeometry } from '../jewelry'

const backfaceVertexShader = `
varying vec3 vWorldNormal;
void main() {
  vWorldNormal = normalize(mat3(transpose(viewMatrix)) * normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

const backfaceFragmentShader = `
varying vec3 vWorldNormal;
void main() {
  gl_FragColor = vec4(vWorldNormal * 0.5 + 0.5, 1.0);
}`

const diamondVertexShader = `
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  vWorldNormal = normalize(mat3(transpose(viewMatrix)) * normalMatrix * normal);
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}`

const diamondFragmentShader = `
precision highp float;
uniform sampler2D uBackface;
uniform samplerCube uEnvironment;
uniform vec2 uResolution;
uniform float uIor;
uniform float uDispersion;
uniform float uExposure;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

vec3 environment(vec3 direction) {
  return textureCube(uEnvironment, normalize(direction)).rgb;
}

float fresnelSchlick(vec3 ray, vec3 normal, float ior) {
  float r0 = (1.0 - ior) / (1.0 + ior);
  r0 *= r0;
  return clamp(r0 + (1.0 - r0) * pow(1.0 - max(dot(-ray, normal), 0.0), 5.0), 0.0, 0.96);
}

vec3 traceFacet(vec3 incident, vec3 frontNormal, vec3 rearNormal, float ior) {
  vec3 ray = refract(incident, frontNormal, 1.0 / ior);
  vec3 exitRay = refract(ray, -rearNormal, ior);
  if (length(exitRay) > 0.001) return environment(exitRay);

  ray = reflect(ray, -rearNormal);
  exitRay = refract(ray, -frontNormal, ior);
  if (length(exitRay) > 0.001) return environment(exitRay) * 0.94;

  ray = reflect(ray, -frontNormal);
  exitRay = refract(ray, -rearNormal, ior);
  if (length(exitRay) > 0.001) return environment(exitRay) * 0.88;

  ray = reflect(ray, -rearNormal);
  exitRay = refract(ray, -frontNormal, ior);
  if (length(exitRay) > 0.001) return environment(exitRay) * 0.82;

  return environment(reflect(ray, -frontNormal)) * 0.76;
}

void main() {
  vec3 incident = normalize(vWorldPosition - cameraPosition);
  vec3 frontNormal = normalize(vWorldNormal);
  vec2 screenUv = gl_FragCoord.xy / uResolution;
  vec3 rearNormal = normalize(texture2D(uBackface, screenUv).rgb * 2.0 - 1.0);
  float spread = uDispersion;
  vec3 transmitted;
  transmitted.r = traceFacet(incident, frontNormal, rearNormal, max(1.01, uIor - spread)).r;
  transmitted.g = traceFacet(incident, frontNormal, rearNormal, uIor).g;
  transmitted.b = traceFacet(incident, frontNormal, rearNormal, uIor + spread).b;
  vec3 reflected = environment(reflect(incident, frontNormal));
  float fresnel = fresnelSchlick(incident, frontNormal, uIor);
  vec3 color = mix(transmitted * 1.38, reflected * 1.14, fresnel);
  float facetEdge = pow(1.0 - abs(dot(frontNormal, rearNormal)), 3.0);
  color += facetEdge * transmitted * 0.18;
  color *= uExposure;
  color = color / (1.0 + color);
  gl_FragColor = vec4(pow(max(color, 0.0), vec3(1.0 / 2.2)), 0.98);
}`

const ENABLE_BACKFACE_PASS = true

export interface AmesDiamondProps {
  environment: CubeTexture
  existingMesh?: Mesh
  geometry?: BufferGeometry
  position?: [number, number, number] | Vector3
  quaternion?: [number, number, number, number] | Quaternion
  rotation?: [number, number, number]
  scale?: number
  meshRef?: RefObject<Mesh | null>
  onMaterialAssigned?: (mesh: Mesh) => void
}

function prepareGeometryForExistingMesh(existingMesh: Mesh) {
  const importedBounds = new Box3().setFromBufferAttribute(existingMesh.geometry.getAttribute('position') as BufferAttribute)
  const importedSize = importedBounds.getSize(new Vector3())
  const sizes = [importedSize.x, importedSize.y, importedSize.z]
  let stoneAxis = 0
  let closestPairDifference = Number.POSITIVE_INFINITY
  for (let axis = 0; axis < 3; axis += 1) {
    const firstGirdleAxis = (axis + 1) % 3
    const secondGirdleAxis = (axis + 2) % 3
    const pairDifference = Math.abs(sizes[firstGirdleAxis] - sizes[secondGirdleAxis])
    if (pairDifference < closestPairDifference) {
      closestPairDifference = pairDifference
      stoneAxis = axis
    }
  }
  const girdleDiameter = (sizes[(stoneAxis + 1) % 3] + sizes[(stoneAxis + 2) % 3]) / 2
  const canonical = createCanonicalRoundBrilliantGeometry()
  const canonicalBounds = new Box3().setFromBufferAttribute(canonical.getAttribute('position') as BufferAttribute)
  const canonicalSize = canonicalBounds.getSize(new Vector3())
  const canonicalGirdleDiameter = Math.max(canonicalSize.x, canonicalSize.z)
  const stoneAxisDirection = new Vector3().setComponent(stoneAxis, 1)
  const rotation = new Matrix4().makeRotationFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), stoneAxisDirection))
  const uniformScale = girdleDiameter / canonicalGirdleDiameter
  const importedCenter = importedBounds.getCenter(new Vector3())
  const canonicalCenter = canonicalBounds.getCenter(new Vector3()).multiplyScalar(uniformScale).applyMatrix4(rotation)
  const position = canonical.getAttribute('position')
  const vertex = new Vector3()
  for (let index = 0; index < position.count; index += 1) {
    vertex.fromBufferAttribute(position, index).applyMatrix4(rotation).multiplyScalar(uniformScale)
    vertex.add(importedCenter).sub(canonicalCenter)
    position.setXYZ(index, vertex.x, vertex.y, vertex.z)
  }
  position.needsUpdate = true
  canonical.computeBoundingBox()
  canonical.computeBoundingSphere()
  return canonical
}

function assertExistingMeshTransformUnchanged(mesh: Mesh, parent: Object3D | null, position: Vector3, quaternion: Quaternion, scale: Vector3, matrix: Matrix4) {
  if (mesh.parent !== parent || !mesh.position.equals(position) || !mesh.quaternion.equals(quaternion) || !mesh.scale.equals(scale) || !mesh.matrix.equals(matrix)) {
    throw new Error('Diamond Object3D transform changed while fitting canonical geometry')
  }
}

export function AmesDiamond({
  environment,
  existingMesh,
  geometry: providedGeometry,
  position,
  quaternion,
  rotation = [0, 0.28, 0],
  scale = 1.25,
  meshRef: providedMeshRef,
  onMaterialAssigned,
}: AmesDiamondProps) {
  const internalMeshRef = useRef<Mesh>(null)
  const meshRef = providedMeshRef ?? internalMeshRef
  const { camera, gl, scene, size } = useThree()
  const geometry = useMemo(() => providedGeometry ?? (existingMesh ? prepareGeometryForExistingMesh(existingMesh) : createCanonicalRoundBrilliantGeometry()), [existingMesh, providedGeometry])
  const target = useMemo(() => new WebGLRenderTarget(1, 1, { type: HalfFloatType }), [])
  const backScene = useMemo(() => new Scene(), [])
  const uniforms = useMemo(() => ({
    uBackface: { value: target.texture },
    uEnvironment: { value: environment },
    uResolution: { value: new Vector2(1, 1) },
    uIor: { value: 2.417 },
    uDispersion: { value: 0.018 },
    uExposure: { value: 1.12 },
  }), [environment, target])
  const material = useMemo(() => new ShaderMaterial({
    uniforms,
    vertexShader: diamondVertexShader,
    fragmentShader: diamondFragmentShader,
    transparent: true,
    side: DoubleSide,
    toneMapped: true,
  }), [uniforms])
  const backMaterial = useMemo(() => new ShaderMaterial({
    vertexShader: backfaceVertexShader,
    fragmentShader: backfaceFragmentShader,
    side: BackSide,
  }), [])

  useEffect(() => {
    const backGeometry = existingMesh ? geometry.clone() : geometry
    const backMesh = new Mesh(backGeometry, backMaterial)
    backScene.add(backMesh)
    if (existingMesh) {
      const originalParent = existingMesh.parent
      const originalPosition = existingMesh.position.clone()
      const originalQuaternion = existingMesh.quaternion.clone()
      const originalScale = existingMesh.scale.clone()
      const originalMatrix = existingMesh.matrix.clone()
      existingMesh.geometry = geometry
      existingMesh.material = material
      assertExistingMeshTransformUnchanged(existingMesh, originalParent, originalPosition, originalQuaternion, originalScale, originalMatrix)
      onMaterialAssigned?.(existingMesh)
    }
    return () => {
      backScene.remove(backMesh)
      if (existingMesh) backGeometry.dispose()
      if (!providedGeometry) geometry.dispose()
      material.dispose()
      backMaterial.dispose()
      target.dispose()
    }
  }, [backMaterial, backScene, existingMesh, geometry, material, onMaterialAssigned, providedGeometry, target])

  useFrame(() => {
    if (!ENABLE_BACKFACE_PASS) return
    const mesh = existingMesh ?? meshRef.current
    const backMesh = backScene.children[0] as Mesh | undefined
    if (!mesh || !backMesh) return
    const width = Math.max(1, Math.floor(size.width * gl.getPixelRatio()))
    const height = Math.max(1, Math.floor(size.height * gl.getPixelRatio()))
    if (target.width !== width || target.height !== height) {
      target.setSize(width, height)
      uniforms.uResolution.value.set(width, height)
    }
    backMesh.matrixWorld.copy(mesh.matrixWorld)
    backMesh.matrixAutoUpdate = false
    backScene.matrixWorld.identity()
    const previousTarget = gl.getRenderTarget()
    const previousBackground = scene.background
    const previousOverrideMaterial = scene.overrideMaterial
    const previousAutoClear = gl.autoClear
    const previousXrEnabled = gl.xr.enabled
    const previousViewport = new Vector4()
    const previousScissor = new Vector4()
    gl.getViewport(previousViewport)
    gl.getScissor(previousScissor)
    const previousScissorTest = gl.getScissorTest()
    try {
      gl.setRenderTarget(target)
      gl.setViewport(0, 0, width, height)
      gl.setScissor(0, 0, width, height)
      gl.setScissorTest(false)
      gl.autoClear = true
      gl.xr.enabled = false
      gl.clear()
      gl.render(backScene, camera)
    } finally {
      gl.setRenderTarget(previousTarget)
      gl.setViewport(previousViewport)
      gl.setScissor(previousScissor)
      gl.setScissorTest(previousScissorTest)
      gl.autoClear = previousAutoClear
      gl.xr.enabled = previousXrEnabled
      scene.background = previousBackground
      scene.overrideMaterial = previousOverrideMaterial
    }
  }, -1)

  if (existingMesh) return null
  return <mesh ref={meshRef} geometry={geometry} material={material} position={position} quaternion={quaternion} rotation={quaternion ? undefined : rotation} scale={scale} />
}
