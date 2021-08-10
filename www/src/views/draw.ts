import { uniqueColors } from "./colors";
import { Poly, VizItem } from "./geom";
import { Rect } from "./rect";
import { Vec2 } from "./vec";
import { XForm } from "./xform";

class RenderState {
	cx!: CanvasRenderingContext2D;
	iColor = 0;
	iColorHot = 0;
}

class FindResult {
	el: VizItem | null = null;
	distanceEdgePx = 9e30;
	distanceVertexPx = 9e30;
	vertex = -1;
}

enum RenderMode {
	Regular,
	Hot,
}

export class Draw {
	canvas?: HTMLCanvasElement;
	items: VizItem[] = [];
	xform = new XForm();
	colors = uniqueColors();
	hot: FindResult = new FindResult();
	hotVx = -1;
	// panMX = 0;
	// panMY = 0;
	// panTX = 0;
	// panTY = 0;

	render() {
		if (!this.canvas)
			return;
		this.canvas.width = this.canvas.width;
		let rs = new RenderState();
		rs.cx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
		rs.iColor = 0;

		for (let item of this.items) {
			if (item instanceof Poly)
				this.renderPoly(rs, item, RenderMode.Regular);
		}

		//let isHotPoly = this.hot.el && this.hot.el instanceof Poly
		let hotPoly: Poly | undefined = undefined;
		if (this.hot.el && this.hot.el instanceof Poly)
			hotPoly = this.hot.el;

		if (hotPoly) {
			// Draw the hot element again, this time on top of everything else
			rs.iColor = rs.iColorHot;
			this.renderPoly(rs, hotPoly, RenderMode.Hot);
		}

		if (hotPoly && this.hot.vertex !== -1) {
			let vxW = hotPoly.vertex(this.hot.vertex);
			let vx = this.xform.worldToCanvasPt(vxW);
			rs.cx.lineWidth = 1.5;
			rs.cx.beginPath();
			rs.cx.strokeStyle = "rgba(255,255,255,1)";
			rs.cx.fillStyle = "rgba(240,0,0,1)";
			rs.cx.ellipse(vx.x, vx.y, 8, 8, 0, 0, Math.PI * 2);
			rs.cx.fill();
			rs.cx.stroke();

			this.haloText(rs, vx.x, vx.y, `(vertex ${this.hot.vertex})    ${vxW.x}, ${vxW.y}`);
		}
	}

	haloText(rs: RenderState, x: number, y: number, txt: string) {
		rs.cx.font = `${14 * window.devicePixelRatio}px sans-serif`;
		rs.cx.fillStyle = 'rgba(255,255,255,0.3)';
		rs.cx.textAlign = 'right';
		for (let dx = -2; dx <= 2; dx++) {
			for (let dy = -2; dy <= 2; dy++) {
				rs.cx.fillText(txt, x + dx, y + dy);
			}
		}
		rs.cx.fillStyle = 'rgba(0,0,0,1)';
		rs.cx.fillText(txt, x, y);
	}

	renderPoly(rs: RenderState, p: Poly, mode: RenderMode) {
		let cx = rs.cx;

		let strokeOpacity = 0.3;

		switch (mode) {
			case RenderMode.Regular:
				cx.lineWidth = 5;
				if (p === this.hot.el) {
					// Remember the color of the hot element, so that when we render it again, on top of everything else,
					// we keep it's color consistent with it's regular color.
					rs.iColorHot = rs.iColor;
					// Draw the regular representation of it very faint, because we're going to draw it again on top of everything else.
					strokeOpacity = 0.1;
				}
				break;
			case RenderMode.Hot:
				cx.lineWidth = 7;
				strokeOpacity = 0.8;
				break;
		}

		for (let iRing = 0; iRing < p.rings.length; iRing++) {
			let ring = p.rings[iRing];
			let i = 1;
			let j = 0;
			let color = this.colors[rs.iColor % this.colors.length];
			cx.strokeStyle = color.toCSSRGBA(strokeOpacity);
			cx.fillStyle = color.toCSSRGBA(0.2);
			cx.beginPath();
			let prev = this.xform.worldToCanvas(ring.vx[j].x, ring.vx[j].y);
			cx.moveTo(prev.x, prev.y);
			for (; i < ring.vx.length; i++) {
				let v = this.xform.worldToCanvas(ring.vx[i].x, ring.vx[i].y);
				cx.lineTo(v.x, v.y);
				j = i;
			}
			cx.closePath();
			cx.stroke();
			if (mode === RenderMode.Hot)
				cx.fill();
			rs.iColor++;
		}

		for (let iRing = 0; iRing < p.rings.length; iRing++) {
			let ring = p.rings[iRing];
			cx.fillStyle = 'rgba(150,0,0,0.6)';
			cx.strokeStyle = 'rgba(255,255,255,0.9)';
			cx.lineWidth = 1.5;
			for (let i = 0; i < ring.vx.length; i++) {
				let v = this.xform.worldToCanvas(ring.vx[i].x, ring.vx[i].y);
				cx.beginPath();
				let r = mode === RenderMode.Hot ? 8 : 6;
				rs.cx.ellipse(v.x, v.y, r, r, 0, 0, Math.PI * 2);
				rs.cx.fill();
				rs.cx.stroke();
			}
		}

	}

