
// ----------------------------------------- Global Variables ----------------------------------------

brushFinished = {
	aInternal: false,
	aListener: function(val) {},
	set a(val) {
			this.aInternal = val;
			this.aListener(val);
	},
	get a() {
		return this.aInternal;
	},
	registerListener: function(listener) {
		this.aListener = listener;
	}
}

brushFinished.registerListener(function(val) {
	setTimeout(function() {
		allNodesInBrushing = getNodesInBrush();
		console.log("dropoffs in area : " + allNodesInBrushing.Dropoff);
	console.log("number of dropoffs : " + allNodesInBrushing.Dropoff.length);
	}, 1500);
});

// global constants
const normalNodeRadius = 3;
const pathNodeRadius = 2;

const margin = 5;
const maxOccurence = 1103;
const legendRadius = 5;
const radius = 5;
const MIN_WIDTH = 500;
const MIN_HEIGHT = 400;

// visualization tools and networks
var svg;
var div;
var interactiveNetwork;
var blackLightningNetwork;
var blackLightningNetworkSVG;

// database and useful dictionaries
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
let brush = d3.brush().on("end", brushended);

let idleTimeout;
let	idleDelay = 350;

/* slider variables
var slider;
var handle;
var label;
var x;*/

// Selection is important for the kind of stats we want to see
let selection = "appear";

// Used to know when to load or not the nodes
appeared = false;


let width = MIN_WIDTH;
let height = MIN_HEIGHT;

var linearBlackLighteningScale = d3.scaleLinear()
	.domain([0, 40])
   	.range(["#112231","#3C769D"]);



// ----------------------------------------- Stats selection ----------------------------------------

function changeStats(mode, elem){
	console.log(mode)
	console.log(elem)
}

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
	//changeStats("node", node);
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
	interactiveNetwork.selectAll(nodeClass).remove();
}

function hideAllPickupNodes() {
	interactiveNetwork.selectAll(".Pickup").data(pickupNodes).exit().remove();
}

function showAllDropoffNodes() {
	interactiveNetwork.selectAll(".Dropoff")
		.data(dropoffNodes)
			.enter()
			//Dropoff in blue
				.append("circle")
				.attr("class", "Dropoff")
				.attr("r" , normalNodeRadius)
				.attr("id", function(d){return d["dnode"];})
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
				.delay(function(d,i){ return 2*i; })
				.style("opacity", 1);
}

function showAllPickupNodes() {
	interactiveNetwork.selectAll(".Pickup")
		.data(pickupNodes)
			.enter()
			//Pickup in red
				.append("circle")
				.attr("class", "Pickup")
				.attr("r" , normalNodeRadius)
				.attr("id", function(d){return d["pnode"];})
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
				.delay(function(d,i){ return 25*i; })
				.style("opacity", 1);
}

