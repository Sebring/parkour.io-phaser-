import { DynamicObject, Renderer, BaseTypes } from 'lance-gg'
import Fighter from './Fighter'

export default class Goal extends DynamicObject {

	constructor(gameEngine, options, props) {
		super(gameEngine, options, props)
		this.reachGoal = -1
	}

	static get netScheme() {
		
		return Object.assign({
			reachGoal: { type: BaseTypes.TYPES.INT8 }
		}, super.netScheme)
		
	}

	onAddToWorld(gameEngine) {
		if (Renderer)
			Renderer.getInstance().addGoal(this)
	}

	collidesWith(other) {
		if (other instanceof Fighter) {
			console.log('GOAL!')
			this.reachGoal = other.id
		}
	}

	syncTo(other) {
		super.syncTo(other)
		this.reachGoal = other.reachGoal
	}

	toString() {
		return `Goal::${super.toString()} Width=${this.width} Height=${this.height}`
	}
}
