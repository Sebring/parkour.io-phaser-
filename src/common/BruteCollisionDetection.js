export default class BruteCollisionDetection {

	constructor(options) {
		this.options = Object.assign({
			autoResolve: false
		}, options)
		this.collisionPairs = {}
	}

	init(options) {
		this.gameEngine = options.gameEngine
	}

	// detect by checking all pairs
	detect(keys, room) {
		if (!this.collisionPairs[room]) {
			// console.log('creating pair for room', room)
			this.collisionPairs[room] = {}
		}
		//let objects = this.gameEngine.world.objects
		//let keys = Object.keys(objects)
		// // console.log(keys)
	// delete non existant object pairs
		for (let pairId in this.collisionPairs[room]) {
			if (this.collisionPairs[room].hasOwnProperty(pairId)) {
				if (keys.indexOf(pairId.split(',')[0]) === -1 || keys.indexOf(pairId.split(',')[1]) === -1) {
					// console.log('delete collisionpair, ', this.collisionPairs[room], pairId)
					delete this.collisionPairs[room][pairId]
				}
			}
		}
		// check all pairs
		for (let k1 of keys)
			for (let k2 of keys)
				if (k2 > k1) this.checkPair(k1, k2, room)
	}

	// check if pair (id1, id2) have collided
	checkPair(id1, id2, room) {
		let objects = this.gameEngine.world.objects
		let o1 = objects[id1]
		let o2 = objects[id2]

		// static objects don't collide
		if (o1.isStatic && o2.isStatic)
			return

		// make sure that objects actually exist. might have been destroyed
		if (!o1 || !o2) 
			return
		
		let pairId = [id1, id2].join(',')

		if (this.findCollision(o1, o2)) {
			// console.log('cPair', this.collisionPairs, this.collisionPairs[room])
			if (!(pairId in this.collisionPairs[room])) {
				// console.log('new collision', pairId)
				this.collisionPairs[room][pairId] = true
				// console.log(' - cPair', this.collisionPairs, this.collisionPairs[room])
				this.gameEngine.emit('collisionStart', { o1, o2 })
			}
		} else if (pairId in this.collisionPairs[room]) {
			// console.log('Stop collision', pairId)
			this.gameEngine.emit('collisionStop', { o1, o2 })
			delete this.collisionPairs[room][pairId]
		} else {
			// console.log('say what now?', pairId, this.collisionPairs)
		}
	}

	findCollision(o1, o2) {
		// console.log('findCollision', o1, o2)
		const o1Box = getBox(o1)
		const o2Box = getBox(o2)
		if (o1.x < o2.x + o2.width && o1.x + o1.width > o2.x 
			&& o1.y < o2.y + o2.height && o1.y + o1.height > o2.y) {
			// collision
		} else {
			return false
		}

		let resolveCollision = undefined
		// check for collision handlers
		if (typeof o1.collidesWith === 'function') {
			resolveCollision = o1.collidesWith(o2)
		}
		if (typeof o2.collidesWith === 'function') {
			resolveCollision += o2.collidesWith(o1)
		}

		// acknowledge collision but don't resolve
		if (!resolveCollision) {
			// console.log('collision but null')
			return true
		}

		// ignore collision
		if (resolveCollision < 3) {
			// console.log('ignore collision')
			return false
		}

		// skip resolve
		if (resolveCollision < 9) {
			// console.log('collision but no resolve')
			return true
		}

		// done if no resolve of collisions
		/* disable global setting
		if (!this.options.autoResolve)
		return true
		*/

		// need to auto-resolve
		let shiftY1 = o2Box.yMax - o1Box.yMin
		let shiftY2 = o1Box.yMax - o2Box.yMin
		let shiftX1 = o2Box.xMax - o1Box.xMin
		let shiftX2 = o1Box.xMax - o2Box.xMin
		let smallestYShift = Math.min(Math.abs(shiftY1), Math.abs(shiftY2))
		let smallestXShift = Math.min(Math.abs(shiftX1), Math.abs(shiftX2))

		// choose to apply the smallest shift which solves the collision
		if (smallestYShift < smallestXShift) {
			if (o1Box.yMin > o2Box.yMin && o1Box.yMin < o2Box.yMax) {
				if (o2.isStatic)
					o1.position.y += shiftY1
				else if (o1.isStatic) 
					o2.position.y -= shiftY1
				else {
					o1.position.y += shiftY1 / 2
					o2.position.y -= shiftY1 / 2
				}
			} else if (o1Box.yMax > o2Box.yMin && o1Box.yMax < o2Box.yMax) {
				if (o2.isStatic) 
					o1.position.y -= shiftY2
				else if (o1.isStatic) 
					o2.position.y += shiftY2
				else {
					o1.position.y -= shiftY2 / 2
					o2.position.y += shiftY2 / 2
				}
			}
			o1.velocity.y = 0
			o2.velocity.y = 0
		} else {
			if (o1Box.xMin > o2Box.xMin && o1Box.xMin < o2Box.xMax) {
				if (o2.isStatic)
					o1.position.x += shiftX1
				else if (o1.isStatic)
					o2.position.x -= shiftX1
				else {
					o1.position.x += shiftX1 / 2
					o2.position.x -= shiftX1 / 2
				}
			} else if (o1Box.xMax > o2Box.xMin && o1Box.xMax < o2Box.xMax) {
				if (o2.isStatic)
					o1.position.x -= shiftX2
				else if (o1.isStatic)
					o2.position.x += shiftX2
				else {
					o1.position.x -= shiftX2 / 2
					o2.position.x += shiftX2 / 2
				}
			}
			o1.velocity.x = 0
			o2.velocity.x = 0
		}

		return true
	}
}

// get bounding box of object o
function getBox(o) {
	return {
		xMin: o.position.x,
		xMax: o.position.x + o.width,
		yMin: o.position.y,
		yMax: o.position.y + o.height
	}
}
