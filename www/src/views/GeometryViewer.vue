<template>
	<div class="polygonRoot">
		<div class='toolbar'>
			<button @click='onReload'>Reload</button>
			<button @click='onZoomAll'>Zoom All</button>
		</div>
		<div ref='canvasLayoutRoot' class='horzPanels'>
			<div ref='mainCanvasPlacer' class='mainCanvasPlacer' />
			<canvas ref='mainCanvas' class='mainCanvas' :style='mainCanvasStyle' />
			<div class='rightPanel'>
				Right Panel
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { Draw } from './draw';
import { Poly, Ring, VizFile } from './geom';
import { Rect } from './rect';
import { Vec2, Vec3 } from './vec';

@Component({
	components: {},
})
export default class GeometryViewer extends Vue {
	alive = true;
	isFirstLoad = true;
	mainCanvasLeft = 0;
	mainCanvasTop = 0;
	mainCanvasWidth = 0;
	mainCanvasHeight = 0;
	draw!: Draw;
	ws!: WebSocket;

	get mainCanvasStyle(): any {
		return {
			left: this.mainCanvasLeft + 'px',
			top: this.mainCanvasTop + 'px',
			width: this.mainCanvasWidth + 'px',
			height: this.mainCanvasHeight + 'px',
		};
	}

	// We can't use a canvas for auto-sizing, because once a canvas has a width and height, then that becomes it's
	// desired size, so it then clobbers everything else that is being auto-sized, and the canvas ends up being
	// unable to shrink.
	placeCanvas() {
		let root = this.$refs.canvasLayoutRoot as HTMLElement;
		let placer = this.$refs.mainCanvasPlacer as HTMLElement;
		let canvas = this.$refs.mainCanvas as HTMLCanvasElement;
		if (!root || !placer || !canvas)
			return;
		let rr = root.getBoundingClientRect();
		let p = placer.getBoundingClientRect();
		let w = Math.floor(p.width);
		let h = Math.floor(p.height);
		this.mainCanvasLeft = Math.floor(rr.left - p.left);
		this.mainCanvasTop = Math.floor(rr.top - p.top);
		if (w !== this.mainCanvasWidth || h !== this.mainCanvasHeight) {
			this.mainCanvasWidth = w;
			this.mainCanvasHeight = h;
			canvas.width = this.mainCanvasWidth * window.devicePixelRatio;
			canvas.height = this.mainCanvasHeight * window.devicePixelRatio;
			//this.draw.xform.zoomRect(new Rect(0, 0, 100, 100), new Rect(0, 0, 1000, 1000));
			this.draw.render();
		}
	}

	placeCanvasTimer() {
		this.placeCanvas();
		if (this.alive)
			setTimeout(() => this.placeCanvasTimer(), 500);
	}

	onWindowResize() {
		this.placeCanvas();
	}

	onZoomAll() {
		this.draw.zoomAll();
	}

	onReload() {
		this.pullFromServer();
	}

	async pullFromServer() {
		let r = await fetch('/api/items');
		let j = await r.json();
		this.setFromServer(j);
	}

	async setFromServer(fileSet: any) {
		console.log("Load");
		this.draw.items = [];
		if (fileSet.files) {
			for (let jfile of fileSet.files) {
				let vfile = VizFile.fromJSON(jfile);
				this.draw.items.push(...vfile.items);
			}
		}
		if (this.isFirstLoad) {
			this.isFirstLoad = false;
			this.draw.zoomAll();
		} else {
			this.draw.render();
		}
	}

	openWebSocket() {
		let ws = new WebSocket("ws://" + window.location.host + "/wsapi/connect");

		ws.addEventListener('open', () => {
			console.log("WebSocket open");
		});

		ws.addEventListener('message', (ev) => {
			let data = JSON.parse(ev.data);
			this.setFromServer(data);
		});
	}

	// Create a triangle, to test canvas rendering
	createTestTriangle() {
		let p = new Poly();
		let ring = new Ring();
		ring.vx = [
			new Vec2(0, 0),
			new Vec2(1, 0),
			new Vec2(0, 1),
		]
		p.rings.push(ring);
		this.draw.items.push(p);
	}

	mounted() {
		this.draw = new Draw();
		//this.createTestTriangle();
		this.draw.attach(this.$refs.mainCanvas as HTMLCanvasElement);
		this.draw.zoomAll();

		this.placeCanvas();
		window.addEventListener('resize', this.onWindowResize);

		this.pullFromServer();
		this.openWebSocket();
	}
	destroyed() {
		this.alive = false;
		window.removeEventListener('resize', this.onWindowResize);
	}
}
</script>

<style scoped lang="scss">
.polygonRoot {
	display: flex;
	flex-direction: column;
	height: 1px;
	flex: 1 1 auto;
}
.horzPanels {
	display: flex;
	height: 1px;
	flex: 1 1 auto;
	position: relative; // start new stacking context
}
.toolbar {
	padding: 8px 4px;
	background-color: #f8f8f8;
}
.mainCanvasPlacer {
	display: flex;
	width: 100px;
	flex: 1 0 auto;
	//background-color: darksalmon;
}
.mainCanvas {
	position: absolute;
	//background-color: rgba(0, 255, 0, 0.3);
}
button {
	margin: 0 8px;
}
.rightPanel {
	display: none;
}
</style>

