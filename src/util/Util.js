export const LEFT = -1

export const RIGHT = 1

export function getDistance(point1, point2) {
	const dX = point2.x - point1.x
	const dY = point2.y - point1.y

	const tX = dX * dX
	const tY = dY * dY

	return { total: Math.ceil(Math.sqrt(tX + tY)), x: Math.ceil(dX), y: Math.ceil(dY) }
}
