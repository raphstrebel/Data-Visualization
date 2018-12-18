// Tutorials followed :
// https://maptimeboston.github.io/leaflet-intro/
// https://www.tutorialspoint.com/leafletjs/leafletjs_getting_started.html
// Course exercises
// http://bl.ocks.org/WilliamQLiu/76ae20060e19bf42d774
// http://bl.ocks.org/d3noob/a22c42db65eb00d4e369



/*class MapPlot {

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
		    iconUrl: 'images/redIcon.png',
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
		    iconUrl: 'images/blueIcon.png',
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
			});/
		});
	}
}*/

// global variable
const radius = 5;
const width = 1000;
const height = 700;
const margin = 5;
var svg;
var div;
var canvas;
var database;
var osmToLatLng;
var osmToOccurences;
var pickupNodes;
var dropoffNodes;
var scaleX;
var scaleY;



function whenDocumentLoaded(action) {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", action);
	} else {
		// `DOMContentLoaded` already fired
		action();
	}
}

function getPathsFromNode(node) {

	let toReturn = [];

//	console.log(typeof osmToLatLng[node["pnode"]][0]);
	database.forEach((row) => {
		if(node["pnode"] === row.pnode) {
			toReturn.push(row);
		}
	});

	return toReturn;
}


/*function getPickupAndDropoffNodes(data) {
	let pickupNodes = [];
	var newPickupNode;

	let dropoffNodes = [];
	var newDropoffNode;

	data.forEach((row) => {
		newPickupNode = {
			lat: parseFloat(row.plat),
			lng: parseFloat(row.plng)
		};

		// comparison doesn't work, adds all nodes
		if(!pickupNodes.includes(newPickupNode)) {
			pickupNodes.push(newPickupNode);
		}

		newDropoffNode = {
			lat: parseFloat(row.dlat),
			lng: parseFloat(row.dlng)
		};

		if(!dropoffNodes.includes(newDropoffNode)) {
			dropoffNodes.push(newDropoffNode);
		}
	});

	return {
	    Pickup: pickupNodes,
	    Dropoff: dropoffNodes
	};
}*/

// make small box with info on node
function handleDropoffMouseOver(d) {

	div.transition().style("opacity", .9);

	div.html(osmToOccurences[d["dnode"]])
		.style("left", (d3.event.pageX) + "px")
		.style("top", (d3.event.pageY - 28) + "px");
}

function handlePickupMouseOver(d) {

	div.transition().style("opacity", .9);

	div.html(osmToOccurences[d["pnode"]])
		.style("left", (d3.event.pageX) + "px")
		.style("top", (d3.event.pageY - 28) + "px");
}

// make info box dissapear (slowly)
function handleMouseOut(d) {
	div.transition()
	.duration(500)
	.style("opacity", 0);
}

function hide(nodeClass) {
	canvas.selectAll(nodeClass).remove();
}

function hideAllPickupNodes(d) {
	canvas.selectAll(".Pickup").data(pickupNodes).exit().remove();
}

/*function hideAllNodes(d) {
	canvas.selectAll("g").data(d).exit().remove();
}

function hideAllNodes() {
	canvas.selectAll("g").remove();
}*/
function doSomeThing(d){
	console.log(d);
}

function handlePickupMouseClick(node) {



	handleMouseOut(node);
	hide(".Pickup");
	hide(".Dropoff");


	/* show all paths from this node */
	let paths = getPathsFromNode(node);

	console.log(paths);

	canvas.selectAll(".Path")
		.data(paths)
		.enter()
		.append("g")
			.attr("class", "Path")
			.on("mouseover", doSomeThing)
			.selectAll(".NodePath")
			.data(function(d){
				//console.log(d["road"]);

				return JSON.parse(d["road"]);
				/*
				return {
					road : JSON.parse(d["road"]),
					dnode : d["dnode"]
				};*/
			}).enter()
			.append("circle")
				.attr("fill", "green") /*function(d){
					console.log(d);
					//console.log(d.dnode);
					if (d != 1){
						return "green";
					}
					else {
						return "blue";
					}
				})*/
				.attr("r", radius)
				.attr("transform", function(d) {
					return "translate("+scaleX(Number(osmToLatLng[d][1]))+","+ scaleY(Number(osmToLatLng[d][0]))+")";
				});

	// must show all nodes of these paths
	// the paths are in "osmID" so we must use "OSMToLatLngDictionary" to convert them


	// EVERY THING BREAKS DOWN TO CONSTRUCTING THIS METHOD : showNode(node), who should draw node on the network (keeping the other ones visible)

}

