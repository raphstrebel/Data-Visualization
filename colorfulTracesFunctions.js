
// ----------------------------------------- Global Variables ----------------------------------------

// global constants
const normalNodeRadius = 3;
const pathNodeRadius = 2;
const width = 1000;
const height = 700;
const margin = 5;
const maxOccurence = 1103;
const legendRadius = 5
const radius = 5

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
let brush = d3.brush().on("end", brushended),
		idleTimeout,
		idleDelay = 350;

// slider variables
var slider;
var handle;
var x;

// Selection is important for the kind of stats we want to see
let selection = "appear";

// Used to know when to load or not the nodes
appeared = false


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
	changeStats("node", node)
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

		// legend for pickup
	let legend_spacing = width/4;
	let legend_text_extra_spacing = 6

	control.append("circle")
		.attr("id", "legend_pickup")
		.attr("class", "Legend")
		.attr("cx", margin + 0*legend_spacing)
		.attr("cy", margin)
		.attr("r", legendRadius)
		.attr("fill", "red")
		.on("click", handleLegendPickupClick);

	control.append("text")
		.attr("x", margin + 0*legend_spacing + radius)
		.attr("y", margin + legend_text_extra_spacing)
		.text("pickup")
		.attr("class", "Legend")
		.on("click", handleLegendPickupClick);

	// legend for dropoff
	control.append("circle")
		.attr("id", "legend_dropoff")
		.attr("cx", margin + 1*legend_spacing)
		.attr("cy", margin)
		.attr("r", legendRadius)
		.attr("fill", "blue")
		.attr("class", "Legend")
		.on("click", handleLegendDropoffClick);


	control.append("text")
		.attr("x", margin + 1 *legend_spacing + radius)
		.attr("y", margin + legend_text_extra_spacing)
		.text("dropoff")
		.attr("class", "Legend")
		.on("click", handleLegendDropoffClick);

	// legend for both pickup and dropoff
	control.append("circle")
		.attr("id", "legend_pickup_dropoff")
		.attr("cx", margin + 2 *legend_spacing)
		.attr("cy", margin)
		.attr("r", legendRadius-1)
		.style("stroke-width", 2)    // set the stroke width
		.style("stroke", "red")      // set the line colour
		.style("fill", "blue")
		.attr("class","Legend")
		.on("click", handleLegendPickupAndDropoffClick);

	control.append("text")
		.attr("x", margin + 2 *legend_spacing + radius)
		.attr("y", margin + legend_text_extra_spacing)
		.text("pickup and dropoff")
		.attr("class","Legend")
		.on("click", handleLegendPickupAndDropoffClick);

	// legend for path
	control.append("circle")
		.attr("id", "legend_path")
		.attr("cx", margin + 3* legend_spacing)
		.attr("cy", margin )
		.attr("r", legendRadius)
		.attr("fill", "green");

	control.append("text")
		.attr("x", margin + 3* legend_spacing +radius )
		.attr("y", margin + legend_text_extra_spacing)
		.text("path node");
		//.on("click", handleLegendPathClick);
}

function drawPaths(paths, nodeID) {

	interactiveNetwork.selectAll(".Path")
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
				.delay(function(d,i){ return 12*i; })
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

	var linearScale = d3.scaleLinear()
		.domain([0, 50])
		.interpolate(d3.interpolateHcl)
		//.range(['blue','red']);
   		.range(["#112231","#3C769D"]);
		//.range(['black', 'violet', 'violet', 'violet', 'blue', 'green', 'green', 'red', 'white']);

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
					return linearScale(osmToOccurences[d]);
				})
				.style("opacity", 0);;

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
	marker = L.marker([nodeLat, nodeLng]).addTo(infoMap);
}

function centerInfoMap(lngL, lngR, latU, latD) {

	if(marker != null) {
		infoMap.removeLayer(marker);
	}

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

// ----------------------------------------- SLIDER -----------------------------------------

function initializeSlider() {

	let sliderWidth = 300;
	let sliderHeight = 100;


	x = d3.scaleLinear()
    	.domain([0, 1])
    	.range([0, 230])
    	.clamp(true);

    slider = d3.select("#blackLightningSlider").attr("width", sliderWidth).attr("height", sliderHeight).append("g")
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
	        .on("start drag", function() { changeOpacity(x.invert(d3.event.x)); }));

    slider.insert("g", ".track-overlay")
	    .attr("class", "ticks")
	    .attr("transform", "translate(0," + 18 + ")")
	  	.selectAll("text")
	  	.data(x.ticks(10))
	  	.enter().append("text")
	    .attr("x", x)
	    .attr("text-anchor", "middle")
	    .text(function(d) { return d; });

	handle = slider.insert("circle", ".track-overlay")
    	.attr("class", "handle")
    	.attr("r", 9);
}

function changeOpacity(h) {
	
	var linearScale = d3.scalePow()
		.domain([0, 40])
   		.range(["#112231","#3C769D"]);

	handle.attr("cx", x(h))
		.style("fill", linearScale(x(h)));
	blackLightningNetwork.selectAll(".Node").style("opacity", h);
}

// ----------------------------------------- ON DOCUMENT LOAD -----------------------------------------

whenDocumentLoaded(() => {

	interactiveNetwork = d3.select("#interactiveNetwork")
		.attr("width", width + margin)
		.attr("height", height + margin);

	blackLightningNetwork = d3.select("#blackLightningNetwork")
		.attr("width", width)
		.attr("height", height)
		.attr("fill", "black");

	// Adds the svg interactiveNetwork
	svg = d3.select("body")
	    .append("svg")
	        .attr("width", width + margin)
	        .attr("height", height + margin)
	    .append("g")
	        .attr("transform",
	              "translate(" + margin + "," + margin + ")");

	// Adds the svg blackLightningNetwork
	blackLightningNetworkSVG = d3.select("#blackLightningNetwork")
	    .append("svg")
	        .attr("width", width)
	        .attr("height", height);

	div = d3.select("body").append("div")
	    .attr("class", "infoBox")
	    .style("opacity", 0);

    // initalize map centered on lausanne region
	initializeMap();
	infoMap.setView([46.5201349,6.6308389], 10);

	// initialize slider
	initializeSlider();

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

		// show pickup and dropoffs, Only when they appear at the screen
		// 
		$(window).scroll(function() {
		    var hT = $('#scroll-to').offset().top,
		       hH = $('#scroll-to').outerHeight(),
		       wH = $(window).height(),
		       wS = $(this).scrollTop();
		    if ((wS > (hT+hH-wH) && (hT > wS) && (wS+wH > hT+hH)) && !appeared){
				 showAllDropoffNodes();
				 showAllPickupNodes();
				 appeared = true

		    } else {

				 //removeAll();
		    }
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

		svg.selectAll(".domain")
		    .style("display", "none");

		blackLightningNetworkSVG.selectAll(".domain")
		    .style("display", "none");

		interactiveNetwork.append("g")
			.attr("class", "brush")
			.call(brush);
});
