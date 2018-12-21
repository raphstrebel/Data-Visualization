
// ----------------------------------------- Global Variables ----------------------------------------


// global constants
const normalNodeRadius = 3;
const pathNodeRadius = 2;

const margin = 5;
const maxOccurence = 1103;
const occurencesPickup = 42;
const occurencesDropoff = 525;
const legendRadius = 5;
const radius = 5;
const MIN_WIDTH = 500;
const MIN_HEIGHT = 400;

// visualization tools and networks
let svg;
let interactiveNetwork;
let blackLightningNetwork;
let blackLightningNetworkSVG;

// tooltip
let tooltip;
let pathTooltip;

// database and useful dictionaries
let database;
let osmToLatLng;
let osmToOccurences;
let pickupNodes;
let dropoffNodes;
let pickupToNbPickups;
let dropoffToNbDropoffs;

// network scales
let scaleX;
let scaleY;

// Stats on pickup and dropoff scales
let pickupScale;

// map letiables
let infoMap;
let marker;

// Brushing
let brush = d3.brush().on("end", brushended);

let idleTimeout;
let	idleDelay = 350;

let allNodesInArea = {
	Dropoff :occurencesDropoff,
	Pickup : occurencesPickup
};


// Selection is important for the kind of stats we want to see
let selection = "appear";
var selectedNode;
var selectedCat;

// Used to know when to load or not the nodes
appeared = false;


let width = MIN_WIDTH;
let height = MIN_HEIGHT;

var linearBlackLighteningScale = d3.scalePow()
	.domain([0, 40])
   	.range(["#112231","#3C769D"]);



// --------------------------------- Information bar chart----------------------------------------


// Set listener for once the brush is finished
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

		// Get unique selected pickup nodes
		selectedPickupNodes = new Set();

		for(let i of allNodesInBrushing.Pickup) { 

			test = i; 
			n = test.__data__[0];

			if(n == null) {
				n1 = test.__data__.pnode;
				if(n1 != null && !selectedPickupNodes.has(n1) && n1 != selectedNode) {
					selectedPickupNodes.add(n1);
				}
			} else {
				if(!selectedPickupNodes.has(n) && n != selectedNode) {
					selectedPickupNodes.add(n);
				}
			}
		}

		// check if selected node is a pickup
		if(selectedNode != null && selectedCat === "Pickup") {
			selectedPickupNodes.add(selectedNode);
		}

		// Get unique selected dropoff nodes

		selectedDropoffNodes = new Set();

		for(let i of allNodesInBrushing.Dropoff) { 

			test = i; 
			n = test.__data__[0];

			if(n == null) {
				n1 = test.__data__.dnode;
				if(n1 != null && !selectedDropoffNodes.has(n1) && n1 != selectedNode) {
					selectedDropoffNodes.add(n1);
				}
			} else {
				if(!selectedDropoffNodes.has(n) && n != selectedNode) {
					selectedDropoffNodes.add(n);
				}
			}
		}

		// check if selected node is a dropoff
		if(selectedNode != null && selectedCat === "Dropoff") {
			selectedDropoffNodes.add(selectedNode);
		}

		// Replace in allNodesInBrushing
		allNodesInBrushing.Pickup = selectedPickupNodes;
		allNodesInBrushing.Dropoff = selectedDropoffNodes;

		drawBarForBrushing(allNodesInBrushing);
}, 1500);
});

