// Tutorials followed : 
// https://maptimeboston.github.io/leaflet-intro/ 
// https://www.tutorialspoint.com/leafletjs/leafletjs_getting_started.html

// initialize the map
var map = L.map('map').setView([46.5201349,6.6308389], 12); // center on Lausanne region

// load a tile layer
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	attribution: 'Tiles by <a href="http://mapc.org">MAPC</a>, Data by <a href="http://mass.gov/mgis">MassGIS</a>',
	maxZoom: 17,
	minZoom: 9
}).addTo(map);

class MapPlot {

	constructor(svg_element_id) {
		this.svg = d3.select('#' + svg_element_id);

		const all_data = d3.csv("data/cleaned.csv").then((data) => {
			let d = {};
			data.forEach((row) => {
				d[row.i] =  parseFloat(row.t);
			});
			return d;
		});

		const pickup_nodes = d3.csv("data/cleaned.csv").then((data) => {
			let pickupNodes = [];
			var newPickupNode;

			data.forEach((row) => {
				newPickupNode = data[row.pnode];
				if(!pickupNodes.includes(newPickupNode)) {
					console.log("Not contains");
					pickupNodes.push(newPickupNode);
				}
			});
			return pickupNodes;
		});

		Promise.all([all_data, pickup_nodes]).then((results) => {
			let all_unique_pickups = results[1];
			console.log(all_unique_pickups[0]);
		});
	}
}

function whenDocumentLoaded(action) {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", action);
	} else {
		// `DOMContentLoaded` already fired
		action();
	}
}

whenDocumentLoaded(() => {
	plot_object = new MapPlot('map-plot');
	// plot object is global, you can inspect it in the dev-console

});