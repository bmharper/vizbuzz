<template>
	<div id="app" class='appRoot'>
		<div class='nav'>VizBuzz</div>
		<router-view/>
	</div>
</template>

<style lang="scss" scoped>
.appRoot {
	height: 100%;
	//background-color: beige;
	display: flex;
	flex-direction: column;
}
.nav {
	font-size: 12px;
	padding: 6px 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #eee;
}
</style>