// Draw the bar chart
function drawBarForBrushing(allNodesInBrushing){
	let w = $(window).width()*0.5;
	let h =  w/3;
	let mL = mT = mB =  5;
	let mR = 20;



	pickupScale = d3.scaleLinear().domain([0 , occurencesPickup]).range([0, w - 2 *mR - mL]);
	dropoffScale = d3.scaleLinear().domain([0 , occurencesDropoff]).range([0, w - 2* mR - mL]);

	nbPickup =allNodesInBrushing.Pickup.size;
	nbDropoff = allNodesInBrushing.Dropoff.size;



	let barWidth = h/4
	let spacing = barWidth/3
	// Used for redrawing
	d3.select(".bar").remove()

	let xAxis = d3.scaleLinear()
						.domain([0, 100])
						.range([mL, w - 2 *mR])

	let yAxis = d3.scaleLinear()
											//.ticks(0)
											//.ticksFormat("")
											.range([0, _.floor(2*barWidth+ spacing)])

	bars = d3.select("#stats").attr("width",w).attr("height", h)
		.append("g").attr("class", "bar");

	// Red bar
	// plot
	bars.append("rect")
		.attr("width", pickupScale(nbPickup))
		.attr("height", barWidth).attr("fill", "red")
		.attr("transform", "translate( "+ mL+" , 0)");

	// show nb occurences
	bars.append("text").attr("x",  pickupScale(nbPickup) + 5).attr("y", h/8).text(nbPickup)
		.attr("transform", "translate( "+ mL+" , 0)");

	// Blue bar
	bars.append("rect")
		.attr("width", dropoffScale(nbDropoff))
		.attr("height", barWidth).attr("fill", "blue").attr("y", barWidth + spacing)
		.attr("transform", "translate( "+ mL+" , 0)");

	bars.append("text").attr("x",  dropoffScale(nbDropoff) + 5)
		.attr("y", _.ceil(barWidth + spacing + barWidth/2))
		.text(nbDropoff).attr("transform", "translate( "+ mL+" , 0)");

	// add the x Axis
bars.append("g")
		.attr("transform", "translate(0,"+_.floor(2*barWidth+ spacing)+")")
		.call(d3.axisBottom(xAxis));

		// add the y Axis
		bars.append("g")
				//.attr("transform", "rotate(90)")
				.attr("transform", "translate("+mL+", 0)")
				.call(d3.axisLeft(yAxis).ticks(0));

		// Global Text
	bars.append("text").attr("transform", "translate("+0+","+_.floor(h -19)+")")
	.text("Percentage of selected nodes by category (with # locations)")
	.attr("font-size", _.floor(w * 10/320))
}

// ----------------------------------------- MOUSE HANDLERS -----------------------------------------

function handleDropoffMouseOver(node) {

	let nodeID;

	if(node["dnode"] != null) {
		nodeID = node["dnode"];
	} else {
		nodeID = node;
	}

	tooltip.transition().style("opacity", .9);
	tooltip.html(" occurences : " + osmToOccurences[nodeID] + "<br>" + " dropoffs : " + dropoffToNbDropoffs[nodeID])
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

	tooltip.transition().style("opacity", .9);
	tooltip.html(" occurences : " + osmToOccurences[nodeID] + "<br>" + " pickups : " + pickupToNbPickups[nodeID])
		.style("left", (d3.event.pageX) + "px")
		.style("top", (d3.event.pageY - 28) + "px");
}

// make info box dissapear (slowly)
function handleMouseOut() {
	tooltip.transition()
	.duration(500)
	.style("opacity", 0);
}

// make info box dissapear (slowly)
function handlePathMouseOut() {
	pathTooltip.transition()
	.duration(500)
	.style("opacity", 0);
}

function handleDropoffMouseClick(node) {
	//changeStats("node", node);
	handleMouseOut();
	handlePathMouseOut();
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

	brushFinished.a = true;

}

function handlePickupMouseClick(node) {
	handleMouseOut();
	handlePathMouseOut();
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

	brushFinished.a = true;
}

function handleLegendDropoffClick(){
	hide(".Pickup");
	hide(".Path");
	showAllDropoffNodes();
	brushFinished.a = true;
}

function handleLegendPickupClick(){
	hide(".Dropoff");
	hide(".Path");
	showAllPickupNodes();
	brushFinished.a = true;
}

