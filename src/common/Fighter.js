import { BaseTypes, DynamicObject, Renderer, TwoVector } from 'lance-gg'
import Platform from './Platform'

const ACTIONS = { IDLE: 0, JUMP: 1, GRAB: 2, RUN: 3, DIE: 4 }
export default class Fighter extends DynamicObject {

	constructor(gameEngine, options, props) {
		super(gameEngine, options, props)
		this.jumpForce = 0.8
		this.runSpeed = 2.5
		this.runAcc = 0.15
		this.angle = 0
		this.hasGravity = 1
		this.groundFriction = new TwoVector(0.8, 1)
		this.airFriction = new TwoVector(0.98, 1)
		this.climbFriction = new TwoVector(0.5, 0.5)
		this.ground = -1
		this.grab = -1
		this.friction = this.groundFriction
		this.isStunned = 0
	}
	// direction is 1 or -1
	// action is one of: idle, jump, fight, run, die
	// progress is used for the animation
	static get netScheme() {
		return Object.assign({
			direction: { type: BaseTypes.TYPES.INT8 },
			action: { type: BaseTypes.TYPES.INT8 },
			hasGravity: { type: BaseTypes.TYPES.INT8 },
			ground: { type: BaseTypes.TYPES.INT8 },
			grab: { type: BaseTypes.TYPES.INT8 },
			isStunned: { type: BaseTypes.TYPES.INT8 }
		}, super.netScheme)
	}

	static get ACTIONS() {
		return ACTIONS
	}

	static getActionName(a) {
		for (let k in ACTIONS) {
			if (ACTIONS[k] === a)
				return k
		}
		return null
	}

	onAddToWorld(gameEngine) {
		if (Renderer)
			Renderer.getInstance().addFighter(this)
	}

	onRemoveFromWorld(gameEngine) {
		if (Renderer)
			Renderer.getInstance().removeFighter(this)
	}

	/* 
		return 1 to ignore collision
		return 4 to skip resolve collision
		return 16 to resolve collision
	*/
	collidesWith(other) {
		// // console.log('other', this,  other)
		if (other instanceof Platform) {
			// console.log('collide', other.id)
			if (this.ground === other.id) {
				// console.log('my ground', other.id)
				return 4
			}
			if (this.grab === other.id) {
				// console.log('my wall', other.id)
				return 4
			}
			// moving up?
			// console.log('this.velocity', this.velocity)
			this.collide(this, other)
			if (this.ground === other.id || this.grab === other.id) {
				// console.log('found ground', other.id)
				return 4
			}
			// console.log('bang')
			return 16
		}
		else  {
			// console.log('nah')
			return 1
		}
	}

	
/* 	get bending() {
		return { velocity: { percent: 0.0 }, position: { percent: 0.0 }} 
	} */

	toString() {
		const fighterType = this.isDino?'Dino':'Fighter';
		return `${fighterType}::${super.toString()} direction=${this.direction} action=${this.action} progress=${this.progress}`;
	}

	syncTo(other) {
		super.syncTo(other);
		this.angle = other.angle
		this.direction = other.direction
		this.action = other.action
		this.ground = other.ground
		this.grab = other.grab
		this.friction = other.friction
		this.hasGravity = other.hasGravity
		this.isStunned = other.isStunned
	}

	collide(player, platform) {
		// console.log('c', platform.id)
		/* if (this.ground !== -1)
			// console.log('has ground', this.ground.id)
		else
			// console.log('no ground') */
		let dir = player.velocity.x > 0 ? 1 : -1
		// new ground
		if (player.ground === -1) {

			// land on ground?
			if ((player.y+2) > (platform.y + platform.height)) {
				console.log('landed', platform.id)
				player.ground = platform.id
				
				// lean into stick?
				if (dir === 1 && player.angle < 0) {
					// on edge?
					if (player.x < platform.x) {
					// console.log('!!stick', this.gameEngine.world.stepCount)
					player.isStunned = this.gameEngine.world.stepCount + 10
					player.velocity.x = 0
					}
				} else if (dir === -1 && player.angle > 0) {
					// on edge?
					if (player.x + player.width > platform.x + platform.width) {
						// console.log('stick!!')
						player.isStunned = this.gameEngine.world.setCount + 10
						player.velocity.x = 0
					}
				}

				player.velocity.y = 0
				player.position.y = platform.y + platform.height - 1
				player.hasGravity = 0
				player.angle = 0
				player.action = Fighter.ACTIONS.IDLE
				player.friction = player.groundFriction
				player.refreshToPhysics()
				return
			}

			// grab edge?
			if (player.y + player.height > platform.y + platform.height) {
				let diff = dir === 1 ? platform.x - player.x : (player.x + player.width) - (platform.x + platform.width)
				// console.log('diff', diff)
				if (isNaN(diff)) // happened few times..
					console.log(`diff: ${diff}, platform.x: ${platform.x}, player.width: ${player.width}, platform.width: ${platform.width}`)
				if (diff > 0 && diff < player.width) {
					// console.log('grab!', platform.id)
					player.velocity.y = 0
					player.velocity.x = 0
					// console.log('player x, w', player.x, player.width)
					// console.log('platform x, w', platform.x, platform.x + platform.width)
					let posX = dir === 1 ? platform.x - player.width + 1 : platform.x + platform.width - 1
					// console.log('posx', posX)
					player.position.x = posX
					player.hasGravity = 0
					player.angle = 0
					player.grab = platform.id
					player.friction = player.climbFriction // new TwoVector(this.runFriction, this.climbFriction)
					player.action = Fighter.ACTIONS.GRAB
					player.refreshToPhysics()
					return
				}
			}
		}
	}
}
