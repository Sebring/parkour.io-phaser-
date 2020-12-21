import Phaser from 'phaser'

import ScoreLabel from '../ui/ScoreLabel'
import BombSpawner from './BombSpawner'
import StarSpawner from './StarSpawner'
import PlayerEntity from '../entities/PlayerEntity'

const K_GROUND = 'ground'
const K_PLAYER = 'player'
const K_STAR = 'star'
const K_BOMB = 'bomb'
const K_MAP = 'level1'

export default class GameScene extends Phaser.Scene {
	constructor() {
		super('game-scene')
		this.gameOver = false

		this.player = null
		this.stars = null
		this.cursors = null
		this.scoreLabel = null
		this.bombSpawner = null
		this.starsPawner = null
	}

	preload() {

		// tilemaps
		this.load.image('tiles', 'assets/tiles.png')
		this.load.tilemapTiledJSON('map', 'assets/level1.json')

		this.load.image('sky', 'assets/sky.png')
		this.load.image(K_GROUND, 'assets/platform.png')
		this.load.image(K_STAR, 'assets/star.png')
		this.load.image(K_BOMB, 'assets/bomb.png')

		this.load.spritesheet(K_PLAYER, 'assets/running.png', { frameWidth:64, frameHeight: 80 })
	}

	create() {
		this.physics.world.gravity.y = 870

		this.add.image(400, 300, 'sky')
		const map = this.make.tilemap({key: 'map'})
		const tileset = map.addTilesetImage('tiles', 'tiles')
		const world = map.createLayer('world', tileset)
		map.setLayer(world)

		map.setCollisionByProperty({solid: true}, true)

		const spawnPoint = map.findObject('objects', obj => obj.type === 'playerSpawn')
		
		this.player = new PlayerEntity(this, K_PLAYER)
		
		this.player.spawn(spawnPoint.x, spawnPoint.y)
		this.player.sprite.on('stick', this.onStick, this)
		// const player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, K_PLAYER, 0)

		this.physics.add.collider(this.player.sprite, world)
	}

	onStick() {
		console.log('EVENT STICK')
	}

	update() {
		if (this.gameOver) this.endGame()
		this.player.update()
	}

	endGame() {
		this.scene.start('menu-scene')
	}

	collectStar(player, star) {
		star.disableBody(true, true)
		this.scoreLabel.add(10)

		if (this.stars.countActive(true) === 0) {
			this.stars.children.iterate(child => {
				child.enableBody(true, child.x, true, true)
			})
		}

		this.bombSpawner.spawn(player.x)
	}

	createPlatforms() {
		const platforms = this.physics.add.staticGroup()

		platforms.create(400, 568, K_GROUND)
			.setScale(2).refreshBody()

		platforms.create(600, 400, K_GROUND)
		platforms.create(50, 250, K_GROUND)
		platforms.create(750, 220, K_GROUND)

		return platforms
	}

	createScoreLabel(x, y, score) {
		const style = { fontSize: '32px', fill: '#000' }
		const label = new ScoreLabel(this, x, y, score, style)
		this.add.existing(label)
		return label
	}

	createStars(count) {
		/*
		const stars = this.physics.add.group({
			key: K_STAR,
			repeat: 11,
			setXY: { x: 12, y: 0, stepX: 70 }
		})

		stars.children.iterate(child => {
			child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8))
		})
		*/
		return this.starsPawner.spawn(count)
	}

	createPlayer() {
		const P = new PlayerEntity(this, K_PLAYER)
		P.spawn(100, 400)
		return P
	}
}
