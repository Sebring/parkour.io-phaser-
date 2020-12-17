import Phaser from 'phaser'

export default class MenuScene extends Phaser.Scene {
	constructor() {
		super('menu-scene')
	}

	preload() {
		this.load.image("repeating-background", "https://www.mikewesthad.com/phaser-3-tilemap-blog-posts/post-1/assets/images/escheresque_dark.png");
	}

	create() {
		// You can access the game's config to read the width & height
		let { width, height } = this.sys.game.config
		width = Number(width)
		height = Number(height)
		// Creating a repeating background sprite
		const bg = this.add.tileSprite(0, 0, width, height, "repeating-background");
		bg.setOrigin(0, 0);

		// In v3, you can chain many methods, so you can create text and configure it in one "line"
		this.add
			.text(width / 2, height * 0.2, "PARKOUR.IO", {
			font: "42px monospace",
			color: "white"
			})
			.setOrigin(0.5, 0.5)
			.setShadow(5, 5, "#5588EE", 0, true, true)
			.setPadding(10, 10, 10, 10)
	}

	update() {
	}
}
