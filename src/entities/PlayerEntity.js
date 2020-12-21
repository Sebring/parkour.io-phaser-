import Phaser from 'phaser'
import * as StateMachine from 'javascript-state-machine'
import { getDistance ,LEFT, RIGHT } from '../util/Util'

export default class PlayerEntity extends Phaser.Physics.Arcade.Sprite {
	constructor(scene, x, y, key) {
		super(scene, x, y, key, 0)
		scene.add.existing(this)
		scene.physics.add.existing(this)

		this.key = key
		this.jumpForce = -350
		this.groundDrag = 500
		this.airDrag = 200
		this.airAcc = 200
		this.jumpStop = 0
		this.jumpDirection = 0
		this.jumpOrigin = null
		
		this.init()
		this.createAnims(scene)

		const { LEFT, RIGHT, UP, W, A, D } = Phaser.Input.Keyboard.KeyCodes
		this.keys = scene.input.keyboard.addKeys({ LEFT, RIGHT, UP, W, A, D })

		var FSM = StateMachine.factory({
			init: 'idle',
			transitions: [
				{ name: 'jump', from: 'idle', to: 'jumping' },
				{ name: 'jump', from: 'running', to: 'jumping'},
				{ name: 'stop', from: 'running', to: 'idle' },
				{ name: 'land', from: 'jumping', to: 'landing' },
				{ name: 'stop', from: 'landing', to: 'idle' },
				{ name: 'move', from: 'idle', to: 'running' }
			],
			methods: {
				onBeforeJump: e => this.onBeforeJump(e),
				onJumping: e => this.onJumping(e),
				onLanding: e => this.onLanding(e),
				onMove: e => this.onMove(e),
				onTransition: e => console.log({ fcm: e })
			}
		})
		this.state = new FSM()
	}

	init() {
		this.setCollideWorldBounds(true)
			.setBounce(0.1)
			.setDrag(this.groundDrag, 0)
			.setMaxVelocity(300, 400)
	}

	createAnims(scene) {
		scene.anims.create({
			key: 'run',
			frames: scene.anims.generateFrameNumbers(this.key, { start: 0, end: 5}),
			frameRate: 12, 
			repeat: -1
		})

		scene.anims.create({
			key: 'jump-up',
			frames: scene.anims.generateFrameNumbers(this.key, { start: 6, end: 6}),
			framerate: 1,
			repeat: -1
		})
	}

	onBeforeJump(fcm) {
		console.log('onJump', { fcm })
		
		let canJump = true
		// check if possible
		canJump  = this.body.blocked.down
		return canJump
	}

	onJumping(fcm) {
		console.log('onJumping', { fcm })

		this.jumpStop = 0
		this.jumpDirection = Phaser.Math.Clamp(this.body.velocity.x, -1, 1)
		this.jumpOrigin = { x: this.x, y: this.y }
		console.log(this.jumpOrigin)

		// physics
		this.setVelocityY(this.jumpForce)
		this.setDrag(this.airDrag, 0)

		// graphics
		this.play('jump-up')

		// sounds
	}

	updateJumping() {

		const keys = this.keys
		const acc = this.airAcc

		if (keys.LEFT.isDown || keys.A.isDown) {
			this.setAccelerationX(-acc)
			this.jumpStop--
		} else if (keys.RIGHT.isDown || keys.D.isDown) {
			this.setAccelerationX(acc)
			this.jumpStop++
		} else {
			
		}

		// can't change direction mid-air
		if (this.jumpDirection === RIGHT) {
			this.setVelocityX(Phaser.Math.Clamp(this.body.velocity.x, 0, this.body.velocity.x))
		}
		if (this.jumpDirection === LEFT) {
			this.setVelocityX(Phaser.Math.Clamp(this.body.velocity.x, this.body.velocity.x, 0))
		}

		if (this.body.blocked.down) {
			this.state.land()
		}
	}

	onLanding(fcm) {
		console.log('onLand', { fcm, jump: this.jumpStop })

		// Physics
		this.setAccelerationX(0)
		// decrease velocity on landing and boost drag if leaning back
		let vX = Phaser.Math.FloorTo(this.body.velocity.x)
		let dX = vX

		// jumping right and leaning back
		if (vX > 0 && this.jumpStop < 0) { 
			dX = Phaser.Math.Clamp(vX + (this.jumpStop * 2), 0, vX)
			this.body.velocity.x = dX
			this.setDrag(this.groundDrag + Math.abs(this.jumpStop) * 100, 0)
		}
		
		// jumping left and leaning back
		if (vX < 0 && this.jumpStop > 0) {
			dX = Phaser.Math.Clamp(vX + (this.jumpStop * 2), vX, 0)
			this.body.velocity.x = dX
			this.setDrag(this.groundDrag + Math.abs(this.jumpStop) * 100, 0)
		}

		// jump distance
		let jumpDistance = getDistance(this.jumpOrigin, { x: this.x, y: this.y })
		console.log(jumpDistance)
		// graphics
		//

		// sounds
	}

	updateLanding() {

		if (this.body.velocity.x === 0) {
			console.log('STICK!')
			this.emit('stick')
		}

		this.state.stop()
	}

	updateIdle() {
		const keys = this.keys

		if (keys.LEFT.isDown || keys.A.isDown) {
			this.state.move()
		} else if (keys.RIGHT.isDown || keys.D.isDown) {
			this.state.move()
		}

		if (keys.UP.isDown || keys.W.isDown) {
			this.state.jump()
		}
	}

	onMove(fcm) {
		this.setDrag(this.groundDrag, 0)
		this.play('run')
	}

	updateRunning() {
		const keys = this.keys
		const acc = 600

		if (keys.LEFT.isDown || keys.A.isDown) {
			this.setAccelerationX(-acc)
			if (!this.flipX && this.body.velocity.x < 0)
				this.toggleFlipX()
			
		} else if (keys.RIGHT.isDown || keys.D.isDown) {
			this.setAccelerationX(acc)
			if (this.flipX && this.body.velocity.x > 0)
				this.toggleFlipX()
			/*
			if (this.state.isFacingLeft) {
				this.state.isFacingLeft = false
				this.setFlipX(false)
			}
			*/
		} else {
			this.setAccelerationX(0)
			if (this.body.velocity.x === 0) {
				this.state.stop()
			}
		}

		if (keys.UP.isDown || keys.W.isDown) {
			this.setAccelerationX(0)
			this.state.jump()
		}



	}

	isMovingRight() {
		return this.body.velocity.x > 0
	}

	isMovingLeft() {
		return this.body.velocity.x < 0
	}


	update() {

		switch (this.state.state) {
			case 'jumping':
				this.updateJumping()
			break

			case 'landing':
				this.updateLanding()
			break

			case 'idle':
				this.updateIdle()
			break

			case 'running':
				this.updateRunning()
			break
		}

	}
}
