import { GameEngine, TwoVector, GameWorld } from 'lance-gg'
import PkPhysicsEngine from './PkPhysicsEngine'
import Fighter from './Fighter'
import Platform from './Platform'
import Goal from './Goal'

export default class BrawlerGameEngine extends GameEngine {

	constructor(options) {
		super(options);

		// game variables
		Object.assign(this, {
			spaceWidth: 100, spaceHeight: 75,
			fighterWidth: 3, fighterHeight: 6,
			platformUnit: 1, platformHeight: 1
		})

		this.groundFriction = new TwoVector(0.9, 1)
		this.airFriction = new TwoVector(0.98, 1)
		this.climbFriction = new TwoVector(0.5, 0.5)

		this.physicsEngine = new PkPhysicsEngine({
			gravity: new TwoVector(0, -0.05),
			collisions: { type: 'force', autoResolve: false },
			gameEngine: this
		})

		this.inputsApplied = [];
		  this.on('preStep', this.moveAll.bind(this));
		  this.on('collisionStart', this.collisionStart)
		  this.on('collisionStop', this.collisionEnd)
	}

	registerClasses(serializer) {
		serializer.registerClass(Platform)
		serializer.registerClass(Fighter)
		serializer.registerClass(Goal)
	}

	processInput(inputData, playerId) {

		super.processInput(inputData, playerId);

		let player = this.world.queryObject({ playerId: playerId, instanceType: Fighter })
		if (player) {
			if (player.isStunned > inputData.step) {
				return
			}

			let isClimbing = player.grab !== -1
			let isRunning = player.ground !== -1 && !isClimbing 
			let isFalling = !isRunning && !isClimbing

			// directional movement
			let direction = 0
			if (inputData.input === 'right')
				direction = 1
			else if (inputData.input === 'left')
				direction = -1

			if (inputData) {
				if (isRunning) {
					player.angle = 0
					player.velocity.x += player.runAcc * direction
				} 
				else if (isFalling) {
					if (direction === 1) {
						if (player.velocity.x > 0.2) {
							player.velocity.x += 0.02
						} else if (player.velocity.x < 0) {
							player.velocity.x += 0.01
						} else 
							player.velocity.x += 0.15
						
					} else if (direction === -1) {
						if (player.velocity.x < -0.2) {
							player.velocity.x -= 0.02
						} else if (player.velocity.x > 0) {
							player.velocity.x -= 0.01
						} else {
							player.velocity.x -= 0.15
						}
					}
					// lean into landing
					player.angle = 5 * direction
				} 
				else if (isClimbing) {
					let ledge = this.world.queryObject({id: player.grab})
					let yDiff = ledge.y + ledge.height - player.y
					// wall jump?
					if (direction === -1 && player.x < ledge.x) {
						player.velocity.x = (-player.runAcc) * 2
						player.velocity.y += player.velocity.y > 0.1 ? player.jumpForce : 0.1
					} else if (direction === 1 && player.x + player.width > ledge.x + ledge.width) {
						player.velocity.x = player.runAcc * 2
						player.velocity.y += player.velocity.y > 0.1 ? player.jumpForce : 0.1
					}
					// almost up, crane
					if (yDiff > 0 && yDiff < 3) {
						console.log('player.height', player.height)
						if (direction === -1 && player.x + player.width > ledge.x + ledge.width) {
							player.velocity.y = player.jumpForce/2
						} else if (direction === 1 && player.x < ledge.x) {
							player.velocity.y = player.jumpForce/2
						}
					}
				}
			}

			if (inputData.input === 'ctrl') {
				if (isRunning) {
					player.velocity.y = player.jumpForce
				} 
			}

			if (inputData.input === 'up') {
				if (isClimbing) 
					player.velocity.y = player.jumpForce/2
			}
			if (inputData.input === 'down') {
				this.getAllActiveRooms()
				// running
				if (player.ground !== -1) {
				} 
				// jumping/falling
				else if (player.grab === -1) {
				}
				// grabbing/climbing
				else {
					player.velocity.y = -player.jumpForce/2
				}
			}

			// player.refreshToPhysics();
			// this.inputsApplied.push(playerId);
		}
	}

