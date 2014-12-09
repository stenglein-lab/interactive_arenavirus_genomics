/* 

map.js 

*/

(function() {

map = {};

// this is a hash of arrays mapping each city to list of snakes from there
var city_snakes_map = {};

map.render = function(selector)
{
	var sel = d3.select(selector);
	var width = sel.style("width");
	var width = parseInt(width);
	// TODO: what height to use?
	// var height = sel.style("height") || sel.attr("width");
	var height = 500;

   var projection = d3.geo.albersUsa()
       .scale(750)
       .translate([width / 2, height / 2]);
   
   var path = d3.geo.path()
       .projection(projection)
   	 .pointRadius(4);
   
   // var svg = d3.select("body").append("svg")
   var svg = sel.append("svg")
       .attr("width", width)
       .attr("height", height);
   
   var g = svg.append("g");
   
   g.append("rect")
       .attr("class", "background")
       .attr("width", width)
       .attr("height", height)
   	 .on("click", fade_all); // clear highlighted cities if click anywhere else
   
   d3.text("./snake_loc_map.txt", function(text) {
     var data = d3.tsv.parseRows(text);
     data.forEach(function(d){
        var snake = d[0];
        var city = d[1];
   	  if (city_snakes_map[city] == null) {
   	     city_snakes_map[city] = [snake];
   	  }
   	  else {
   	     city_snakes_map[city].push(snake);
   	  }
     });
   
   });
   
   // parse topoJSON format file containing geographical info about states and cities
   d3.json("./us-plus_snake_cities.json", function(error, us) {
   
	  if (error){
	     console.log ("error parsing topographic info" + error);
	  }

   	// recalculate scale and translation to use available space based on map scale
   	// and extent of features displayed
   	// (this is a Bostock thing: http://stackoverflow.com/questions/14492284/center-a-map-in-d3-given-a-geojson-object)
   
   	// first, reset scale
   	projection
   	.scale(1)
   	.translate([0,0]);
   
		// then re-calculate scale and center translation coords
   	var b = path.bounds(topojson.feature(us, us.objects.states));
   	var s = 0.9 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height);
   	var t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];
   
   	// Update the projection to use re-computed scale & translate.
   	projection
   	.scale(s)
   	.translate(t);

     // states
     g.append("g")
         .attr("id", "states")
       .selectAll("path")
         .data(topojson.feature(us, us.objects.states).features)
       .enter().append("path")
         .attr("d", path)   
   		.on("click", fade_all); // if click outside a city, clear all highlighting
   
     // state borders
     g.append("path")
         .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
         .attr("id", "state-borders")
         .attr("d", path);
   
     // cities
     g.append("g")
         .attr("id", "cities")
       .selectAll("path")
         .data(topojson.feature(us, us.objects.snake_cities).features)
       .enter().append("path")
   		.attr("d", path)
         .attr("id", function(d) { return "city-" + d.properties.name; })
   		.attr("class", "place") 
        .on("click", toggle_highlight);
   
     // city labels
     g.selectAll(".place-label")
         .data(topojson.feature(us, us.objects.snake_cities).features)
       .enter().append("text")
         .attr("class", "place-label")
         .attr("transform", function(d) { return "translate(" + projection(d.geometry.coordinates) + ")"; })
         .attr("dx", ".5em")
         .attr("dy", ".35em")
         .text(function(d) { return d.properties.name; });
   }); // end d3.json
}

function toggle_highlight(d) {

   var currentClass = d3.select(this).attr("class");
	// toggle color on click
   if (currentClass === "place") {
	   d3.select(this).attr("class", "place-highlighted");
	   var city = d.properties.name;
	   var snakes = city_snakes_map[city];
	   console.log(city + " ---> " + snakes);
   }
	else {
	   d3.select(this).attr("class", "place");
   }
}

function fade_all() {
	// clear all highlighting
	d3.selectAll(".place-highlighted").attr("class", "place");
}

}());
