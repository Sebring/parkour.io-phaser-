import Room from '../Room'
export default class BalconyRoom extends Room {
	constructor(gameEngine, roomName) {
		super(gameEngine, roomName, 'Balconys')
	}
	
	build() {
		super.build()
		
		let u = (d) => d * this.game.platformUnit
		// add balconys
		this._pf(20, 10, 5, 4)
		this._pf(10, 20, 5, 4)
		this._pf(20, 30, 5, 4)
		this._pf(10, 40, 5, 4)

		// add goal

		this.addObject(this.game.addGoal({ x:u(5), y:u(50), width: u(1), height: u(1) }))
	}
}