export function clamp(x: number, low: number, high: number): number {
	if (x < low)
		return low;
	if (x > high)
		return high;
	return x;
}
