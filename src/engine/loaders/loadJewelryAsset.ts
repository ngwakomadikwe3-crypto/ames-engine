import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { JewelryAssetReadResult } from './types'
import { readJewelryScene } from './readJewelryScene'

export interface LoadedJewelryAsset extends JewelryAssetReadResult {
  sourceUrl: string
  animations: number
}

export async function loadJewelryAsset(
  sourceUrl: string,
): Promise<LoadedJewelryAsset> {
  const loader = new GLTFLoader()
  const gltf = await loader.loadAsync(sourceUrl)
  const result = readJewelryScene(gltf.scene)

  return {
    ...result,
    sourceUrl,
    animations: gltf.animations.length,
  }
}
