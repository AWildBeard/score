/* ROUTES */
var routes = []

/* GLOBAL ACCESS */
function getDate() {
	const now = new Date(Date.now())
	const hours = now.getHours()
	const minutes = "0" + now.getMinutes()
	return hours + ":" + minutes.substr(-2)
}

var teams = [
	"148.88.1.0/24",
	"148.88.2.0/24",
	"148.88.3.0/24",
	"148.88.4.0/24",
	"148.88.5.0/24",
	"148.88.6.0/24",
	"148.88.7.0/24",
	"148.88.8.0/24",
	"148.88.9.0/24",
]

// Programatically get teams

// Programmatically add team paths & components to router
for (let team in teams) {
	var path = '/team/' + team
	var component = {
		template: `
<div class="col s12">
	<h4 class="center">{{ team }}</h4>
	<div v-for="(data, host) in hosts" class="col s12 m6 l4">
		<div class="card">
			<div class="card-content black-text">
				<span class="card-title center">{{ host }}</span>
				<ul class="collection">
					<li v-for="(value, key) in ports(data.required_ports, data.open_ports)" :class="{ 'collection-item': true, row: true, active: true, red: value === 'closed', green: value === 'open'}">
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
	</div>
</div>
		`,
		data: function() {
			return {
				team: teams[team],
				teamID: team,
				hosts: {
					"148.88.10.1": {
						"required_ports": [
							80,
							443,
							8080
						],
						"open_ports": [
							80
						]
					},
					"148.88.10.2": {
						"required_ports": [
							80,
							443,
							8080
						],
						"open_ports": [
							80
						]
					},
					"148.88.10.3": {
						"required_ports": [
							80,
							443,
							8080
						],
						"open_ports": [
							80
						]
					},
					"148.88.10.4": {
						"required_ports": [
							80,
							443,
							8080
						],
						"open_ports": [
							80
						]
					},
					"148.88.10.5": {
						"required_ports": [
							80,
							443,
							8080
						],
						"open_ports": [
							80
						]
					},
					"148.88.10.6": {
						"required_ports": [
							80,
							443,
							8080
						],
						"open_ports": [
							80
						]
					},
					"148.88.10.7": {
						"required_ports": [
							80,
							443,
							8080
						],
						"open_ports": [
							80
						]
					},
				},
			}
		},
		methods: {
			ports: function(requiredPorts, openPorts) {
				var data = {}
				for (requiredPort in requiredPorts) {
					var found = false
					for (openPort in openPorts) {
						if (requiredPorts[requiredPort] === openPorts[openPort]) {
							found = true
							data[requiredPorts[requiredPort]] = 'open'
							break
						}
					}

					if (!found) {
						data[requiredPorts[requiredPort]] = 'closed'
					}
				}

				return data
			},
		}
	}

	var newRoute = {
		path: path,
		component: component,
	}

	routes.push(newRoute)
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
	mounted: function () {
		var date = getDate()
		var dataset = []
		for (let teamIndex in teams) {
			let newData = {
				label: teams[teamIndex],
				borderColor: '#'+Math.floor(Math.random()*16777215).toString(16),
				fill: false,
				data: [Math.floor(Math.random()*10),Math.floor(Math.random()*10),Math.floor(Math.random()*10),]
			}
			dataset.push(newData)
		}

		const elem = document.getElementById('mainTeamComparisonChart')
		this.graph = new Chart(elem, {
			type: 'line',
			data: {
				labels: [date, "22:30", "23:00"],
				datasets: dataset,
			},
			options: {
				defaultFontColor: '#fafafa',
				scales: {
					yAxes: [{
						gridLines: {
							display: false,
						},
					}],
					xAxes: [{
						gridLines: {
							color: '#fafafa',
							zeroLineColor: '#fafafa'
						}
					}]
				}
			}
		})
	},
}

routes.push({ path: '/', component: scoreboard, })

const fourohfour = {
	template: `
<div class="col s12">
	<h1 class="center">Page not found!</h1>
</div>
`
}

routes.push({ path: '*', component: fourohfour, })
/* ROUTER */
const router = new VueRouter({
	routes: routes
})

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
			teams: teams
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
		var elem = document.getElementById('team-dropdown-button');
		const opts = {
			constrainWidth: false,
		}
		var instance = M.Dropdown.init(elem, opts)
	}
})

Vue.component('search-bar', {

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
	var element = document.getElementById('team-search-input-field')

	const data = {}
	for (let autocompleteOptionIndex in teams) {
		data[teams[autocompleteOptionIndex]] = null
	}

	var instance = M.Autocomplete.init(element, {
		data: data,
		onAutocomplete: function(param) {
			var selectedTeam
			for (let index in teams) {
				if (teams[index] === param) {
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

	Chart.defaults.scale.gridLines.color = '#fafafa'
	Chart.defaults.scale.gridLines.zeroLineColor = '#fafafa'
	Chart.defaults.global.defaultFontColor = '#fafafa'
})
