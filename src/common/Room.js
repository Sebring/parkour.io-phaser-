export default class Room {
	constructor(gameEngine, roomName, label) {
		this.game = gameEngine
		this.name = roomName
		this.label = label || 'Room'
		this.collisionPairs = {}
		this.isEmpty = true
	}

	removeObject(object) {
		if (!object._roomName === this.name)
			return false

		object._roomName = ''
		const id = object.id

		// remove from any collision pair
		for (let pairId in this.collisionPairs[room]) {
			if (this.collisionPairs[room].hasOwnProperty(pairId)) {
				if (keys.indexOf(pairId.split(',')[0]) === id || keys.indexOf(pairId.split(',')[1]) === id) {
					console.log('delete collisionpair, ', this.collisionPairs[room], pairId)
					delete this.collisionPairs[room][pairId]
				}
			}
		}
	
	}

	addObject(object) {
		console.log('addObject', object.id)
		object._roomName = this.name
		return object
	}

	removePlayer(player) {
		let removed = this.removeObject(player)
		if (!removed)
			return false
		
		// last player?
		let playersInRoom = this.game.world.queryObjects({instanceType: Fighter }).filter(p => p._roomName === this.name)
		console.log('remaining players in room', playersInRoom.length)
		this.isEmpty = playersInRoom.length === 0
		return true
	}

	addPlayer(player) {
		this.addObject(player)
		this.isEmpty = false
	}

	build() {
		console.log('build room', this.name)
		// add floor
		/* let pu = this.game.platformUnit
		let o = this.game.addPlatform({ x: 0, y: 0, width: pu * 160, height: pu * 3 });
		this.addObject(o) */
		this._pf(0, 0, 160, 3)
	}

	delete() {
	
	}

	_pf(x, y, w, h) {
		let u = (d) => d * this.game.platformUnit
		return this.addObject(this.game.addPlatform({ x: u(x), y: u(y), width: u(w), height:u(h) }))
	}
}