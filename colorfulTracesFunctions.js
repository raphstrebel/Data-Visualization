// Tutorials followed :
// https://maptimeboston.github.io/leaflet-intro/
// https://www.tutorialspoint.com/leafletjs/leafletjs_getting_started.html
// Course exercises
// http://bl.ocks.org/WilliamQLiu/76ae20060e19bf42d774
// http://bl.ocks.org/d3noob/a22c42db65eb00d4e369

// global variable
const normalNodeRadius = 3;
const pathNodeRadius = 2;
const width = 1000;
const height = 700;
const margin = 5;
var svg;
var div;
var canvas;

// database and userful dictionaries
var database;
var osmToLatLng;
var osmToOccurences;
var pickupNodes;
var dropoffNodes;
var pickupToNbPickups;
var dropoffToNbDropoffs;

// network scales
var scaleX;
var scaleY;

// map variables
var infoMap;
var marker;

// Brushing
let brush = d3.brush().on("end", brushended),
		idleTimeout,
		idleDelay = 350;

// ----------------------------------------- MOUSE HANDLERS -----------------------------------------

function handleDropoffMouseOver(node) {

	let nodeID;

	if(node["dnode"] != null) {
		nodeID = node["dnode"];
	} else {
		nodeID = node;
	}

	div.transition().style("opacity", .9);
	div.html(" occurences : " + osmToOccurences[nodeID] + "<br>" + " dropoffs : " + dropoffToNbDropoffs[nodeID])
		.style("left", (d3.event.pageX) + "px")
		.style("top", (d3.event.pageY - 28) + "px");
}

function handlePickupMouseOver(node) {

	let nodeID;

	if(node["pnode"] != null) {
		nodeID = node["pnode"];
	} else {
		nodeID = node;
	}

	div.transition().style("opacity", .9);
	div.html(" occurences : " + osmToOccurences[nodeID] + "<br>" + " pickups : " + pickupToNbPickups[nodeID])
		.style("left", (d3.event.pageX) + "px")
		.style("top", (d3.event.pageY - 28) + "px");
}

// make info box dissapear (slowly)
function handleMouseOut() {
	div.transition()
	.duration(500)
	.style("opacity", 0);
}

function handleDropoffMouseClick(node) {
	handleMouseOut();
	hide(".Pickup");
	hide(".Dropoff");
	hide(".Path");

	var nodeID;

	if(node["dnode"] != null) {
		nodeID = node["dnode"];
	} else {
		nodeID = node;
	}

	/* show all paths from this node */
	let paths = getPathsToNode(nodeID);

	drawPaths(paths, nodeID);

	// Show node on map (in information section)
	showNodeOnMap(nodeID, "Dropoff");
}

function handlePickupMouseClick(node) {
	handleMouseOut();
	hide(".Pickup");
	hide(".Dropoff");
	hide(".Path");

	if(node["pnode"] != null) {
		nodeID = node["pnode"];
	} else {
		nodeID = node;
	}

	// show all paths from this node
	let paths = getPathsFromNode(nodeID);

	drawPaths(paths, nodeID);

	// Show node on map (in information section)
	showNodeOnMap(nodeID, "Pickup");
}

function handleLegendDropoffClick(){
	hide(".Pickup");
	hide(".Path");
	showAllDropoffNodes();
}

function handleLegendPickupClick(){
	hide(".Dropoff");
	hide(".Path");
	showAllPickupNodes();
}

function handleLegendPickupAndDropoffClick(){
	hide(".Path");
	showAllDropoffNodes();
	showAllPickupNodes();
}

// ----------------------------------------- SHOWING POINTS -----------------------------------------

function hide(nodeClass) {
	canvas.selectAll(nodeClass).remove();
}

function hideAllPickupNodes() {
	canvas.selectAll(".Pickup").data(pickupNodes).exit().remove();
}

