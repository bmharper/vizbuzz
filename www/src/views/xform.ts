import { clamp } from "./math";
import { Rect } from "./rect";
import { Vec2 } from "./vec";

// XForm takes care of world space/view space transforms
// "World" space is the thing you're showing, such as an image, or a grid
// "Canvas" space is the pixels of the canvas
export class XForm {
	scale = 1; // scale
	tx = 0; // x translate
	ty = 0; // y translate
	minScale = 1e-10;
	maxScale = 1e10;

	worldToCanvasPt(worldPt: Vec2): Vec2 {
		return this.worldToCanvas(worldPt.x, worldPt.y);
	}

	worldToCanvas(x: number, y: number): Vec2 {
		return new Vec2(x * this.scale + this.tx, y * this.scale + this.ty);
	}

	worldToCanvasLength(len: number): number {
		return len * this.scale;
	}

	canvasToWorldPt(canvasPt: Vec2): Vec2 {
		return new Vec2((canvasPt.x - this.tx) / this.scale, (canvasPt.y - this.ty) / this.scale);
	}

	canvasToWorld(x: number, y: number): Vec2 {
		return new Vec2((x - this.tx) / this.scale, (y - this.ty) / this.scale);
	}

	canvasToWorldLength(len: number): number {
		return len / this.scale;
	}

	zoomRect(world: Rect, canvas: Rect, fill = 0.9) {
		let scale = Math.min(canvas.width / world.width, canvas.height / world.height) * fill;
		scale = clamp(scale, this.minScale, this.maxScale);
		this.scale = scale;
		this.tx = (canvas.x1 + canvas.x2) / 2 - scale * (world.x1 + world.x2) / 2;
		this.ty = (canvas.y1 + canvas.y2) / 2 - scale * (world.y1 + world.y2) / 2;
	}

	// zoom by a 'zoom' factor which is less than or greater than 1
	zoomPoint(x: number, y: number, zoom: number, snapScale = true) {
		let newScale = this.scale * zoom;
		if (snapScale)
			newScale = this.snapToPowerOf(newScale, 1.1);
		newScale = clamp(newScale, this.minScale, this.maxScale);
		this.zoomAroundPoint(x, y, newScale);
	}

	// zoom around a point, to a precise new scale
	zoomAroundPoint(x: number, y: number, newScale: number) {
		// constraint: canvasToImg(x,y) === canvasToImgM(x,y)
		// canvasToImg  is our original transformation from canvas coords to image coords
		// canvasToImgM is our modified transformation from canvas coords to image coords
		// in other words, the cursor must remain in the same place in image coords.

		const s = this.scale;
		const tx = this.tx;
		const ty = this.ty;
		const sM = newScale;

		//console.log('zoom to ', x, y, sM);

		// and all that remains, is to solve for txM and tyM
		// imgToCanvas(x) = x * s + tx
		// canvasToImg(x) = (x - tx) / s
		// from our constraint:
		// (x - txM) / sM = (x - tx) / s
		// x - txM = sM * (x - tx) / s
		// -txM = sM * (x - tx) / s - x
		// txM = x - sM * (x - tx) / s
		let txM = x - sM * (x - tx) / s;
		let tyM = y - sM * (y - ty) / s;
		txM = Math.round(txM);
		tyM = Math.round(tyM);

		this.scale = sM;
		this.tx = txM;
		this.ty = tyM;
	}

	// round scale to nearest power of 2
	snapToPowerOf2(x: number): number {
		x = Math.log2(x);
		x = Math.round(x);
		return Math.pow(2, x);
	}

	// round scale to nearest power of a number roundTo
	snapToPowerOf(x: number, roundTo: number): number {
		x = Math.log(x) / Math.log(roundTo);
		x = Math.round(x);
		return Math.pow(roundTo, x);
	}


}