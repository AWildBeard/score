/* GLOBAL ACCESS */
function getDate(date) {
	const now = new Date(date)
	const hours = now.getHours()
	const minutes = "0" + now.getMinutes()
	const seconds = "0" + now.getSeconds()
	return hours + ":" + minutes.substr(-2) + ":" + seconds.substr(-2)
}

/* ROUTER */
const router = new VueRouter()

/* vux state */
const store = new Vuex.Store({
	state: {
		teams: [],
		scoreboardGraph: {},
		scoreboardGraphLabels: [],
		hostData: {},
	},
	mutations: {
		setTeams: function(state, newTeams) {
			state.teams = newTeams
		},
		initScoreboardGraph: function(state, newTeams) {
			newScoreboardGraph = {}
			for (let index in newTeams) {
				var newData = {
					label: newTeams[index],
					borderColor: '#'+Math.floor(Math.random()*16777215).toString(16),
					fill: false,
					data: []
				}
				newScoreboardGraph[newTeams[index]] = newData
			}

			state.scoreboardGraph = newScoreboardGraph
		},
		updateScoreboardTeamData: function(state, update) {
			var teams = update['Teams']
			for (let index in teams) {
				let team = teams[index]

				state.scoreboardGraph[team['Team']].data.push(team['Services'])
			}
			state.scoreboardGraphLabels.push(getDate(update['Time']))
		},
		updateTeamHosts: function(state, update) {
			let team = update['Team']
			let hosts = update['Hosts']

			Vue.set(state.hostData, team, hosts)
		}
	}
})

Vue.component('host', {
	template: `
<div class="card">
	<div class="card-content black-text">
		<span class="card-title center">{{ host }}</span>
		<ul class="collection">
			<li v-for="(value, key) in ports" :key="key" :class="{ 'collection-item': true, row: true, active: true, red: value === 'closed', green: value === 'open'}">
				<div class="col s6 m6 l6">
					{{ key }}
				</div>
				<div class="col s6 m6 l6">
					<div class="right">
						{{ value }}
					</div>
				</div>
			</li>
		</ul>
	</div>
</div>
	`,
	store: store,
	props: ['host', 'team'],
	computed: {
		ports: function() {
			var data = {}
			var hostData = this.$store.state.hostData[this.team][this.host]
			var requiredPorts = hostData['RequiredPorts']
			var openPorts = hostData['OpenPorts']
			for (requiredPortIndex in requiredPorts) {
				var found = false
				for (openPortIndex in openPorts) {
					if (requiredPorts[requiredPortIndex] === openPorts[openPortIndex]) {
						found = true
						data[requiredPorts[requiredPortIndex]] = 'open'
						break
					}
				}

				if (!found) {
					data[requiredPorts[requiredPortIndex]] = 'closed'
				}
			}

			return data
		}
	}
})

function generateTeamPage(team) {
	return {
		template: `
<div class="col s12">
	<h4 class="center">{{ team }}</h4>
	<div v-for="(ports, host) in hosts" class="col s12 m6 l4">
		<host :host="host" :team="team"></host>
	</div>
</div>
		`,
		store: store,
		data: function() {
			return {
				team: team,
			}
		},
		computed: {
			hosts: function() {
				return this.$store.state.hostData[this.team]
			},
		},
	}
}

// Programatically get teams
var ws = new WebSocket('ws://' + window.location.host)

ws.onmessage = function(event) {
	newMessage = JSON.parse(event.data)
	if (newMessage['Type'] === "teams update") {
		var newTeams = newMessage['Content']
		store.commit('setTeams', newTeams)
		store.commit('initScoreboardGraph', newTeams)

		// add teams pages to router
		for (var index in newTeams) {
			var path = '/team/' + index
			let component = generateTeamPage(newTeams[index])
			router.addRoutes([{path: path, component: component}])
		}

		// add 404 page to router
		const fourohfour = {
			template: `
<div class="col s12">
	<h1 class="center">Page not found!</h1>
</div>`
		}

		router.addRoutes([{
			component: fourohfour,
			path: '*',
		}])
	} else if (newMessage['Type'] === "scoreboard update") {
		store.commit('updateScoreboardTeamData', newMessage['Content'])
	} else if (newMessage['Type'] === "hosts update") {
		store.commit('updateTeamHosts', newMessage['Content'])
	}
}

