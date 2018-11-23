// Tutorials followed : 
// https://maptimeboston.github.io/leaflet-intro/ 
// https://www.tutorialspoint.com/leafletjs/leafletjs_getting_started.html

// initialize the map
var map = L.map('map').setView([46.5201349,6.6308389], 12); // center on Lausanne region

// load a tile layer
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	attribution: 'Tiles by <a href="http://mapc.org">MAPC</a>, Data by <a href="http://mass.gov/mgis">MassGIS</a>',
	maxZoom: 17,
	minZoom: 12
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
		const pickup_and_dropoff_nodes_promise = d3.csv("data/cleaned.csv").then((data) => {
			let pickupNodes = [];
			var newPickupNode;

			let dropoffNodes = [];
			var newDropoffNode;

			data.forEach((row) => {
				newPickupNode = parseFloat(row.pnode);
				if(!pickupNodes.includes(newPickupNode)) {
					pickupNodes.push(newPickupNode);
				}

				newDropoffNode = parseFloat(row.dnode);
				if(!dropoffNodes.includes(newDropoffNode)) {
					dropoffNodes.push(newDropoffNode);
				}
			});

			return {
		        Pickup: pickupNodes,
		        Dropoff: dropoffNodes
		    };;
		});

		// Load the dictionary of OSM node ID to (long, lat) tuple
		const node_id_to_coordinate_promise = $.getJSON("data/OSMToLatLngDictionary.json", function(json) {}).then((data) => {
			return data;
		});

		// Load the dictionary of OSM node ID to number of occurences of this node
		const node_id_to_occurences_promise = $.getJSON("data/nodesToOccurences.json", function(json){}).then((data) => {
			return data;
		});


		// Make the pickup Icon
		var pickupIcon = L.icon({
		    iconUrl: 'redIcon.png',
		    iconSize: [10, 10],
		    //iconAnchor: [22, 94],
		    //popupAnchor: [-3, -76],
		    //shadowUrl: 'my-icon-shadow.png',
		    //shadowSize: [68, 95],
		    //shadowAnchor: [22, 94]
		    //riseOnHover: true,
		});

		// Make the pickup Icon
		var dropoffIcon = L.icon({
		    iconUrl: 'blueIcon.png',
		    iconSize: [10, 10],
		});


		Promise.all([pickup_and_dropoff_nodes_promise, node_id_to_coordinate_promise, node_id_to_occurences_promise]).then((results) => {
			let pickup_nodes = results[0].Pickup;
			let dropoff_nodes = results[0].Dropoff;
			let node_id_to_coordinate = results[1]
			let node_id_to_occurences = results[2];
			const all_nodes = Object.keys(node_id_to_occurences);

			// Show all dropoff nodes on the map
			dropoff_nodes.forEach(function(point) {
				if(node_id_to_coordinate.hasOwnProperty(point)){
					L.marker([node_id_to_coordinate[point][0], node_id_to_coordinate[point][1]], {icon: dropoffIcon}).addTo(map);
				}
			});

			// Display pickup nodes after 2 seconds
			setTimeout(showPickupNodes, 2000);

			// Show all pickup nodes on the map
			function showPickupNodes() {
				pickup_nodes.forEach(function(point) {
					if(node_id_to_coordinate.hasOwnProperty(point)){
						L.marker([node_id_to_coordinate[point][0], node_id_to_coordinate[point][1]], {icon: pickupIcon}).addTo(map).setZIndexOffset(1000);;
					}
				}); 
			}


			/* Too slow to load all nodes

			all_nodes.forEach(function(point) {
				if(idToLngLat.hasOwnProperty(point)) {
					L.marker([idToLngLat[point][0], idToLngLat[point][1]]).addTo(map);
				}
			});*/
		});
	}
}

function test() {
	console.log("hey man");
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
	//map.dragging.disable();
	// plot object is global, you can inspect it in the dev-console

});