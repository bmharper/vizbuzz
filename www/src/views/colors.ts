export class RGB {
	constructor(public r: number, public g: number, public b: number) { }

	toCSSRGBA(alpha_0_to_1: number): string {
		return `rgba(${this.r},${this.g},${this.b},${alpha_0_to_1})`;
	}
}

export function uniqueColors(): RGB[] {
	return [
		new RGB(166, 206, 227),
		new RGB(31, 120, 180),
		new RGB(178, 223, 138),
		new RGB(51, 160, 44),
		new RGB(251, 154, 153),
		new RGB(227, 26, 28),
		new RGB(253, 191, 111),
		new RGB(255, 127, 0),
		new RGB(202, 178, 214),
		new RGB(106, 61, 154),
		new RGB(255, 255, 153),
		new RGB(177, 89, 40),
	];
}