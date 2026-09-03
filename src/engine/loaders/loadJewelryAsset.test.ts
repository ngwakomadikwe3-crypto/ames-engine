import { describe, expect, it } from 'vitest'
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three'
import { readJewelryScene } from './readJewelryScene'

describe('readJewelryScene', () => {
  it('describes meshes, materials, transforms, and totals without replacing the scene', () => {
    const scene = new Group()
    scene.name = 'JewelryRoot'

    const metal = new MeshStandardMaterial({ name: '18K Gold' })
    const diamond = new MeshStandardMaterial({ name: 'Diamond' })

    const band = new Mesh(new BoxGeometry(2, 1, 1), metal)
    band.name = 'Ring'
    band.position.set(1, 2, 3)

    const stone = new Mesh(new BoxGeometry(1, 1, 1), diamond)
    stone.name = 'CenterStone'
    stone.position.set(0, 2, 0)

    scene.add(band, stone)

    const result = readJewelryScene(scene)

    expect(result.scene).toBe(scene)
    expect(result.summary.meshCount).toBe(2)
    expect(result.summary.materialCount).toBe(2)
    expect(result.summary.vertexCount).toBeGreaterThan(0)
    expect(result.summary.triangleCount).toBeGreaterThan(0)
    expect(result.meshes.map((mesh) => mesh.name)).toEqual(['Ring', 'CenterStone'])
    expect(result.materials.map((material) => material.name)).toEqual(['18K Gold', 'Diamond'])
    expect(result.meshes[0].worldPosition).toEqual([1, 2, 3])
  })
})
