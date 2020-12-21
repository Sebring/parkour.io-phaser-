import Phaser from 'phaser'
import * as StateMachine from 'javascript-state-machine'
import { getDistance ,LEFT, RIGHT } from '../util/Util'

export default class PlayerEntity {
	constructor(scene, key = 'PLAYER') {
		this.scene = scene
		this.key = key
		this.sprite = null
		this.jumpForce = -350
		this.groundDrag = 500
		this.airDrag = 200
		this.airAcc = 200
		this.jumpStop = 0
		this.jumpDirection = 0
		this.jumpOrigin = null

		const anims = scene.anims

		anims.create({
			key: 'run',
			frames: anims.generateFrameNumbers(this.key, { start: 0, end: 5}),
			frameRate: 12, 
			repeat: -1
		})

		anims.create({
			key: 'jump-up',
			frames: anims.generateFrameNumbers(this.key, { start: 6, end: 6}),
			framerate: 1,
			repeat: -1
		})

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

	onBeforeJump(fcm) {
		console.log('onJump', { fcm })
		
		let canJump = true
		// check if possible
		canJump  = this.sprite.body.blocked.down
		return canJump
	}

	onJumping(fcm) {
		console.log('onJumping', { fcm })

		this.jumpStop = 0
		this.jumpDirection = Phaser.Math.Clamp(this.sprite.body.velocity.x, -1, 1)
		this.jumpOrigin = { x: this.sprite.x, y: this.sprite.y }
		console.log(this.jumpOrigin)

		// physics
		this.sprite.setVelocityY(this.jumpForce)
		this.sprite.setDrag(this.airDrag, 0)

		// graphics
		this.sprite.play('jump-up')

		// sounds
	}

	updateJumping() {

		const keys = this.keys
		const player  = this.sprite
		const acc = this.airAcc

		if (keys.LEFT.isDown || keys.A.isDown) {
			player.setAccelerationX(-acc)
			this.jumpStop--
		} else if (keys.RIGHT.isDown || keys.D.isDown) {
			player.setAccelerationX(acc)
			this.jumpStop++
		} else {
			
		}

		// can't change direction mid-air
		if (this.jumpDirection === RIGHT) {
			player.body.setVelocityX(Phaser.Math.Clamp(player.body.velocity.x, 0, player.body.velocity.x))
		}
		if (this.jumpDirection === LEFT) {
			player.body.setVelocityX(Phaser.Math.Clamp(player.body.velocity.x, player.body.velocity.x, 0))
		}

		if (this.sprite.body.blocked.down) {
			this.state.land()
		}
	}

	onLanding(fcm) {
		console.log('onLand', { fcm, jump: this.jumpStop })

		// Physics
		this.sprite.setAccelerationX(0)
		// decrease velocity on landing and boost drag if leaning back
		let vX = Phaser.Math.FloorTo(this.sprite.body.velocity.x)
		let dX = vX

		// jumping right and leaning back
		if (vX > 0 && this.jumpStop < 0) { 
			dX = Phaser.Math.Clamp(vX + (this.jumpStop * 2), 0, vX)
			this.sprite.body.velocity.x = dX
			this.sprite.setDrag(this.groundDrag + Math.abs(this.jumpStop) * 100, 0)
		}
		
		// jumping left and leaning back
		if (vX < 0 && this.jumpStop > 0) {
			dX = Phaser.Math.Clamp(vX + (this.jumpStop * 2), vX, 0)
			this.sprite.body.velocity.x = dX
			this.sprite.setDrag(this.groundDrag + Math.abs(this.jumpStop) * 100, 0)
		}

		// jump distance
		let jumpDistance = getDistance(this.jumpOrigin, { x: this.sprite.x, y: this.sprite.y })
		console.log(jumpDistance)
		// graphics
		//

		// sounds
	}

	updateLanding() {

		if (this.sprite.body.velocity.x === 0) {
			console.log('STICK!')
			this.sprite.emit('stick')
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
		this.sprite.setDrag(this.groundDrag, 0)
		this.sprite.play('run')
	}

	updateRunning() {
		const keys = this.keys
		const player  = this.sprite
		const acc = 600

		if (keys.LEFT.isDown || keys.A.isDown) {
			player.setAccelerationX(-acc)
			if (!player.flipX && player.body.velocity.x < 0)
				player.toggleFlipX()
			
		} else if (keys.RIGHT.isDown || keys.D.isDown) {
			player.setAccelerationX(acc)
			if (player.flipX && player.body.velocity.x > 0)
				player.toggleFlipX()
			/*
			if (this.state.isFacingLeft) {
				this.state.isFacingLeft = false
				player.setFlipX(false)
			}
			*/
		} else {
			player.setAccelerationX(0)
			if (this.sprite.body.velocity.x === 0) {
				this.state.stop()
			}
		}

		if (keys.UP.isDown || keys.W.isDown) {
			player.setAccelerationX(0)
			this.state.jump()
		}



	}

	isMovingRight() {
		return this.sprite.body.velocity.x > 0
	}

	isMovingLeft() {
		return this.sprite.body.velocity.x < 0
	}


	update() {
		if (!this.sprite) return

		const keys = this.keys
		const player = this.sprite
		const onGround = player.body.blocked.down
		const acc = onGround ? 600 : 200

		/*
		if (keys.LEFT.isDown || keys.A.isDown) {
			player.setAccelerationX(-acc)
			if (!this.state.isFacingLeft) {
				this.state.isFacingLeft = true
				player.setFlipX(true)
			}
		} else if (keys.RIGHT.isDown || keys.D.isDown) {
			player.setAccelerationX(acc)
			if (this.state.isFacingLeft) {
				this.state.isFacingLeft = false
				player.setFlipX(false)
			}
		} else {
			player.setAccelerationX(0)
		}

		if (this.state.isJumping && onGround) {
			this.sprite.play('run')
			this.state.isJumping = false
		}
*/
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

	spawn(x, y) {
		this.sprite = this.scene.physics.add.sprite(x, y, this.key, 0)
		this.sprite
			.setBounce(0.1)
			.setDrag(this.groundDrag, 0)
			.setMaxVelocity(300, 400)
			.setCollideWorldBounds(true)
		this.sprite.play('run')
		return this.sprite
	}
}