function handleLegendPickupAndDropoffClick(){
	hide(".Path");
	showAllDropoffNodes();
	showAllPickupNodes();
	brushFinished.a = true;
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

function handlePathMouseOver(d) {
	pathTooltip.transition().style("opacity", .9);
	pathTooltip.html(" time : " + d[1])
		.style("left", (d3.event.pageX) + "px")
		.style("top", (d3.event.pageY - 28) + "px");
}


// This Methode draw the path
function drawPaths(paths, nodeID) {

	var highlightler = "black";

	interactiveNetwork.selectAll(".Path")
		.data(paths)
		.enter()
		.append("g")
			.attr("class", "Path")
			//.on("mouseover", highlightPath)
			.selectAll(".Nodepath")
			.data(function(d){

				// Using loDash to save time and to not parse many time the db

				let ids = JSON.parse(d["road"])
				let ts = Array(ids.length).fill(d["t"])

				categories = _.map(ids , (x) => {
					if (pickupNodesSet.has(x)) {
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
					if ((d[0] == nodeID)){
						selectedNode = nodeID;
						selectedCat = category;
						return "black"
					} else if (category == "Pickup"){
						return "red";
					} else if (category == "Dropoff"){
						return "blue";
					} else {
						return "green";
					}
				})
				.attr("class", (d) => {
					if (d[0] == nodeID){
						return d[2]+ " " + "Selected";
					}
					else{
						return d[2];
					}
					} )
				.attr("id", (d) => d[0])
				.attr("r", function(d){

					let category = d[2];

					if (d[0] == nodeID){
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
						return handlePathMouseOver(d);
						//return doNothing();
					}
				})
				.on("mouseout", (d) => {
					if (d[2] == "Pickup" || d[2] == "Dropoff"){
						return handleMouseOut();
					} else {
						return handlePathMouseOut();
					}
				})
				.on("click", function(d){
					if (d[2] == "Pickup"){
						return handlePickupMouseClick(d[0]);
					} else if (d[2] == "Dropoff"){
						return handleDropoffMouseClick(d[0]);
					} else {
						return handlePathMouseOut();
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

function showAllNodesByOccurrence() {

	let allNodes = Object.keys(osmToOccurences);

	width = $(window).width()
	height = $(window).height()

	let lightningScaleX = d3.scaleLinear().domain(x0)
		.range([margin, width]);

	let lightningScaleY = d3.scaleLinear().domain(y0)
		.range([height, margin]);

	blackLightningNetwork.selectAll(".Node")
		.data(allNodes)
			.enter()
				.append("circle")
				.attr("class", "Node")
				.attr("r" , pathNodeRadius)
				.attr("transform", function(d) {
					return "translate("+lightningScaleX(Number(osmToLatLng[d][1]))+","+ lightningScaleY (Number(osmToLatLng[d][0]))+")";
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


	} else {
		infoMap.setView([46.5201349,6.6308389], 10);
	}
	brushFinished.a = true;
}


function idled() {
  idleTimeout = null;
}

function zoom() {
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

// Return nodes lying in the brush Area
function getNodesInBounds(selected) {
	let selectedSet = new Set();

	// Safety margin
	let extraSafeMargin = 5

	let w = $(window).width() + margin;
	let h = $(window).height() *0.6 + margin ;
	for(i = 0; i < selected.length; i++) {
		node_width = selected[i].transform.animVal[0].matrix.e;
		node_height = selected[i].transform.animVal[0].matrix.f;

		if(- extraSafeMargin <= node_width && node_width <= w + extraSafeMargin && - extraSafeMargin <= node_height && node_height <= h + extraSafeMargin ) {
			if(!selectedSet.has(selected[i])) {
				selectedSet.add(selected[i]);
			}
		}
	}

	return selectedSet;
}




function resize(){
	width = $(window).width();
	height =$(window).height();
	calculateScale(width, 0.6 * height);
	d3.select("#interactiveNetwork").attr("width", width + margin)
		.attr("height", 0.6*height + margin);
	d3.select("#blackLightningNetwork").attr("width", width).attr("height", height)
	//showAllNodesByOccurrence()
	d3.select("#control").attr("width", width + margin)
}


// ----------------------------------------- ON DOCUMENT LOAD -----------------------------------------



whenDocumentLoaded(() => {

	// Calculate dynamically the width height
	width = $(window).width()
	height =$(window).height()

	heightInteracitveNetwork = 0.6 *height

	blackLightningNetwork = d3.select("#blackLightningNetwork")
		.attr("width", width )
		.attr("height", height)
		.attr("fill", "black");

	interactiveNetwork =	d3.select("#interactiveNetwork").attr("width", width + margin)
			.attr("height", heightInteracitveNetwork + margin);



	// Adds the svg blackLightningNetwork
	blackLightningNetworkSVG = d3.select("#blackLightningNetwork")
			.append("svg")
					.attr("width", width + margin)
					.attr("height", height);

	tooltip = d3.select("body").append("div")
			.attr("class", "infoBox")
			.style("opacity", 0);

	pathTooltip= d3.select("body").append("div")
			.attr("class", "pathInfoBox")
			.style("opacity", 0);



    // initalize map centered on lausanne region
	initializeMap();
	infoMap.setView([46.5201349,6.6308389], 10);


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
		calculateScale(width , heightInteracitveNetwork)

		// for this one put background in black
		showAllNodesByOccurrence();

		//resize();

		// show pickup and dropoffs, Only when they appear at the screen
		// Adapted and retrieve from stackoverflow
		$(window).scroll(function() {
   let hT = $('#scroll-to').offset().top,
       hH = $('#scroll-to').outerHeight(),
       wH = $(window).height(),
       wS = $(this).scrollTop();
   if ((wS > (hT+hH-wH) && (hT > wS) && (wS+wH > hT+hH)) && !appeared){
		 showAllDropoffNodes();
		 showAllPickupNodes();
		 appeared = true;
		 allNodesInBrushing = getNodesInBrush()
		 drawBarForBrushing(allNodesInBrushing)

   }
	});



		// Handle rescaling the window
	$(window).resize(function(){
		resize();

			interactiveNetwork.select(".brush").call(brush);


			zoom();
			drawControls();
		});


		//	showPickupAndDropoffByNbPickupsAndDropoffs();



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
