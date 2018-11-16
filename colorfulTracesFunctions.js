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
				d[row.code] =  parseFloat(row.density);
			});
			return d;
		});

		Promise.all([all_data]).then((results) => {
			let a = results[0];
			console.log(a);
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