/* PAGES */
const scoreboard = {
	template: `
<div class="col s12">
	<h3 class="center">Scoreboard</h3>
	<canvas id="mainTeamComparisonChart"></canvas>
</div>`,
	data: function() {
		return {
			graph: undefined
		}
	},
	computed: {
		teams: function() {
			return store.state.teams
		},
		scoreboardGraph: function() {
			return store.state.scoreboardGraph
		},
		scoreboardGraphLabels: function() {
			return store.state.scoreboardGraphLabels
		}
	},
	watch: {
		scoreboardGraph: function() {
			this.updateGraphData()
		},
		scoreboardGraphLabels: function() {
			this.updateGraphData()
		}
	},
	methods: {
		updateGraphData: function() {
			for (let team in this.scoreboardGraph) {
				var found = false
				for (let index in this.graph.data.datasets) {
					if (this.graph.data.datasets[index].label === team) {
						found = true
						this.graph.data.datasets[index] = this.scoreboardGraph[team]
					}
				}

				if (!found) {
					this.graph.data.datasets.push(this.scoreboardGraph[team])
				}
			}

			this.graph.data.labels = this.scoreboardGraphLabels
			this.graph.update()
		}
	},
	mounted: function () {
		const elem = document.getElementById('mainTeamComparisonChart')
		this.graph = new Chart(elem, {
			type: 'line',
			options: {
				defaultFontColor: '#fafafa',
				scales: {
					yAxes: [{
						gridLines: {
							display: false,
						},
						ticks: {
							min: 0,
						},
						scaleLabel: {
							display: true,
							labelString: "Online Services",
							fontColor: '#fafafa'
						}
					}],
					xAxes: [{
						gridLines: {
							color: '#fafafa',
							zeroLineColor: '#fafafa'
						},
						scaleLabel: {
							display: true,
							labelString: "Time",
							fontColor: '#fafafa'
						}
					}]
				}
			}
		})
		this.updateGraphData()
	},
}

router.addRoutes([{ path: '/', component: scoreboard }])

/* GLOBAL COMPONENTS */
Vue.component('navbar', {
	router: router,
	template: `
<nav class="indigo accent-4 white-text">
	<div class="nav-wrapper">
		<ul id="teams-data-dropdown" class="dropdown-content">
			<li v-for="(team, index) in teams" :key="team" class="grey darken-3 white-text">
				<router-link :to="getTeamPath(index)" class="grey darken-3 white-text">
					{{ team }}
				</router-link>
			</li>
		</ul>
		<ul class="left">
			<li>
				<a id="showTeamSearchButton" @click="showTeamSearch" class="waves-effect waves-light">
					<i class="material-icons left">
						search
					</i>
					Team Switch
				</a>
			</li>
			<li>
				<a id="team-dropdown-button" class="dropdown-trigger" data-target="teams-data-dropdown">
					Teams
					<i class="material-icons right">
						arrow_drop_down
					</i>
				</a>
			</li>
			<li>
				<a @click="gotoScoreboard" class="waves-effect waves-light">
					Scoreboard
				</a>
			</li>
			<li>
				<a class="waves-effect waves-light">
					Admin
				</a>
			</li>
		</ul>
		<!--
		<ul class="right">
			<li>
				<a class="waves-effect waves-light" @click="changeTheme">
					<i :class="buttonStyle">
						highlight
					</i>
				</a>
			</li>
		</ul>
		-->
	</div>
</nav>`,
	data: function() {
		return {
		}
	},
	computed: {
		teams: function() {
			return store.state.teams
		}
	},
	watch: {
		teams: function() {
			var element = document.getElementById('team-search-input-field')
			var instance = M.Autocomplete.getInstance(element)
			var data = {}
			for (let autocompleteOptionIndex in store.state.teams) {
				data[store.state.teams[autocompleteOptionIndex]] = null
			}
			instance.updateData(data)
		}
	},
	methods: {
		getTeamPath: function(index) {
			return '/team/' + index
		},
		showTeamSearch: function() {
			this.$emit('team-search')
		},
		gotoScoreboard: function() {
			this.$router.push('/')
		}
	},
	mounted: function() {
		var element = document.getElementById('team-search-input-field')

		const data = {}
		var instance = M.Autocomplete.init(element, {
			data: data,
			onAutocomplete: function(param) {
				var selectedTeam
				for (let index in store.state.teams) {
					if (store.state.teams[index] === param) {
						selectedTeam = index
					}
				}
	
				element.value = ""
				element.blur()
	
				router.push('/team/'+selectedTeam)
			}
		})

		element.onkeyup = function(e) {
			if (e.code === "Escape") {
				element.blur()
			}
		}

		var elem = document.getElementById('team-dropdown-button');
		const opts = {
			constrainWidth: false,
		}
		var instance = M.Dropdown.init(elem, opts)
	}
})

/* VUE INSTANCE */
var app = new Vue({
	el: '#app',
	router: router,
	data: {
		showSearchPane: false,
		searchFieldCSSClass: "col s6 push-s3 card white accent-4 input-field zdepth-3 scale-transition scale-out",
	},
	methods: {
		showTeamSearch: function() {
			this.searchFieldCSSClass = "col s6 push-s3 card white accent-4 zdepth-3 input-field scale-transition"
			var elem = document.getElementById('team-search-input-field')
			elem.focus()
		},
		hideTeamSearch: function() {
			this.searchFieldCSSClass = "col s6 push-s3 card white accent-4 input-field zdepth-3 scale-transition scale-out"
			document.getElementById('team-search-input-field').value = ""
		}
	},
})

/*
const documentPara = document.querySelector('#description-para')
documentPara.addEventListener('click', updateContent)

function updateContent() {
	let newContent = prompt("Enter new content")
	console.log(app)
	app.data.description = newContent
}
*/

document.addEventListener('DOMContentLoaded', function() {
	Chart.defaults.scale.gridLines.color = '#fafafa'
	Chart.defaults.scale.gridLines.zeroLineColor = '#fafafa'
	Chart.defaults.global.defaultFontColor = '#fafafa'
})
