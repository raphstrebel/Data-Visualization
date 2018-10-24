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