/*function showNode(node) {
	canvas.selectAll("g")
		.append("g")
			.append("circle")
			.attr("r" , radius)
			.attr("transform", "translate("+scaleX(node.lng)+","+ scaleY(node.lat)+")")
			.attr("fill", "green")
			.on("mouseover", handleDropoffMouseOver)
			.on("mouseout", handleMouseOut);
}*/

function showAllDropoffNodes() {
	canvas.selectAll(".Dropoff")
			.data(dropoffNodes)
				.enter()
				//Dropoff in blue
					.append("circle")
					.attr("class", "Dropoff")
					.attr("r" , radius)
					.attr("transform", function(d) {
						return "translate("+scaleX(Number(osmToLatLng[d["dnode"]][1]))+","+ scaleY(Number(osmToLatLng[d["dnode"]][0]))+")";
					})
					.attr("fill", "blue")
					.on("mouseover", handleDropoffMouseOver)
					.on("mouseout", handleMouseOut);
}

function showAllPickupNodes() {
	canvas.selectAll(".Pickup")
			.data(pickupNodes)
				.enter()
				//Pickup in red
					.append("circle")
					.attr("class", "Pickup")
					.attr("r" , radius)
					.attr("transform", function(d) {
						return "translate("+scaleX(Number(osmToLatLng[d["pnode"]][1]))+","+ scaleY(Number(osmToLatLng[d["pnode"]][0]))+")";
					})
					.attr("fill", "red")
					.on("mouseover", handlePickupMouseOver)
					.on("mouseout", handleMouseOut)
					.on("click", handlePickupMouseClick);
}

function handleLegendDropoffClick(){
	hide(".Pickup");
	showAllDropoffNodes();
}

function handleLegendPickupClick(){
	hide(".Dropoff");
	showAllPickupNodes();
}

function handleLegendPickupAndDropoffClick(){
	showAllDropoffNodes();
	showAllPickupNodes();
}