	evToCanvas(ev: MouseEvent | PointerEvent): Vec2 {
		return new Vec2(ev.offsetX * window.devicePixelRatio, ev.offsetY * window.devicePixelRatio);
	}

	attach(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		this.canvas.addEventListener('wheel', (ev: WheelEvent) => {
			// This little line here is vital for multi-touch pinch/zoom gestures. Without it, Chrome will do a full page zoom.
			ev.preventDefault();

			let snapScale = false;
			const zoomAmount = 1.4;
			const zoom = ev.deltaY < 0 ? zoomAmount : 1 / zoomAmount;
			let p = this.evToCanvas(ev);
			this.xform.zoomPoint(p.x, p.y, zoom, snapScale);
			this.render();
		});
		this.canvas.addEventListener('pointermove', (ev: PointerEvent) => { this.onPointerMove(ev); });
	}

	get canvasRect(): Rect | null {
		if (!this.canvas)
			return null;
		return new Rect(0, 0, this.canvas.width, this.canvas.height);
	}

	onPointerMove(ev: PointerEvent) {
		let canvasPt = this.evToCanvas(ev);
		let worldPt = this.xform.canvasToWorldPt(canvasPt);
		let closest = this.closest(worldPt);
		if (this.hot.el !== closest.el || this.hot.vertex !== closest.vertex) {
			this.hot = closest;
			this.render();
		}
	}

	zoomAll() {
		let cr = this.canvasRect;
		if (!cr)
			return;
		let w = this.bounds;
		if (!w.isInverted) {
			this.xform.zoomRect(w, cr);
			this.render();
		}
	}

	get bounds(): Rect {
		let r = Rect.inverted();
		for (let item of this.items) {
			r.expandToFitRect(item.bounds);
		}
		return r;
	}

	worldToCanvasRounded(worldDistance: number, precision: number): number {
		return Math.round(worldDistance * this.xform.scale * precision) / precision;
	}

	isArrayLessThan(a: number[], b: number[]): boolean {
		for (let i = 0; i < a.length; i++) {
			if (a[i] < b[i])
				return true;
			else if (a[i] > b[i])
				return false;
		}
		return false;
	}

	closest(pt: Vec2): FindResult {
		let res = new FindResult();
		let bestDistance: number[] = [9e30, 9e30, 9e30];
		for (let el of this.items) {
			let d: number[] = [];

			// add a boost for being inside
			if (el.isInsideMe(pt.x, pt.y)) {
				d.push(0);
			} else {
				d.push(1);
				continue;
			}

			// smaller is better
			d.push(el.area);

			let closest = el.distanceToPt(pt);
			let distanceEdgePx = closest.distanceToEdge * this.xform.scale;
			let distanceVertexPx = closest.distanceToVertex * this.xform.scale;
			d.push(distanceEdgePx);

			if (this.isArrayLessThan(d, bestDistance)) {
				bestDistance = d;
				res.distanceEdgePx = distanceEdgePx;
				res.distanceVertexPx = distanceVertexPx;
				res.vertex = closest.closestVertex;
				res.el = el;
			}
		}
		return res;
	}

}