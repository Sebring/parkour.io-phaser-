import Phaser from 'phaser'

import MenuScene from './scenes/MenuScene'
import GameScene from './scenes/GameScene'

const config = {
	type: Phaser.AUTO,
	width: 800,
	height: 600,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 300 }
		}
	},
	scene: [GameScene, MenuScene]
}

export default new Phaser.Game(config)
