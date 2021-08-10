module.exports = {
	devServer: {
		disableHostCheck: true,
		proxy: {
			'^/api': {
				target: 'http://localhost:9999',
			},
			'^/wsapi': {
				target: 'http://localhost:9999',
				ws: true
			}
		}
	}
}