function showAllDropoffNodes() {
	canvas.selectAll(".Dropoff")
		.data(dropoffNodes)
			.enter()
			//Dropoff in blue
				.append("circle")
				.attr("class", "Dropoff")
				.attr("r" , normalNodeRadius)
				.attr("transform", function(d) {
					return "translate("+scaleX(Number(osmToLatLng[d["dnode"]][1]))+","+ scaleY(Number(osmToLatLng[d["dnode"]][0]))+")";
				})
				.attr("fill", "blue")
				.style("opacity", 0)
				.on("mouseover", handleDropoffMouseOver)
				.on("mouseout", handleMouseOut)
				.on("click", handleDropoffMouseClick)
				.transition()
				.duration(1000)
				.delay(function(d,i){ return 10*i * (1 / 4); })
				.style("opacity", 1);
}

function showAllPickupNodes() {
	canvas.selectAll(".Pickup")
		.data(pickupNodes)
			.enter()
			//Pickup in red
				.append("circle")
				.attr("class", "Pickup")
				.attr("r" , normalNodeRadius)
				.attr("transform", function(d) {
					return "translate("+scaleX(Number(osmToLatLng[d["pnode"]][1]))+","+ scaleY(Number(osmToLatLng[d["pnode"]][0]))+")";
				})
				.attr("fill", "red")
				.style("opacity", 0)
				.on("mouseover", handlePickupMouseOver)
				.on("mouseout", handleMouseOut)
				.on("click", handlePickupMouseClick)
				.transition()
				.duration(1000)
				.delay(function(d,i){ return 100*i * (1 / 4); })
				.style("opacity", 1);

}

function drawPaths(paths, nodeID) {

	canvas.selectAll(".Path")
		.data(paths)
		.enter()
		.append("g")
			.attr("class", "Path")
			.on("mouseover", doNothing)
			.selectAll(".Nodepath")
			.data(function(d){
				return JSON.parse(d["road"]);
			})
			.enter()
			.append("circle")
				.attr("fill", function(d){
					// Selected node in black
					if (d == nodeID){
						return "black"
					} else if (pickupNodesSet.has(d)){
						return "red";
					} else if (dropOffNodesSet.has(d)){
						return "blue";
					} else {
						return "green";
					}
				})
				.attr("class", function(d){
					if (d == nodeID){
						return "Selected"
					} else if (pickupNodesSet.has(d)){
						return "Pickup";
					} else if (dropOffNodesSet.has(d)){
						return "Dropoff";
					} else {
						return "NodepathOnly";
					}
				})
				.attr("r", function(d){
					if (d == nodeID){
						return pathNodeRadius + 1
					} else if (pickupNodesSet.has(d) || dropOffNodesSet.has(d)){
						return normalNodeRadius;
					} else {
						return pathNodeRadius;
					}
				})
				.on("mouseover", function(d){
					if (pickupNodesSet.has(d)) {
						return handlePickupMouseOver(d);
					} else if(dropOffNodesSet.has(d)) {
						return handleDropoffMouseOver(d);
					} else {
						return doNothing();
					}
				})
				.on("mouseout", function(d){
					if (pickupNodesSet.has(d) || dropOffNodesSet.has(d)){
						return handleMouseOut();
					} else {
						return doNothing();
					}
				})
				.on("click", function(d){
					if (pickupNodesSet.has(d)){
						return handlePickupMouseClick(d);
					} else if (dropOffNodesSet.has(d)){
						return handleDropoffMouseClick(d);
					} else {
						return doNothing();
					}
				})
				.attr("transform", function(d) {
					return "translate("+scaleX(Number(osmToLatLng[d][1]))+","+ scaleY(Number(osmToLatLng[d][0]))+")";
				})
				.style("opacity", 0)
				.transition()
				//.duration(1000*Math.log(paths.length))
				.delay(function(d,i){ return 50*i * (1 / 4); })
				.style("opacity", 1);

	d3.selection.prototype.moveUp = function() {
		return this.each(function() {
			this.parentNode.appendChild(this);
		});
	};

	canvas.selectAll(".Dropoff").moveUp();
	canvas.selectAll(".Pickup").moveUp();
	canvas.selectAll(".Selected").moveUp();
}

// ----------------------------------------- HELPFUL FUNCTIONS -----------------------------------------

function doNothing(){}

function whenDocumentLoaded(action) {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", action);
	} else {
		// `DOMContentLoaded` already fired
		action();
	}
}

