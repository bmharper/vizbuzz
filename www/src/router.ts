import Vue from 'vue'
import Router from 'vue-router'
import GeometryViewer from './views/GeometryViewer.vue'

Vue.use(Router)

export default new Router({
	mode: 'history',
	routes: [
		{
			path: '/',
			name: 'GeometryViewer',
			component: GeometryViewer
		},
	]
})
