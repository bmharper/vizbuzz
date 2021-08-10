export class Vec2 {
	x = 0;
	y = 0;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	equals(b: Vec2): boolean {
		return this.x === b.x && this.y === b.y;
	}

	sub(b: Vec2): Vec2 {
		return new Vec2(this.x - b.x, this.y - b.y);
	}

	dot(b: Vec2): number {
		return this.x * b.x + this.y * b.y;
	}

	distance(b: Vec2): number {
		let dx = this.x - b.x;
		let dy = this.y - b.y;
		return Math.sqrt(dx * dx + dy * dy);
	}
}

export class Vec3 {
	x = 0;
	y = 0;
	z = 0;

	constructor(x: number, y: number, z = 0) {
		this.x = x;
		this.y = y;
		this.z = z;
	}
}
