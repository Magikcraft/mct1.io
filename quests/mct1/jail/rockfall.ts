import * as utils from 'utils'
import { Logger } from '../../../log'
import { Region } from '../../../regions'
import { Vector3 } from '../../../vector3'

const log = Logger(__filename)

const Material = Java.type('org.bukkit.Material')
const Effect = Java.type('org.bukkit.Effect')
const Sound = Java.type('org.bukkit.Sound')
const EntityType = Java.type('org.bukkit.entity.EntityType')

export default class Rockfall {
    public region: Region
    public upperY: number
    public blocks: any[]

    constructor(region) {
        this.blocks = []
        this.region = region
        this.upperY =
            this.region.vectorA.y > this.region.vectorB.y
                ? this.region.vectorA.y
                : this.region.vectorB.y
        this.saveRegion()
        this.replaceRegion()
    }

    public saveRegion() {
        // Make schematic
        const startLoc: Vector3 = new Vector3(
            Math.min(...this.region.xArray()),
            Math.min(...this.region.yArray()),
            Math.min(...this.region.zArray())
        )
        const world = utils.world(this.region.getWorld())
        let layer = 0
        for (let y = startLoc.y; y < startLoc.y + this.region.yLength(); y++) {
            layer++
            for (
                let x = startLoc.x;
                x < startLoc.x + this.region.xLength();
                x++
            ) {
                for (
                    let z = startLoc.z;
                    z < startLoc.z + this.region.zLength();
                    z++
                ) {
                    const block = world.getBlockAt(x, y, z)
                    this.blocks.push({
                        data: block.data,
                        layer,
                        location: block.location,
                        type: block.type,
                    })
                }
            }
        }
    }

    public replaceRegion() {
        const startLoc: Vector3 = new Vector3(
            Math.min(...this.region.xArray()),
            Math.min(...this.region.yArray()),
            Math.min(...this.region.zArray())
        )
        const world = utils.world(this.region.getWorld())
        for (let y = startLoc.y; y < startLoc.y + this.region.yLength(); y++) {
            for (
                let x = startLoc.x;
                x < startLoc.x + this.region.xLength();
                x++
            ) {
                for (
                    let z = startLoc.z;
                    z < startLoc.z + this.region.zLength();
                    z++
                ) {
                    world.getBlockAt(x, y, z).setType(Material.AIR)
                }
            }
        }
    }

    public doRockfall() {
        const world = utils.world(this.region.getWorld())
        let soundIndex = 0
        const sounds = [
            Sound.BLOCK_GRAVEL_FALL,
            undefined,
            // undefined, undefined,
            Sound.BLOCK_SAND_FALL,
            undefined,
            // undefined, undefined,
            Sound.ENTITY_DRAGON_FIREBALL_EXPLODE,
            undefined,
            // undefined, undefined,
        ]
        let interval = 0
        this.blocks.forEach(block => {
            interval = Math.floor(Math.random() * 100) * 5 + block.layer * 500
            const sound = sounds[soundIndex]
            soundIndex++
            if (soundIndex === sounds.length) {
                soundIndex = 0
            }
            setTimeout(() => {
                const loc = block.location
                const dropLoc = loc
                dropLoc.setY(this.upperY - 1)
                dropLoc.setX(loc.x + 0.5)
                dropLoc.setZ(loc.z + 0.5)

                world.spawnFallingBlock(dropLoc, block.type, block.data)
                loc.world.playEffect(loc, Effect.WITHER_BREAK_BLOCK, 100)
                if (sound) {
                    loc.world.playSound(loc, sound, 5, 1)
                }
                // BLOCK_STONE_FALL
                // world.createExplosion(loc.x, loc.y, loc.z, 1, false, false);
            }, interval)
        })

        // After rockfall is complete...
        setTimeout(() => {
            world.entities.forEach(entity => {
                if (entity.type == EntityType.DROPPED_ITEM) {
                    entity.remove()
                }
            })
            log('rockfall complete!')
        }, interval + 1000)
    }
}
