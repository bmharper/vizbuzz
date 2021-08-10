import { Vec2 } from './vec';

function distanceSQ(x1: number, y1: number, x2: number, y2: number): number {
	let dx = x1 - x2;
	let dy = y1 - y2;
	return dx * dx + dy * dy;
}

export class Rect {
	x1 = 0;
	y1 = 0;
	x2 = 0;
	y2 = 0;

	constructor(x1 = 0, y1 = 0, x2 = 0, y2 = 0) {
		this.x1 = x1;
		this.y1 = y1;
		this.x2 = x2;
		this.y2 = y2;
	}

	static inverted(): Rect {
		return new Rect(1e37, 1e37, -1e37, -1e37);
	}

	static fromDOMRect(r: DOMRect): Rect {
		return new Rect(r.left, r.top, r.right, r.bottom);
	}

	get area(): number {
		return (this.x2 - this.x1) * (this.y2 - this.y1);
	}

	get width(): number {
		return this.x2 - this.x1;
	}

	get height(): number {
		return this.y2 - this.y1;
	}

	get center(): Vec2 {
		return new Vec2((this.x1 + this.x2) / 2, (this.y1 + this.y2) / 2);
	}

	get maxDim(): number {
		return Math.max(this.width, this.height);
	}

	get isInverted(): boolean {
		return this.x2 < this.x1 || this.y2 < this.y1;
	}

	equals(r: Rect): boolean {
		return this.x1 === r.x1 &&
			this.y1 === r.y1 &&
			this.x2 === r.x2 &&
			this.y2 === r.y2;
	}

	expand(amount: number) {
		this.x1 -= amount;
		this.y1 -= amount;
		this.x2 += amount;
		this.y2 += amount;
	}

	expanded(amount: number): Rect {
		return new Rect(this.x1 - amount, this.y1 - amount, this.x2 + amount, this.y2 + amount);
	}

	// x = Math.round(x * prec) / prec
	round(prec: number) {
		this.x1 = Math.round(this.x1 * prec) / prec;
		this.y1 = Math.round(this.y1 * prec) / prec;
		this.x2 = Math.round(this.x2 * prec) / prec;
		this.y2 = Math.round(this.y2 * prec) / prec;
	}

	normalize() {
		if (this.x1 > this.x2) {
			let t = this.x1;
			this.x1 = this.x2;
			this.x2 = t;
		}
		if (this.y1 > this.y2) {
			let t = this.y1;
			this.y1 = this.y2;
			this.y2 = t;
		}
	}

	expandToFit(x: number, y: number) {
		this.x1 = Math.min(this.x1, x);
		this.y1 = Math.min(this.y1, y);
		this.x2 = Math.max(this.x2, x);
		this.y2 = Math.max(this.y2, y);
	}

	expandToFitRect(r: Rect) {
		this.x1 = Math.min(this.x1, r.x1);
		this.y1 = Math.min(this.y1, r.y1);
		this.x2 = Math.max(this.x2, r.x2);
		this.y2 = Math.max(this.y2, r.y2);
	}

	clone(): Rect {
		return new Rect(this.x1, this.y1, this.x2, this.y2);
	}

	isInsideMe(x: number, y: number): boolean {
		return x >= this.x1 && y >= this.y1 && x < this.x2 && y < this.y2;
	}

	offset(dx: number, dy: number) {
		this.x1 += dx;
		this.y1 += dy;
		this.x2 += dx;
		this.y2 += dy;
	}

	offsetClone(dx: number, dy: number): Rect {
		let r = this.clone();
		r.offset(dx, dy);
		return r;
	}

	// vertex numbers
	// 0: x1,y1
	// 1: x2,y1
	// 2: x2,y2
	// 3: x1,y2
	closestVertex(x: number, y: number): number {
		let d0 = distanceSQ(x, y, this.x1, this.y1);
		let d1 = distanceSQ(x, y, this.x2, this.y1);
		let d2 = distanceSQ(x, y, this.x2, this.y2);
		let d3 = distanceSQ(x, y, this.x1, this.y2);
		if (d0 <= d1 && d0 <= d2 && d0 <= d3)
			return 0;
		if (d1 <= d2 && d1 <= d3)
			return 1;
		if (d2 <= d3)
			return 2;
		return 3;
	}

	vertices(): Vec2[] {
		return [
			this.vertex(0),
			this.vertex(1),
			this.vertex(2),
			this.vertex(3),
		];
	}

	vertex(vn: number): Vec2 {
		switch (vn) {
			case 0: return new Vec2(this.x1, this.y1);
			case 1: return new Vec2(this.x2, this.y1);
			case 2: return new Vec2(this.x2, this.y2);
			case 3: return new Vec2(this.x1, this.y2);
		}
		throw new Error(`Invalid vertex number ${vn}`);
	}

	setVertex(vn: number, v: Vec2) {
		switch (vn) {
			case 0:
				this.x1 = v.x;
				this.y1 = v.y;
				break;
			case 1:
				this.x2 = v.x;
				this.y1 = v.y;
				break;
			case 2:
				this.x2 = v.x;
				this.y2 = v.y;
				break;
			case 3:
				this.x1 = v.x;
				this.y2 = v.y;
				break;
			default:
				throw new Error(`Invalid vertex number ${vn}`);
		}
	}

	// Returns true if the boxes overlap or touch.
	overlaps(r: Rect): boolean {
		return r.x2 >= this.x1 && r.x1 <= this.x2 &&
			r.y2 >= this.y1 && r.y1 <= this.y2;
	}

	intersection(clip: Rect): Rect {
		let copy = this.clone();
		copy.x1 = Math.max(copy.x1, clip.x1);
		copy.y1 = Math.max(copy.y1, clip.y1);
		copy.x2 = Math.min(copy.x2, clip.x2);
		copy.y2 = Math.min(copy.y2, clip.y2);
		// Clip, to prevent negative width/height
		copy.x2 = Math.max(copy.x1, copy.x2);
		copy.y2 = Math.max(copy.y1, copy.y2);
		return copy;
	}

	// Special case for Area, to improve speed of IoU calcs
	intersectionArea(clip: Rect): number {
		let x1 = Math.max(this.x1, clip.x1);
		let y1 = Math.max(this.y1, clip.y1);
		let x2 = Math.min(this.x2, clip.x2);
		let y2 = Math.min(this.y2, clip.y2);
		// Clip, to prevent negative width/height
		x2 = Math.max(x1, x2);
		y2 = Math.max(y1, y2);
		return (x2 - x1) * (y2 - y1);
	}

	union(clip: Rect): Rect {
		let copy = this.clone();
		copy.x1 = Math.min(copy.x1, clip.x1);
		copy.y1 = Math.min(copy.y1, clip.y1);
		copy.x2 = Math.max(copy.x2, clip.x2);
		copy.y2 = Math.max(copy.y2, clip.y2);
		return copy;
	}

	// Special case for Area, to improve speed of IoU calcs
	unionArea(clip: Rect): number {
		let x1 = Math.min(this.x1, clip.x1);
		let y1 = Math.min(this.y1, clip.y1);
		let x2 = Math.max(this.x2, clip.x2);
		let y2 = Math.max(this.y2, clip.y2);
		return (x2 - x1) * (y2 - y1);
	}

	// Computer Intersection over Union
	iou(b: Rect): number {
		let intersection = this.intersectionArea(b);
		return intersection / (this.area + b.area - intersection);
	}

	transposed(): Rect {
		return new Rect(this.y1, this.x1, this.y2, this.x2);
	}

	toString(): string {
		return `${this.x1},${this.y1},${this.x2},${this.y2}`;
	}

}