function getPathsFromNode(nodeID) {

	let toReturn = [];

	database.forEach((row) => {
		if(nodeID == row.pnode) {
			toReturn.push(row);
		}
	});

	return toReturn;
}

function getPathsToNode(nodeID) {
	let toReturn = [];

	database.forEach((row) => {
		if(nodeID == row.dnode) {
			toReturn.push(row);
		}
	});

	return toReturn;
}

// ----------------------------------------- INFO MAP -----------------------------------------

function initializeMap() {
	// set map
	infoMap = L.map('infoMap', {attributionControl: false})

	// load a tile layer
	L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: 'Tiles by <a href="http://mapc.org">MAPC</a>, Data by <a href="http://mass.gov/mgis">MassGIS</a>',
		minZoom: 10,
		maxZoom: 17
	}).addTo(infoMap);

	// disable all map features
	//infoMap.dragging.disable();
	infoMap.touchZoom.disable();
	infoMap.doubleClickZoom.disable();
	infoMap.scrollWheelZoom.disable();
	infoMap.boxZoom.disable();
	infoMap.keyboard.disable();
	infoMap.removeControl(infoMap.zoomControl);

	// set cursor to default
	//document.getElementById('infoMap').style.cursor='default';
}

function showNodeOnMap(nodeID, nodeClass) {
	var nodeLat;
	var nodeLng;

	switch(nodeClass) {
		case "Pickup":
			nodeLat = Number(osmToLatLng[nodeID][0]);
			nodeLng = Number(osmToLatLng[nodeID][1]);
			break;
		case "Dropoff":
			nodeLat = Number(osmToLatLng[nodeID][0]);
			nodeLng = Number(osmToLatLng[nodeID][1]);
			break;
		default:
			break;
	}

	if(marker != null) {
		infoMap.removeLayer(marker);
	}

	// center map on node
	infoMap.setView([nodeLat, nodeLng], 15);

	// add marker for node on map
	marker = L.marker([nodeLat, nodeLng]).addTo(infoMap);
}

function centerInfoMap(lngL, lngR, latU, latD) {
	infoMap.fitBounds([
	    [latU, lngL],
	    [latD, lngR]
	]);
}

// ----------------------------------------- BRUSHING -----------------------------------------

function brushended() {
	var s = d3.event.selection;
	if (!s) {
		if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay);
		scaleX.domain(x0);
    	scaleY.domain(y0);
  	} else {
	    scaleX.domain([s[0][0], s[1][0]].map(scaleX.invert, scaleX));
	    scaleY.domain([s[1][1], s[0][1]].map(scaleY.invert, scaleY));
	    canvas.select(".brush").call(brush.move, null);
  	}
	zoom();

	[lngL, lngR] = [s[0][0], s[1][0]].map(scaleX.invert, scaleX);
	[latU, latD] = [s[1][1], s[0][1]].map(scaleY.invert, scaleY);

	centerInfoMap(lngL, lngR, latU, latD);
}


function idled() {
  idleTimeout = null;
}

function zoom() {
	//console.log("Hello")
  var t = canvas.transition().duration(750);
  canvas.selectAll("circle").transition(t)
			.attr("transform", function(d){
				//console.log(d)
				if(!d){
					return
				}
				if (d.hasOwnProperty("dnode")){
					nodeId = d["dnode"]
				} else if (d.hasOwnProperty("pnode")) {
					nodeId = d["pnode"]
				} else {
					nodeId = d
				}

				return "translate("+scaleX(Number(osmToLatLng[nodeId][1]))+","+ scaleY(Number(osmToLatLng[nodeId][0]))+")";


			})
}

// ----------------------------------------- ON DOCUMENT LOAD -----------------------------------------