whenDocumentLoaded(() => {

	/* UNCOMMENT THIS TO SEE THE MAP
	// initialize the map
	var map = L.map('map').setView([46.5201349,6.6308389], 12); // center on Lausanne region

	// load a tile layer
	L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: 'Tiles by <a href="http://mapc.org">MAPC</a>, Data by <a href="http://mass.gov/mgis">MassGIS</a>',
		maxZoom: 17,
		minZoom: 12
	}).addTo(map);


	plot_object = new MapPlot('map-plot');

	*/


	// scale
	let sacleMode = d3.scaleLinear()


	// projection
	let projection = d3.geoMercator()

	canvas = d3.select("#network")
		.attr("width", width + margin)
		.attr("height", height + margin);

	// Adds the svg canvas
	svg = d3.select("body")
	    .append("svg")
	        .attr("width", width + margin)
	        .attr("height", height + margin)
	    .append("g")
	        .attr("transform",
	              "translate(" + margin + "," + margin + ")");

	div = d3.select("body").append("div")
	    .attr("class", "infoBox")
	    .style("opacity", 0);


	// Load the database
	const database_promise = d3.csv("data/cleaned.csv").then( (data) => {
		return data;
	});

	// Load the dictionary of OSM node ID to number of occurences of this node
	const osmToLatLng_promise = $.getJSON("data/OSMToLatLngDictionary.json", function(json){}).then((data) => {
		return data;
	});

	// Load the list of pickup nodes
	const pickupNodes_promise = d3.csv("data/pickupNodes.csv").then( (data) => {
		return data;
	});

	// Load the list of pickup nodes
	const dropoffNodes_promise = d3.csv("data/dropoffNodes.csv").then( (data) => {
		return data;
	});

	const osmToOccurences_promise = $.getJSON("data/nodesToOccurences.json", function(json){}).then((data) => {
		return data;
	});

	// promise for database and osmID to lat and lng dictionary
	Promise.all([database_promise, osmToLatLng_promise, pickupNodes_promise, dropoffNodes_promise, osmToOccurences_promise]).then((results) => {

		database = results[0];
		osmToLatLng = results[1];
		pickupNodes = results[2];
		dropoffNodes = results[3];
		osmToOccurences = results[4];

		// Creating the scale

		// find the domain
		let minLng = d3.min(database, (d) => d3.min([osmToLatLng[d["pnode"]][1],osmToLatLng[d["dnode"]][1]]));
		let maxLng = d3.max(database, (d) => d3.max([osmToLatLng[d["pnode"]][1],osmToLatLng[d["dnode"]][1]]));

		let minLat = d3.min(database, (d) => d3.min([osmToLatLng[d["pnode"]][0],osmToLatLng[d["dnode"]][0]]));
		let maxLat = d3.max(database, (d) => d3.max([osmToLatLng[d["pnode"]][0],osmToLatLng[d["dnode"]][0]]));

		// Define the scale
		scaleX = d3.scaleLinear()
			.domain([minLng, maxLng])
			.range([margin, width]);

		scaleY = d3.scaleLinear()
			.domain([minLat, maxLat])
			.range([height, margin]);

		showAllDropoffNodes();
		showAllPickupNodes();



	    // legend for pickup
		let legend_spacing = 7;

		canvas.append("circle")
				.attr("id", "legend_pickup")
				.attr("cx", margin)
				.attr("cy", margin)
				.attr("r", radius)
				.attr("fill", "red")
				.on("click", handleLegendPickupClick);

		canvas.append("text")
			.attr("x", margin + radius + 3)
			.attr("y", margin + radius)
			.text("pickup")
			.on("click", handleLegendPickupClick);

		// legend for dropoff
		canvas.append("circle")
			.attr("id", "legend_dropoff")
			.attr("cx", margin)
			.attr("cy", margin + 2* radius + legend_spacing)
			.attr("r", radius)
			.attr("fill", "blue")
			.on("click", handleLegendDropoffClick);


		canvas.append("text")
			.attr("x", margin + radius + 3)
			.attr("y", margin + 3* radius + legend_spacing )
			.text("dropoff")
			.on("click", handleLegendDropoffClick);



		// legend for both pickup and dropoff
		canvas.append("circle")
			.attr("id", "legend_pickup_dropoff")
			.attr("cx", margin)
			.attr("cy", margin + 4* radius + 2* legend_spacing)
			.attr("r", radius-1)
			.style("stroke-width", 2)    // set the stroke width
		    .style("stroke", "red")      // set the line colour
		    .style("fill", "blue")
				.on("click", handleLegendPickupAndDropoffClick);


		canvas.append("text")
			.attr("x", margin + radius + 3)
			.attr("y", margin + 5* radius + 2*legend_spacing )
			.text("pickup and dropoff")
			.on("click", handleLegendPickupAndDropoffClick);

			// legend for path
		canvas.append("circle")
				.attr("id", "legend_path")
				.attr("cx", margin)
				.attr("cy", margin + 6* radius + 3*legend_spacing)
				.attr("r", radius)
				.attr("fill", "green");


			canvas.append("text")
				.attr("x", margin + radius + 3)
				.attr("y", margin + 7* radius + 3*legend_spacing )
				.text("path node")
				//.on("click", handleLegendDropoffClick);
		});
});



		/*
		group.updade()
			.append("circle")
			.attr("r" , radius)
			.attr("transform", function(d) {
				return "translate("+scaleX(d.plng)+","+ scaleY(d.plat)+")";
			})
			.attr("fill", "red");
*/


					//.fill("red")



	//console.log(max)



	//map.dragging.disable();
	// plot object is global, you can inspect it in the dev-console
