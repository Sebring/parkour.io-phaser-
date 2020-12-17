import Phaser from 'phaser'

export default class PlayerEntity {
	constructor(scene, key = 'PLAYER') {
		this.scene = scene
		this.key = key
		this.sprite = null
		this.jumpForce = -350

		this.state = { 
			isJumping: false,
			isFacingLeft: false
		}

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
	}

	update() {
		if (!this.sprite) return

		const keys = this.keys
		const player = this.sprite
		const onGround = player.body.blocked.down
		const acc = onGround ? 600 : 200

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

		if (onGround && (keys.UP.isDown || keys.W.isDown)) {
			player.setVelocityY(this.jumpForce)
			this.sprite.play('jump-up')
			this.state.isJumping = true
		}

	}

	spawn(x, y) {
		this.sprite = this.scene.physics.add.sprite(x, y, this.key, 0)
		this.sprite
			.setBounce(0.1)
			.setDrag(1000, 0)
			.setMaxVelocity(300, 400)
			.setCollideWorldBounds(true)
		this.sprite.play('run')
		return this.sprite
	}
}
