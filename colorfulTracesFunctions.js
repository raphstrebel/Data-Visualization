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

		// Load the pickup nodes (loaded once even if they appear multiple times)
		const pickup_nodes = d3.csv("data/cleaned.csv").then((data) => {
			let pickupNodes = [];
			var newPickupNode;

			data.forEach((row) => {
				newPickupNode = parseFloat(row.pnode);
				if(!pickupNodes.includes(newPickupNode)) {
					pickupNodes.push(newPickupNode);
				}
			});
			return pickupNodes;
		});

		// Load the dictionary of OSM node ID to long, lat tuple
		var idToLngLat;

		$.getJSON("data/OSMToLatLngDictionary.json", function(json) {
		    //console.log(json); // to get lng lat of point with id 35295132 : json[35295132]
		    idToLngLat = json;
		});

		// Make an Icon
		var myIcon = L.icon({
		    iconUrl: 'redIcon.png',
		    iconSize: [10, 10],
		    //iconAnchor: [22, 94],
		    //popupAnchor: [-3, -76],
		    //shadowUrl: 'my-icon-shadow.png',
		    //shadowSize: [68, 95],
		    //shadowAnchor: [22, 94]
		});


		Promise.all([pickup_nodes]).then((results) => {
			let all_unique_pickups = results[0];
			//console.log(all_unique_pickups.length);
			
			// Show all pickup nodes on the map
			// test marker
			all_unique_pickups.forEach(function(point) {
				console.log(point);
				//if(idToLngLat[point] != nil) {
				if(idToLngLat.hasOwnProperty(point)){
					L.marker([idToLngLat[point][0], idToLngLat[point][1]], {icon: myIcon}).addTo(map);
				}
			});
			//L.marker([idToLngLat[35295132][0], idToLngLat[35295132][1]], {icon: myIcon}).addTo(map);
			//L.marker([idToLngLat[35295132][0], idToLngLat[35295132][1]]).addTo(map);
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