function drawControls(){


	control = d3.select("#control")
		.attr("width", width)
		.attr("height", 15)

	control.selectAll("*").remove()


		// legend for pickup
	let legend_spacing = width/4;
	let legend_text_extra_spacing = 6
	let marginTop = 6;

	control.append("circle")
		.attr("id", "legend_pickup")
		.attr("class", "Legend")
		.attr("cx", 2*margin + 0*legend_spacing +4)
		.attr("cy", marginTop)
		.attr("r", legendRadius)
		.attr("fill", "red")
		.on("click", handleLegendPickupClick);

	control.append("text")
		.attr("x", 2*margin + 0*legend_spacing + radius + 4)
		.attr("y", marginTop + legend_text_extra_spacing )
		.text("pickup")
		.attr("class", "Legend")
		.on("click", handleLegendPickupClick);

	// legend for dropoff
	control.append("circle")
		.attr("id", "legend_dropoff")
		.attr("cx", margin + 1*legend_spacing)
		.attr("cy", marginTop)
		.attr("r", legendRadius)
		.attr("fill", "blue")
		.attr("class", "Legend")
		.on("click", handleLegendDropoffClick);


	control.append("text")
		.attr("x", margin + 1 *legend_spacing + radius)
		.attr("y", marginTop + legend_text_extra_spacing)
		.text("dropoff")
		.attr("class", "Legend")
		.on("click", handleLegendDropoffClick);

	// legend for both pickup and dropoff
	control.append("circle")
		.attr("id", "legend_pickup_dropoff")
		.attr("cx", margin + 2 *legend_spacing - 5)
		.attr("cy", marginTop)
		.attr("r", legendRadius-1)
		.style("stroke-width", 2)    // set the stroke width
		.style("stroke", "red")      // set the line colour
		.style("fill", "blue")
		.attr("class","Legend")
		.on("click", handleLegendPickupAndDropoffClick);

	control.append("text")
		.attr("x", margin + 2 *legend_spacing + radius - 5)
		.attr("y", marginTop + legend_text_extra_spacing)
		.text("pickup and dropoff")
		.attr("class","Legend")
		.on("click", handleLegendPickupAndDropoffClick);

	// legend for path
	control.append("circle")
		.attr("id", "legend_path")
		.attr("cx",width - 100)
		.attr("cy", marginTop )
		.attr("r", legendRadius)
		.attr("fill", "green");

	control.append("text")
		.attr("x",   width - 100 +radius)
		.attr("y", marginTop + legend_text_extra_spacing )
		.text("path node");
		//.on("click", handleLegendPathClick);
}


// This Methode draw the path
function drawPaths(paths, nodeID) {

	interactiveNetwork.selectAll(".Path")
		.data(paths)
		.enter()
		.append("g")
			.attr("class", "Path")
			.on("mouseover", doNothing)
			.selectAll(".Nodepath")
			.data(function(d){

				// Using loDash to save time and to not parse many time the db

				let ids = JSON.parse(d["road"])
				let ts = Array(ids.length).fill(d["t"])

				categories = _.map(ids , (x, i) => {
					if (i == 0){
						return "Selected";
					} else if (pickupNodesSet.has(x)) {
						return "Pickup"
					} else if (dropOffNodesSet.has(x)) {
						return "Dropoff";
					} else {
						return "NodepathOnly";
					}

				});

				// d[0] = id
				// d[1] = time
				// d[2] = category


				return _.zip(ids, ts, categories)


			})
			.enter()
			.append("circle")
				.attr("fill", (d) => {
					let category = d[2];

					// Selected node in black
					if (category == "Selected"){
						return "black"
					} else if (category == "Pickup"){
						return "red";
					} else if (category == "Dropoff"){
						return "blue";
					} else {
						return "green";
					}
				})
				.attr("class", (d) => d[2] )
				.attr("id", function(d){return d[0];})
				.attr("r", function(d){

					let category = d[2];

					if (d.id == nodeID){
						return pathNodeRadius + 1
					} else if (category == "Pickup" || category == "Dropoff"){
						return normalNodeRadius;
					} else {
						return pathNodeRadius;
					}
				})
				.on("mouseover", (d) => {
					if (d[2] == "Pickup") {
						return handlePickupMouseOver(d[0]);
					} else if(d[2] == "Dropoff") {
						return handleDropoffMouseOver(d[0]);
					} else {
						return doNothing();
					}
				})
				.on("mouseout", (d) => {
					if (d[2] == "Pickup" || d[2] == "Dropoff"){
						return handleMouseOut();
					} else {
						return doNothing();
					}
				})
				.on("click", function(d){
					if (d[2] == "Pickup"){
						return handlePickupMouseClick(d[0]);
					} else if (d[2] == "Dropoff"){
						return handleDropoffMouseClick(d[0]);
					} else {
						return doNothing();
					}
				})
				.attr("transform", function(d) {
					return "translate("+scaleX(Number(osmToLatLng[d[0]][1]))+","+ scaleY(Number(osmToLatLng[d[0]][0]))+")";
				})
				.style("opacity", 0)
				.transition()
				.delay((d,i) => i*getNumberFromTime(d[1]))
				.style("opacity", 1);

	d3.selection.prototype.moveUp = function() {
		return this.each(function() {
			this.parentNode.appendChild(this);
		});
	};

	interactiveNetwork.selectAll(".Dropoff").moveUp();
	interactiveNetwork.selectAll(".Pickup").moveUp();
	interactiveNetwork.selectAll(".Selected").moveUp();
}

