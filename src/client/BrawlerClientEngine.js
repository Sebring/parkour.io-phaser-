import { ClientEngine } from 'lance-gg'
import EditorRenderer from '../client/EditorRenderer'
import KeyboardControls from './KeyboardControls'
import EditorControls from './EditorControls'

export default class BrawlerClientEngine extends ClientEngine {

	constructor(gameEngine, options) {
		super(gameEngine, options, EditorRenderer)

		// show try-again button
		gameEngine.on('objectDestroyed', (obj) => {
			if (obj.playerId === gameEngine.playerId) {
				// player was removed/Destroyed
			}
		})

		this.controls = new KeyboardControls(this)
		this.controls.bindKey('ctrl', 'ctrl');
		this.controls.bindKey('up', 'up', { repeat: true } )
		this.controls.bindKey('down', 'down', { repeat: true } )
		this.controls.bindKey('left', 'left', { repeat: true } )
		this.controls.bindKey('right', 'right', { repeat: true } )

		this.mouseControls = new EditorControls(this)
		
		
	}

	editorCreatePlatform(spec) {
		console.log(spec)
		this.sendInput('editor', spec)
	}
}
