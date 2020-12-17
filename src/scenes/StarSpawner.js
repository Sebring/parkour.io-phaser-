import Phaser from 'phaser'

export default class StarSpawner {
	constructor(scene, starKey = 'star') {
		this.scene = scene
		this.key = starKey

		this._group = this.scene.physics.add.group()
	}

	get group() {
		return this._group
	}

	spawn(count) {
		this._group = this.scene.physics.add.group({
			key: this.key,
			repeat: count,
			setXY: { x: 12, y: 0, stepX: 10 }
		})
		this.group.children.iterate(child => {
			child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8))
		})
		return this.group
	}
}