// 1 sec in the viz is 1min in real life
function getNumberFromTime(t) {
	attributes = t.split(":");
	minutes = Number(attributes[0]);
	seconds = Number(attributes[1]);
	return minutes+seconds/60;
}

function showPickupAndDropoffByNbPickupsAndDropoffs() {

	let pickupAndDropoffs = dropoffNodes.concat(pickupNodes);

	var linearScale = d3.scaleLinear()
		.domain([0, 20])
		//.interpolate(d3.interpolateHcl)
		//.range(['blue','red']);
		.range(['blue', 'green']);

	interactiveNetwork.selectAll(".Node")
		.data(pickupAndDropoffs)
			.enter()
				.append("circle")
				.attr("class", "Pickup")
				.attr("r" , normalNodeRadius)
				.attr("transform", function(d) {
					if (d.hasOwnProperty("dnode")){
						nodeId = d["dnode"];
					} else if (d.hasOwnProperty("pnode")) {
						nodeId = d["pnode"];
					} else {
						nodeId = d;
					}
					return "translate("+scaleX(Number(osmToLatLng[nodeId][1]))+","+ scaleY(Number(osmToLatLng[nodeId][0]))+")";
				})
				.attr("fill", function(d,i){
					if (d.hasOwnProperty("dnode")){
						return linearScale([dropoffToNbDropoffs[d["dnode"]]]);
					} else {
						return linearScale(pickupToNbPickups[d["pnode"]]);
					}
				})
				.style("opacity", 0)
				.transition()
				.duration(1000)
				.delay(function(d,i){ return  2*i; })
				.style("opacity", 1);
}

function showPickupByNbPickups() {

	var linearScale = d3.scaleLinear()
		.domain([0, 20])
		//.interpolate(d3.interpolateHcl)
		//.range(['blue','red']);
		.range(['red', 'white']);

	interactiveNetwork.selectAll(".Node")
		.data(pickupNodes)
			.enter()
				.append("circle")
				.attr("class", "Pickup")
				.attr("r" , normalNodeRadius)
				.attr("id", function(d){return d["pnode"];})
				.attr("transform", function(d) {
					return "translate("+scaleX(Number(osmToLatLng[d["pnode"]][1]))+","+ scaleY(Number(osmToLatLng[d["pnode"]][0]))+")";
				})
				.attr("fill", function(d,i){
					return linearScale(pickupToNbPickups[d["pnode"]]);
				})
				.style("opacity", 0)
				.transition()
				.duration(1000)
				.delay(function(d,i){ return  2*i; })
				.style("opacity", 1);
}

function showDropoffByNbDropoffs() {
	var linearScale = d3.scaleLinear()
		.domain([0, 5])
		//.interpolate(d3.interpolateHcl)
		//.range(['blue','red']);
		.range(['blue', 'DodgerBlue', 'white']);

	interactiveNetwork.selectAll(".Node")
		.data(dropoffNodes)
			.enter()
				.append("circle")
				.attr("class", "Pickup")
				.attr("r" , normalNodeRadius)
				.attr("id", function(d){return d["dnode"];})
				.attr("transform", function(d) {
					return "translate("+scaleX(Number(osmToLatLng[d["dnode"]][1]))+","+ scaleY(Number(osmToLatLng[d["dnode"]][0]))+")";
				})
				.attr("fill", function(d,i){
					return linearScale(dropoffToNbDropoffs[d["dnode"]]);
				})
				.style("opacity", 0)
				.transition()
				.duration(1000)
				.delay(function(d,i){ return  2*i; })
				.style("opacity", 1);
}

