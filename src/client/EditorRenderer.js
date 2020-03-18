import { Renderer } from 'lance-gg'
import Fighter from './../common/Fighter'
import Goal from './../common/Goal'
import Platform from '../common/Platform'

let game = null

export default class EditorRenderer extends Renderer {

	constructor(gameEngine, clientEngine) {
		super(gameEngine, clientEngine)
		game = gameEngine
		this.sprites = {}
		this.fighterSpriteScale = 1
		this.container = document.getElementById('pixi')
		this.editor = document.getElementById('editor')
		this.selectedGrid = []
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

		this.pixelsPerSpaceUnit = newWidth / this.gameEngine.spaceWidth
		console.log('PixelsPersSpacUnit', this.pixelsPerSpaceUnit)
		console.log('wpw, wph', this.viewportWidth, this.viewportHeight)
		/* 
		this.container.style.width = newWidth
		this.container.style.height = newHeight
		
		this.editor.style.width = newWidth
		this.editor.style.height = newHeight */
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
				this.setupEditor()
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
		console.log(' - setup stage')
		let pixiEl = document.getElementById('pixi')
		pixiEl.style.width = `${this.viewportWidth}px`
		pixiEl.style.height = `${this.viewportHeight}px`
		pixiEl.style.backgroundColor = 'white'
	}

	setupEditor() {
		let editorEl = document.getElementById('editor')
		editorEl.style.width = `${this.viewportWidth}px`
		editorEl.style.height = `${this.viewportHeight}px`
		
		// create grid
		let w = this.gameEngine.spaceWidth, h = this.gameEngine.spaceHeight
		editorEl.style.width = w * this.pixelsPerSpaceUnit
		for (let y=0; y<h; y++) {
			for (let x=0; x<w; x++) {
				let g = document.createElement('div')
				g.id = `g_${y}_${x}`
				g.className = 'g'
				g.style.height = this.pixelsPerSpaceUnit
				g.style.width = this.pixelsPerSpaceUnit
				g.style.float = 'left'
				g.addEventListener('mousedown', (e) => this.gridClickStart(e))
				g.addEventListener('mouseup', (e) => this.gridClickEnd(e))
				editorEl.appendChild(g) //`<div class="g" id="g_${y}_${x}"></div>`)
			}
		}
	}

	gridClickStart(e) {
		this.selectedGrid[0] = e.target
		console.log('clicked on ', this.gridClickStart)
		document.querySelectorAll('.p').forEach( (el) => { el.classList.remove('p') })
	}

	gridClickEnd(e) {
		this.selectedGrid[1] = e.target
		this.updateBlueprint()
		let platforms = this.parseGridToPlatforms()
		
		this.clientEngine.editorCreatePlatform(platforms)

	}

	// should not affect the dom to be pure - return grid
	updateBlueprint() {
		console.log('updateBlueprint')

		let getAffectedGrid = (start, stop) => {
			console.log('toggleRange', start, stop)
			let startX = Number(start.split('_')[2])
			let startY = Number(start.split('_')[1])
			console.log('startY, startX', startY, startX)
			let stopX = Number(stop.split('_')[2])
			let stopY = Number(stop.split('_')[1])
			console.log('stopY, stopX', stopY, stopX)

			let affectedGrid = []
			for (let y=startY; y<=stopY; y++) {
				for(let x=startX; x<=stopX; x++) {
					let id = `g_${y}_${x}`
					console.log('add ', id)
					affectedGrid.push(id)
				}
			}
			return affectedGrid
		}

		let affectedGrid = getAffectedGrid(this.selectedGrid[0].id, this.selectedGrid[1].id)
		console.log('affectedGrid', affectedGrid)

		for (let id of affectedGrid) {
			let el = document.getElementById(id)
			el.classList.add('p')
		}
	}

	parseGridToPlatforms() {
		let recursiveAddHeight = (grid, platform, offset, width, _parsed) => {
			console.log('addHeight', platform, offset, width)
			let continues = true
			const max = grid.length
			_parsed = _parsed || []
			let tmp = []
			for (let i=0; i<platform.w; i++) {
				if (offset+i < max) {
					if (continues && grid[offset+i].classList.contains('p')) {
						console.log('found p')
					} else {
						continues = false
					}
					tmp.push(Number(offset+i))
				} else {
					console.log('above max', offset+i, max)
					continues = false
				}
			}
			if (continues) {
				console.log(' yes add height')
				platform.h++
				_parsed = _parsed.concat(tmp)
				if (offset+width < max-1)
					_parsed = _parsed.concat(recursiveAddHeight(grid, platform, Number(offset + width), width, _parsed))
			} else
				console.log(' not continues')
			
			console.log(' - parsed', _parsed)
			return _parsed
		}
		const grids = document.querySelectorAll('.g')
		console.log('editor.all', grids.length)
		const width = this.gameEngine.spaceWidth
		const height = this.gameEngine.spaceHeight
		let parsed = []
		let platforms = []
		let platform = {}
		let streak = 0
		let i = 0
		grids.forEach((grid, index) => {
			if (!parsed.includes(index) && grid.classList.contains('p')) {
				let y = Math.floor(index/width)
				let x = index%width

				// first platform cell
				if (!streak)
					platform = {x , y, type:"p"}
				
				streak++
			} else {
				// not a platform cell - complete the streak, if any
				if (streak) {
					// more than one row?
					if (streak > width) {
						platform.w = width
						platform.h = Math.floor(streak/width)
					} else {
						platform.w = streak
						// offset to row below
						let offset = (index) - (streak) + width
						platform.h = 1
						let p = recursiveAddHeight(grids, platform, offset, width)
						parsed = parsed.concat(p)
						console.log('parsed', p)
					}
					console.log('add platform', platform)
					platforms.push(platform)
				}
				streak = 0
			}
			parsed.push(i)
			i++
		})
		// push last cells if ongoing streak at end of iteration
		if (streak) {
			if (streak > width) {
				platform.w = width
				platform.h = Math.floor(streak/width)
			} else {
				platform.w = streak
				platform.h = 1
			}
			platforms.push(platform)
		}
		console.log('platforms', platforms)
		platforms = platforms.map(item => {
			item.y = height - item.y - item.h
			return item
		})
		return platforms
	}

	platformToGrid(platform) {
		// reverse y-axis
		let y = platform.y - 75 - 1 
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
