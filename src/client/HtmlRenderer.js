import { Renderer } from 'lance-gg'
import Fighter from './../common/Fighter'
import Goal from './../common/Goal'

let game = null

export default class HtmlRenderer extends Renderer {

	constructor(gameEngine, clientEngine) {
		super(gameEngine, clientEngine)
		game = gameEngine
		this.sprites = {}
		this.fighterSpriteScale = 1
		this.container = document.getElementById('pixi')
	}

	// expand viewport width or height
	setDimensions() {
		let ratio = 4/3
		let newWidth = window.innerWidth*0.9
		let newHeight = window.innerHeight*0.9
		let newScale = newWidth/newHeight

		if (newScale > ratio) {
			// too wide
			console.log('too wide', newScale)
			newWidth = newHeight * ratio
		} else {
			// too narrow
			console.log('too narrow', newScale)
			newHeight = newWidth / ratio
		}
		console.log('fixed scaled', newWidth/newHeight)
		this.viewportHeight = newHeight
		this.viewportWidth = newWidth

		this.pixelsPerSpaceUnit = newWidth / 100
		console.log('PixelsPersSpacUnit', this.pixelsPerSpaceUnit)
		console.log('wpw, wph', this.viewportWidth, this.viewportHeight)
		this.container.style.width = newWidth
		this.container.style.height = newHeight
	}

	init() {
		this.setDimensions()
		this.isReady = false

		// document ready?
		switch (document.readyState) {
			case 'complete':
				console.log('complete')
				break
			case 'interactive':
				console.log('interactive')
				this.setupStage()
				break
			case 'loading':
				console.log('loading')
				break
		}

		return new Promise((resolve, reject) => {


			// device?
			if (isTouchDevice())
				document.body.classList.add('touch')
			if (isWindows())
				document.body.classList.add('pc')
			
			this.isReady = true
			resolve()
			this.gameEngine.emit('renderer.ready')
		})
	}

	setupStage() {
		let pixiEl = document.getElementById('pixi')
		pixiEl.style.width = `${this.viewportWidth}px`
		pixiEl.style.height = `${this.viewportHeight}px`
		pixiEl.style.backgroundColor = 'white'
	}

	addFighter(fighter) {
		let fDiv = document.createElement('div')
		if (fighter.isDino) {
			console.log('add dino')
			fDiv.classList.add('dino')
		}
		else {
			console.log('addFighter', fighter)
			fDiv.classList.add('fighter')
		}
		fDiv.id = `fighter${fighter.id}`
		fDiv.style.position = 'absolute'
		fDiv.style.backgroundColor = 'black'
		fDiv.style.bottom = fighter.y * this.pixelsPerSpaceUnit
		fDiv.style.left = fighter.x * this.pixelsPerSpaceUnit
		fDiv.style.width = fighter.width * this.pixelsPerSpaceUnit
		fDiv.style.height = fighter.height * this.pixelsPerSpaceUnit
		document.getElementById('pixi').appendChild(fDiv)
	}

	removeFighter(fighter) {
		console.log('remove', fighter)
		let fDiv = document.querySelector(`#fighter${fighter.id}`)
		console.log('remove div', fDiv)
		if (fDiv) {
			fDiv.remove()
		}
	}

	addPlatform(platform) {
		console.log('addPlatform', platform)
		let pDiv = document.createElement('div')
		pDiv.style.position = 'absolute'
		pDiv.style.backgroundColor = 'green'
		pDiv.id = `platform_${platform.id}`
		pDiv.classList.add('platform')
		
		this.updatePosition(pDiv, platform)
		this.updateSize(pDiv, platform)

		document.getElementById('pixi').appendChild(pDiv)
	}

	removePlatform(platform) {
		console.log('removePlatform')
		let el = document.querySelector(`#platform_${platform.id}`)
		if (el) {
			el.remove()
		}
	}

	addGoal(goal) {
		let gDiv = document.createElement('div')
		gDiv.style.position = 'absolute'
		gDiv.style.backgroundColor = 'hotpink'
		gDiv.classList.add('goal')
		
		this.updatePosition(gDiv, goal)
		this.updateSize(gDiv, goal)

		document.getElementById('pixi').appendChild(gDiv)
	}

	updatePosition(el, obj) {
		el.style.bottom = obj.y * this.pixelsPerSpaceUnit
		el.style.left = obj.x * this.pixelsPerSpaceUnit
	}

	updateSize(el, obj) {
		el.style.width = obj.width * this.pixelsPerSpaceUnit
		el.style.height = obj.height * this.pixelsPerSpaceUnit
	}

	draw(t, dt) {
		super.draw(t, dt)

		game.world.forEachObject( (id, obj) => {
			if (obj instanceof Fighter) {
				let el = document.querySelector(`#fighter${obj.id}`)
				this.updatePosition(el, obj)
				el.style.transform = `rotate(${obj.angle}deg)`
			}
			if (obj instanceof Goal) {
				
			}
		})
	}
}

function isWindows() {
	return navigator.platform.indexOf('Win') > -1 
}

function isTouchDevice() {
	return 'ontouchstart' in window || navigator.maxTouchPoints 
}