function showAllNodesByOccurrence() {

	let allNodes = Object.keys(osmToOccurences);

	blackLightningNetwork.selectAll(".Node")
		.data(allNodes)
			.enter()
				.append("circle")
				.attr("class", "Node")
				.attr("r" , pathNodeRadius)
				.attr("transform", function(d) {
					return "translate("+scaleX(Number(osmToLatLng[d][1]))+","+ scaleY(Number(osmToLatLng[d][0]))+")";
				})
				.attr("fill", function(d,i){
					return linearBlackLighteningScale(osmToOccurences[d]);
				})
				.style("opacity", 1);

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

function calculateScale(width, height){

	scaleX = d3.scaleLinear()
		.domain(x0)
		.range([2*margin, width]);

	scaleY = d3.scaleLinear()
	.domain(y0)
	.range([height, 2*margin]);

}

// ----------------------------------------- INFO MAP -----------------------------------------

function initializeMap() {
	// set map
	infoMap = L.map('infoMap', {attributionControl: false})

	// load a tile layer
	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
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
	//infoMap.removeControl(infoMap.zoomControl);

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

	var greenIcon = L.icon({
	    iconUrl: 'Images/blackIcon.png',
	    iconSize:     [10, 10], // size of the icon
	    iconAnchor:   [10, 10], // point of the icon which will correspond to marker's location
	    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
	});

	marker = L.marker([nodeLat, nodeLng], {icon: greenIcon}).addTo(infoMap);
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
	    interactiveNetwork.select(".brush").call(brush.move, null);
  	}
	zoom();

	if(s != null) {
		[lngL, lngR] = [s[0][0], s[1][0]].map(scaleX.invert, scaleX);
		[latU, latD] = [s[1][1], s[0][1]].map(scaleY.invert, scaleY);

		centerInfoMap(lngL, lngR, latU, latD);

		brushFinished.a = true;

	} else {
		infoMap.setView([46.5201349,6.6308389], 10);
	}
}


function idled() {
  idleTimeout = null;
}

function zoom() {
	//console.log("Hello")
  var t = interactiveNetwork.transition().duration(750);
  interactiveNetwork.selectAll("circle").transition(t)
			.attr("transform", function(d){
				if(!d){
					return
				}
				if (d.hasOwnProperty("dnode")){
					nodeId = d["dnode"]
				} else if (d.hasOwnProperty("pnode")) {
					nodeId = d["pnode"]
				} else {
					nodeId = d[0];
				}
				//console.log(nodeId);
				return "translate("+scaleX(Number(osmToLatLng[nodeId][1]))+","+ scaleY(Number(osmToLatLng[nodeId][0]))+")";
			})
}

function getNodesInBrush() {
	pickupSelected = interactiveNetwork.selectAll(".Pickup")._groups[0];
	dropoffSelected = interactiveNetwork.selectAll(".Dropoff")._groups[0];
	pathSelected = interactiveNetwork.selectAll(".NodepathOnly")._groups[0];

	return {
		Pickup: getNodesInBounds(pickupSelected),
		Dropoff: getNodesInBounds(dropoffSelected),
		Path: getNodesInBounds(pathSelected)
	}
}

function getNodesInBounds(selected) {
	selectedSet = [];

	for(i = 0; i < selected.length; i++) {
		node_width = selected[i].transform.animVal[0].matrix.e;
		node_height = selected[i].transform.animVal[0].matrix.f;

		if(0 <= node_width && node_width <= width && 0 <= node_height && node_height <= height) {
			if(!selectedSet.includes(selected[i])) {
				selectedSet.push(selected[i]);
			}
		}
	}
	return selectedSet;
}