whenDocumentLoaded(() => {

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

    // initalize map centered on lausanne region
	initializeMap();
	infoMap.setView([46.5201349,6.6308389], 12);

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

	const pickupToNbPickups_promise = $.getJSON("data/pickupToNbPickups.json", function(json){}).then((data) => {
		return data;
	});

	const dropoffToNbDropoffs_promise = $.getJSON("data/dropoffToNbDropoffs.json", function(json){}).then((data) => {
		return data;
	});

	// promise for database and osmID to lat and lng dictionary
	Promise.all([database_promise, osmToLatLng_promise, pickupNodes_promise, dropoffNodes_promise, osmToOccurences_promise, pickupToNbPickups_promise, dropoffToNbDropoffs_promise]).then((results) => {

		// get all variables from promises
		database = results[0];
		osmToLatLng = results[1];
		pickupNodes = results[2];
		dropoffNodes = results[3];
		osmToOccurences = results[4];
		pickupToNbPickups = results[5];
		dropoffToNbDropoffs = results[6];

		// Create sets : useful to test if a particular node id is contained in set
		pickupNodesSet = new Set();
		dropOffNodesSet = new Set();

		pickupNodes.forEach(function(n){
			pickupNodesSet.add(Number(n["pnode"]));
		})

		dropoffNodes.forEach(function(n){
			dropOffNodesSet.add(Number(n["dnode"]));
		})

		// find the domain
		let minLng = d3.min(database, (d) => d3.min([osmToLatLng[d["pnode"]][1],osmToLatLng[d["dnode"]][1]]));
		let maxLng = d3.max(database, (d) => d3.max([osmToLatLng[d["pnode"]][1],osmToLatLng[d["dnode"]][1]]));

		let minLat = d3.min(database, (d) => d3.min([osmToLatLng[d["pnode"]][0],osmToLatLng[d["dnode"]][0]]));
		let maxLat = d3.max(database, (d) => d3.max([osmToLatLng[d["pnode"]][0],osmToLatLng[d["dnode"]][0]]));

		x0 = [minLng, maxLng]
		y0 = [minLat, maxLat]
		// Define the scale
		scaleX = d3.scaleLinear()
			.domain(x0)
			.range([margin, width]);

		scaleY = d3.scaleLinear()
			.domain(y0)
			.range([height, margin]);

		// show pickup and dropoffs
		showAllDropoffNodes();
		showAllPickupNodes();

	    // legend for pickup
		let legend_spacing = 7;
		let legendRadius = 5;

		canvas.append("circle")
			.attr("id", "legend_pickup")
			.attr("cx", margin)
			.attr("cy", margin)
			.attr("r", legendRadius)
			.attr("fill", "red")
			.on("click", handleLegendPickupClick);

		canvas.append("text")
			.attr("x", margin + legendRadius + 3)
			.attr("y", margin + legendRadius)
			.text("pickup")
			.on("click", handleLegendPickupClick);

		// legend for dropoff
		canvas.append("circle")
			.attr("id", "legend_dropoff")
			.attr("cx", margin)
			.attr("cy", margin + 2* legendRadius + legend_spacing)
			.attr("r", legendRadius)
			.attr("fill", "blue")
			.on("click", handleLegendDropoffClick);


		canvas.append("text")
			.attr("x", margin + legendRadius + 3)
			.attr("y", margin + 3* legendRadius + legend_spacing )
			.text("dropoff")
			.on("click", handleLegendDropoffClick);

		// legend for both pickup and dropoff
		canvas.append("circle")
			.attr("id", "legend_pickup_dropoff")
			.attr("cx", margin)
			.attr("cy", margin + 4* legendRadius + 2* legend_spacing)
			.attr("r", legendRadius-1)
			.style("stroke-width", 2)    // set the stroke width
		    .style("stroke", "red")      // set the line colour
		    .style("fill", "blue")
			.on("click", handleLegendPickupAndDropoffClick);

		canvas.append("text")
			.attr("x", margin + legendRadius + 3)
			.attr("y", margin + 5* legendRadius + 2*legend_spacing )
			.text("pickup and dropoff")
			.on("click", handleLegendPickupAndDropoffClick);

		// legend for path
		canvas.append("circle")
			.attr("id", "legend_path")
			.attr("cx", margin)
			.attr("cy", margin + 6* legendRadius + 3*legend_spacing)
			.attr("r", legendRadius)
			.attr("fill", "green");

		canvas.append("text")
			.attr("x", margin + legendRadius + 3)
			.attr("y", margin + 7* legendRadius + 3*legend_spacing )
			.text("path node")
			//.on("click", handleLegendPathClick);
		});

		svg.selectAll(".domain")
		    .style("display", "none");


		canvas.append("g")
			.attr("class", "brush")
			.call(brush);
});
