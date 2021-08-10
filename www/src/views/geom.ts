import { Rect } from "./rect";
import { Vec2 } from "./vec";

export class DistanceQuery {
	constructor(public distanceToEdge: number, public distanceToVertex: number, public closestVertex: number) { }
}

export function closestPtOnLine(pt: Vec2, p1: Vec2, p2: Vec2, isSeg: boolean): Vec2 {
	if (pt.equals(p1)) {
		return p1;
	}
	if (pt.equals(p2)) {
		return p2;
	}
	let me = p2.sub(p1);
	let sub2 = pt.sub(p1);
	let len = me.dot(me);
	// #define DBL_EPSILON 2.2204460492503131e-16
	// We just arbitrarily raise epsilon here. Thumbsuck business - zero method to the madness.
	if (Math.abs(len) < 1e-14) {
		return p1;
	}
	let r = sub2.dot(me) / len;
	if (!isSeg || (r >= 0 && r <= 1))
		return new Vec2(p1.x + r * me.x, p1.y + r * me.y);

	if (r < 0)
		return p1;
	else
		return p2;
}

export function distancePtToLine(pt: Vec2, p1: Vec2, p2: Vec2, isSeg: boolean): number {
	let closestPt = closestPtOnLine(pt, p1, p2, isSeg);
	return closestPt.distance(pt);
}

export class Ring {
	vx: Vec2[] = [];
	closed = true;

	static fromJSON(j: any): Ring {
		let r = new Ring();
		for (let vx of j) {
			let v = new Vec2(0, 0);
			v.x = vx[0];
			v.y = vx[1];
			//if (vx.length >= 3)
			//	v.z = vx[2];
			r.vx.push(v);
		}
		return r;
	}

	get bounds(): Rect {
		let b = Rect.inverted();
		for (let v of this.vx) {
			b.expandToFit(v.x, v.y);
		}
		return b;
	}

	distanceToPt(pt: Vec2): DistanceQuery {
		let j = this.vx.length - 1;
		let i = 0;
		if (!this.closed) {
			j = 0;
			i = 1;
		}
		let minEdgeD = 1e30;
		let minVxD = this.vx[j].distance(pt);
		let bestVx = j;
		for (; i < this.vx.length; i++) {
			let d = distancePtToLine(pt, this.vx[i], this.vx[j], true);
			if (d < minEdgeD) {
				minEdgeD = d;
			}
			let vxD = this.vx[i].distance(pt);
			if (vxD < minVxD) {
				minVxD = vxD;
				bestVx = i;
			}
			j = i;
		}
		return new DistanceQuery(minEdgeD, minVxD, bestVx);
	}

	isInsideMe(x: number, y: number): boolean {
		if (this.vx.length < 3)
			return false;
		let i = 0;
		let j = this.vx.length - 1;
		let c = 0;
		let v = this.vx;
		for (; i < this.vx.length; i++) {
			if ((
				((v[i].y <= y) && (y < v[j].y)) ||
				((v[j].y <= y) && (y < v[i].y))) &&
				(x < (v[j].x - v[i].x) * (y - v[i].y) / (v[j].y - v[i].y) + v[i].x))
				c ^= 1;
			j = i;
		}
		return c !== 0;
	}

	signedArea(): number {
		let area = 0;
		let v = this.vx;
		let tail = v.length - 1;
		let head = 0;
		for (let i = 0; i < v.length; i++) {
			let t = 0;
			t += (v[tail].x - v[0].x) * (v[head].y - v[0].y); // x * y
			t -= (v[tail].y - v[0].y) * (v[head].x - v[0].x); // y * x
			area += t;
			tail = head;
			head++;
		}

		area *= 0.5;
		return area;
	}

	get area(): number {
		return Math.abs(this.signedArea());
	}

}

export abstract class VizItem {
	filename: string = '';
	name: string = '';

	parseJSON(j: any) {
		if (j.name)
			this.name = j.name;
	}

	abstract get bounds(): Rect;
	abstract get area(): number;
	abstract isInsideMe(x: number, y: number): boolean;
	abstract distanceToPt(pt: Vec2): DistanceQuery;
}

export class VizFile {
	name: string = '';
	items: VizItem[] = [];

	static fromJSON(j: any): VizFile {
		let f = new VizFile();
		f.name = j.name;
		if (j.items) {
			for (let jitem of j.items) {
				let item: VizItem | undefined = undefined;
				if (jitem.polygon)
					item = Poly.fromJSON(jitem);
				if (item) {
					item.filename = f.name;
					f.items.push(item);
				}
			}
		}
		return f;
	}
}

export class Poly extends VizItem {
	rings: Ring[] = [];

	static fromJSON(j: any): Poly {
		let p = new Poly();
		p.parseJSON(j);
		for (let jRing of j.polygon.rings) {
			let r = Ring.fromJSON(jRing);
			r.closed = true;
			p.rings.push(r);
		}
		return p;
	}

	get bounds(): Rect {
		let b = Rect.inverted();
		for (let r of this.rings) {
			b.expandToFitRect(r.bounds);
		}
		return b;
	}

	distanceToPt(pt: Vec2): DistanceQuery {
		let best = new DistanceQuery(1e30, 1e30, -1);
		let bestRing = -1;
		for (let i = 0; i < this.rings.length; i++) {
			let d = this.rings[i].distanceToPt(pt);
			if (d.distanceToEdge < best.distanceToEdge) {
				best = d;
				bestRing = i;
			}
		}
		best.closestVertex += bestRing * 1000000;
		return best;
	}

	vertex(i: number): Vec2 {
		let ring = Math.floor(i / 1000000);
		let rem = i % 1000000;
		return this.rings[ring].vx[rem];
	}

	isInsideMe(x: number, y: number): boolean {
		for (let r of this.rings) {
			if (r.isInsideMe(x, y)) {
				return true;
			}
		}
		return false;
	}

	get area(): number {
		let a = 0;
		for (let r of this.rings) {
			a += r.area;
		}
		return a;
	}
}