	clampVelocity(velocity, max) {
		let v = new TwoVector()
		if (velocity.x > 0)
			v.x = velocity.x > max ? max : velocity.x
		else if (velocity.x < 0)
			v.x = velocity.x < -max ? -max : velocity.x
		else
			v.x = 0
		if (velocity.y > 0)
			v.x = velocity.y > max ? max : velocity.y
		else if (velocity.y < 0)
			v.y = velocity.y < -max ? -max : velocity.y
		else
			v.y = 0
		return v
	}

	// logic for every game step
	moveAll(stepInfo) {
		if (stepInfo.isReenact)
			return
	}

	// create fighter
	addFighter(playerId) {
		let f = new Fighter(this, null, { playerId, position: this.randomPosition() });
		f.height = this.fighterHeight;
		f.width = this.fighterWidth;
		f.direction = 1;
		f.progress = 0;
		f.action = 0;
		f.kills = 0;
		f.friction = f.groundFriction // new TwoVector(0.9, 1)
		this.addObjectToWorld(f)
		let activeRooms = this.getAllActiveRooms()
		console.log('activeRooms', activeRooms)
		return f
	}

	// create a platform
	addPlatform(desc) {
		let p = new Platform(this, null, { playerId: 0, position: new TwoVector(desc.x, desc.y) })
		p.width = desc.width
		p.height = desc.height || this.platformHeight
		p.isStatic = 1
		this.addObjectToWorld(p)
		return p
	}

	addGoal(desc) {
		let g = new Goal(this, null, { playerId: 0, position: new TwoVector(desc.x, desc.y) })
		g.width = desc.width
		g.height = desc.height
		g.isStatic = 1
		this.addObjectToWorld(g)
		return g
	}

	// random position for new object
	randomPosition() {
		return new TwoVector(this.spaceWidth / 4 + Math.random() * this.spaceWidth/2, 70);
	}
	
	collisionStart(c) {
		// fighter collide with platform?
		let player, platform
		if (c.o1 instanceof Fighter && c.o2 instanceof Platform) {
			player = c.o1
			platform = c.o2
		} else if (c.o2 instanceof Fighter && c.o1 instanceof Platform) {
			player = c.o2
			platform = c.o1
		}

/* 		if (c.o1 instanceof Goal || c.o2 instanceof Goal) {
			let goal = c.o1 instanceof Goal ? c.o1 : c.o2
			goal.reachGoal = 1
		} */

		if (player && platform) {
			this.collide(player, platform)
		}
	}

	collisionEnd(c) {
		console.log('collisionEnd')
		// fighter collide with platform?
		let player, platform
		if (c.o1 instanceof Fighter && c.o2 instanceof Platform) {
			player = c.o1
			platform = c.o2
		} else if (c.o2 instanceof Fighter && c.o1 instanceof Platform) {
			player = c.o2
			platform = c.o1
		}

/* 		if (c.o1 instanceof Goal || c.o2 instanceof Goal) {
			let goal = c.o1 instanceof Goal ? c.o1 : c.o2
			goal.reachGoal = 0
			let player = c.o1 instanceof Fighter ? c.o1 : c.o2
			goal.player = player.id
		} */
		
		if (player && platform) {
			// leaving ground
			if (player.ground === platform.id) {
				console.log('leaving ground', player.ground)
				player.hasGravity = 1
				player.friction = player.airFriction
				player.ground = -1
			} 
			// letting go of grab/climb
			else if (player.grab === platform.id) {
				console.log('let go of ledge', player.grab)
				player.hasGravity = 1
				player.friction = player.airFriction
				player.grab = -1
			}
		}
	}

	collide(player, platform) {
		if (player.ground === platform.id) {
			//console.log('player.v.y', player.velocity.y)
			player.friction = player.groundFriction
		}
	}

	getAllObjectsInRoom(roomName) {
		const roomObjects = {}
		this.world.forEachObject( (id, obj) => {
			if (obj._roomName === roomName)
				roomObjects[id] = obj
		})
		return roomObjects
	}

	getAllActiveRooms() {
		const players = this.world.queryObjects({instanceType: Fighter })
		if (!players)
			return []
		let rooms = new Set()
		for (let p of players) {
			rooms.add(p._roomName)
		}
		return rooms
	}
}