/* ----------------------------------------- SLIDER -----------------------------------------

function initializeSlider() {

	let sliderWidth = 300;
	let sliderHeight = 100;


	x = d3.scalePow()
    	.domain([0, 12])
    	.range([0, sliderWidth])
    	.clamp(true);

    slider = d3.select("#blackLightningSlider").attr("width", sliderWidth+100).attr("height", sliderHeight).append("g")
	    .attr("class", "slider")
	    .attr("transform", "translate(" + margin+5 + "," + margin+5 + ")");
	   // .attr("x", "0").attr("y", "0");

	slider.append("line")
	    .attr("class", "track")
	    .attr("x1", x.range()[0])
	    .attr("x2", x.range()[1])
	 	.select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
	    .attr("class", "track-inset")
	  	.select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
	    .attr("class", "track-overlay")
	    .on("mouseover", function(d) {
       		d3.select(this).style("cursor", "pointer");
      	})
	    .call(d3.drag()
	        .on("start.interrupt", function() { slider.interrupt(); })
	        .on("start drag", function() {
	        	currentValue = d3.event.x;
	        	//console.log(x.invert(currentValue));
	        	handleSliderMoving(x.invert(d3.event.x));
	        }));

    slider.insert("g", ".track-overlay")
	    .attr("class", "ticks")
	    .attr("transform", "translate(0," + 18 + ")")
	  	.selectAll("text")
	  	.data(x.ticks(10))
	  	.enter()
		  	.append("text")
		    .attr("x", x)
		    .attr("text-anchor", "middle")
		    .text(function(d) { return d; })


	handle = slider.insert("circle", ".track-overlay")
    	.attr("class", "handle")
    	.attr("r", 9);

    label = slider.append("text")
	    .attr("class", "label")
	    .attr("text-anchor", "middle")
	    .attr("transform", "translate(0," + (-25) + ")")
}

function handleSliderMoving(h) {

	handle.attr("cx", x(h))
		.style("fill", linearBlackLighteningScale(x(h)));

	label.attr("x", x(h)).text(formatText(h));
}

function formatText(h) {

}*/

// ----------------------------------------- ON DOCUMENT LOAD -----------------------------------------

whenDocumentLoaded(() => {

	// Calculate dynamically the width height
	width = $(window).width()
	height =$(window).height()

	heightInteracitveNetwork = 0.6 * width

	blackLightningNetwork = d3.select("#blackLightningNetwork")
		.attr("width", width)
		.attr("height", height)
		.attr("fill", "black");

	interactiveNetwork = d3.select("#interactiveNetwork")
		.attr("width", width )
		.attr("height", heightInteracitveNetwork );



	// Adds the svg blackLightningNetwork
	blackLightningNetworkSVG = d3.select("#blackLightningNetwork")
			.append("svg")
					.attr("width", width + margin)
					.attr("height", height);

	div = d3.select("body").append("div")
			.attr("class", "infoBox")
			.style("opacity", 0);


    // initalize map centered on lausanne region
	initializeMap();
	infoMap.setView([46.5201349,6.6308389], 10);

	// initialize slider
	//initializeSlider();

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
		calculateScale(width, heightInteracitveNetwork)


		// show pickup and dropoffs, Only when they appear at the screen
		$(window).scroll(function() {
   var hT = $('#scroll-to').offset().top,
       hH = $('#scroll-to').outerHeight(),
       wH = $(window).height(),
       wS = $(this).scrollTop();
   if ((wS > (hT+hH-wH) && (hT > wS) && (wS+wH > hT+hH)) && !appeared){
		 showAllDropoffNodes();
		 showAllPickupNodes();
		 appeared = true;
   }
	});

		// Handle rescaling the window
		$(window).resize(function(){
			width = $(window).width();
			height =$(window).height();
			calculateScale(width, 0.6 * height);
			d3.select("#interactiveNetwork").attr("width", width + margin)
				.attr("height", 0.6*height + margin);
			d3.select("#blackLightningNetwork").attr("width", width).attr("height", height)
			d3.select("#control").attr("width", width)

			interactiveNetwork.select(".brush").call(brush);

			zoom()
			drawControls()
		});


		//	showPickupAndDropoffByNbPickupsAndDropoffs();

		// for this one put background in black
		showAllNodesByOccurrence();

		//showPickupByNbPickups();
		//showDropoffByNbDropoffs();

	    // legend for pickup
		drawControls()
			//.on("click", handleLegendPathClick);
		});

		interactiveNetwork.selectAll(".domain")
		    .style("display", "none");

		blackLightningNetworkSVG.selectAll(".domain")
		    .style("display", "none");

		interactiveNetwork.append("g")
			.attr("class", "brush")
			.call(brush);
});
