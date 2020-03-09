import { ServerEngine } from 'lance-gg'
import Fighter from '../common/Fighter'
import Goal from '../common/Goal'
import BalconyRoom from '../common/levels/BalconyRoom'

let game = null

export default class BrawlerServerEngine extends ServerEngine {

	constructor(io, gameEngine, inputOptions) {
		super(io, gameEngine, inputOptions)
		game = gameEngine
		game.on('postStep', this.postStep.bind(this))
		this.activeRooms = {}
	}

	start() {
		super.start();

		let u = function(d) { return d * game.platformUnit}
		let pf = function(x, y, w, h) {
			return game.addPlatform({ x: u(x), y: u(y), width: u(w), height:u(h) })
		}
		let room = this.addRoom('/lobby')
		// room.build()
		// let g = this.gameEngine.addGoal({ x:u(60), y:u(13), width: u(1), height: u(1) })
		// room.addObject(g)

		// room.create()
		/* // add floor
		game.addPlatform({ x: 0, y: 0, width: game.platformUnit * 160, height: game.platformUnit * 3 });

		// add balconys
		game.addPlatform({ x: u(20), y: u(10), width: u(5), height: u(4) })
		game.addPlatform({ x: u(10), y: u(20), width: u(5), height: u(4) })
		game.addPlatform({ x: u(20), y: u(30), width: u(5), height: u(4) })
		game.addPlatform({ x: u(10), y: u(40), width: u(5), height: u(4) })


		// add standing stick trainers - good distance is 17(*2)
		pf(30, 40, 1, 2)
		pf(47, 40, 1, 2)
		pf(55, 40, 1, 2)

		// add running stick trainers - good distance is 20(*2)
		pf(30, 8, 10, 2)
		pf(55, 8, 10, 2)

		// add wall run 
		pf(70, 8, 2, 20)

		// add goal
		game.addGoal({ x:u(60), y:u(13), width: u(1), height: u(1) })

	

		let lvl_1 = '/level_1'
		this.createRoom(lvl_1)
		this.assignObjectToRoom(pf(72, 0, 2, 20), lvl_1)
		this.assignObjectToRoom(pf(5, 10, 160, 3), lvl_1) */
	}

	addRoom(name, label) {
		if (this.activeRooms[name]) {
			console.log(`Room '${name}' already exists`)
			return false
		}
		if (name !== '/lobby')
			this.createRoom(name)
		let room = new BalconyRoom(this.gameEngine, name, label)
		room.build()
		this.activeRooms[name] = room
		return room
	}

	// check if fighter f1 killed f2
	checkKills(f1, f2) {

		// if f2 is already dying, exit
		if (f1 === f2 || f2.action === Fighter.ACTIONS.DIE)
			return;

		// kill distance is different for fighters and dino's
		let killDistance = null;
		if (f1.action === Fighter.ACTIONS.FIGHT)
			killDistance = game.killDistance;
		else if (f1.isDino && !f2.isDino)
			killDistance = game.dinoKillDistance

		if (killDistance === null) return;

		let dx = Math.abs(f1.position.x - f2.position.x);
		let dy = Math.abs(f1.position.y - f2.position.y);
		if (dx <= killDistance && dy <= killDistance) {
			f1.kills++;
			f2.action = Fighter.ACTIONS.DIE;
			f2.progress = 99;
		}
	}

	// handle fighter state change
	updateFighterAction(f1) {

		// if no input applied and we were running, switch to idle
		let inputApplied = game.inputsApplied.indexOf(f1.playerId) >= 0;
		if (!inputApplied && f1.action === Fighter.ACTIONS.RUN)
			f1.action = Fighter.ACTIONS.IDLE;

		// end-of-action handling
		if (f1.progress === 0) {
			f1.progress = 99;

			// end of dying sequence
			if (f1.action === Fighter.ACTIONS.DIE) {
				game.removeObjectFromWorld(f1);
				return;
			}

			// if no input applied on this turn, switch to idle
			if (!inputApplied && f1.action === Fighter.ACTIONS.FIGHT)
				f1.action = Fighter.ACTIONS.IDLE;
		}
	}

	// post-step state transitions
	postStep() {

		// check if goal is reached
		let goal = game.world.queryObject({ instanceType: Goal })
		let pId = goal && goal.reachGoal ? goal.reachGoal : null


		let fighters = game.world.queryObjects({ instanceType: Fighter })
		for (let f1 of fighters) {

			/* // updates to action
			if (f1.isDino)
				this.updateDinoAction(f1);
			else
				this.updateFighterAction(f1); */

			// check world bounds
			f1.position.x = Math.max(f1.position.x, 0);
				f1.position.x = Math.min(f1.position.x, game.spaceWidth - game.fighterWidth);

			/* // check for kills
			for (let f2 of fighters) this.checkKills(f1, f2); */

			if (pId === f1.id) {
				console.log('next room')
				this.assignPlayerToRoom(f1.playerId, '/level_1')
				this.assignObjectToRoom(f1, '/level_1')
				f1.position.x = 10
				f1.grab = -1
				f1.ground = -1
				goal.reachGoal = -1
			}

		}



		// reset input list
		// game.inputsApplied = [];
	}

	movePlayerToRoom(player, roomName) {
	}

	onPlayerConnected(socket) {
		super.onPlayerConnected(socket);
		game.addFighter(socket.playerId);
	}

	onPlayerDisconnected(socketId, playerId) {
		super.onPlayerDisconnected(socketId, playerId);
		for (let o of game.world.queryObjects({ playerId }))
			game.removeObjectFromWorld(o.id);
	}
}
