/* 

cophylogeny.js

*/


if (!d3) { throw "error: d3.js is required but not included"};

// anonymous function wrapper
(function() {

d3.cophylogeny = {};


// TODO
//  zoomable
//  scale bars

// svg is the svg element upon which to draw the cophylogeny
d3.cophylogeny.render = function(svg, )
{
   var w = d3.select(svg).style('width') || d3.select(svg).attr('width');
   var h = d3.select(svg).style('height') || d3.select(svg).attr('height');


}


// margins for svg drawing area
var margin = { top: 20, right: 20, bottom: 20, left: 20 };

svg_h = h - margin.top - margin.bottom;
svg_w = w - margin.left - margin.right;

// main javascript/d3 for rendering cartoons and plots
// 
// Mark Stenglein 9/2/2014

var all_segments = [];
var recombinant_segments = [];
var animal_numbers = [];
var genotypes = [];

var newick_string_1, newick_string_2; // these will hold plain text newick trees

// variables for svg canvas and groups
var overall_vis;
var tree1_g, tree2_g, bridge_g;

function clear_displayed_elements()
{
   console.log("clearing display...");
   d3.select("body").selectAll("svg").remove();
   // d3.select("body").selectAll("g").remove();
   // d3.select("body").selectAll(".checks").remove();
   // d3.select("body").selectAll(".checks_label").remove();
   // d3.select("body").selectAll("div").remove();
}

// run this when page loaded
function load()
{
   clear_displayed_elements();

   // setup drop down input to reload page when changing from S<->L
   // when the input range changes update the rectangle 
   d3.select("#segment_select").on("input", function(){
      console.log("re-loading");
      load();
   });

   // are we going to display S or L co-phylogeny?
   var segment_id = d3.select("#segment_select").property("value");
   console.log ("seg id: " + segment_id);

   // parse names of recombinant segments from local text file
   // d3.text("http://localhost:8888/recombinant_segment_names.txt", function(error, parsed_text)
   d3.text("./recombinant_segment_names.txt", function(error, parsed_text)
   {
      if (error) return console.warn(error);

      // parse to an array of lines
      var all_recombinant_segments = parsed_text.match(/[^\r\n]+/g);

      // collapse segment ids to snake #s
      recombinant_segments  = all_recombinant_segments
        .map(function(d) {return d.replace("snake", "")}) 
        .map(function(d) {return d.replace("[SL]", "")});
   });

   // parse segment names from local text file
   // d3.text("http://localhost:8888/segment_names.txt", function(error, parsed_text)
   d3.text("./segment_names.txt", function(error, parsed_text)
   {
      if (error) return console.warn(error);

      // parse to an array of lines
      all_segments = parsed_text.match(/[^\r\n]+/g);

      // collapse segment ids to snake #s
      var animal_names = all_segments.map(function(full_name) {
         return full_name.split('_')[0].replace("snake", "");
      });

      // collapse segment ids to snake #s
      var segment_ids = all_segments.map(function(full_name) {
         return full_name.split('_')[1];
      });

      //  a function to collapse redundant (sorted) array of to set of unique values
      var collapse_array = function(a) {
          return a.reduce(function(p, c) {
             if (p.indexOf(c) < 0) p.push(c);
          return p;
          }, []);
      };

      // a sort function for numeric values
      function compareNumbers(a, b) { return a - b; } 

      // collapse array of snake #s
      animal_numbers = collapse_array(animal_names.sort(compareNumbers));

      var pertinent_segment_ids = segment_ids.filter(function(d){
         if (d.match("^"+segment_id)) { return true; }
         else                        { return false; }
      }) 
      .map(function(d){return d.replace(segment_id, "")});

      console.log ("pert seg ids: " + pertinent_segment_ids);

      // collapse to unique set of genotypes
      genotypes = collapse_array(pertinent_segment_ids.sort(compareNumbers));

      // create checkboxes, other html elements
      // call this in this function because reading text file
      // is asynchronous
      setup_inputs();

   }); // end d3.text


	// kludgey: scale drawing area for larger L phylogenies
	// TODO: implement zooming?
	if (segment_id === "L")
	{
	   svg_h = 1000;
	}

   // create an SVG canvas area
   // overall_vis = d3.select("body").select("#drawing_area").append("svg")
      // .attr("width", svg_w)
      // .attr("height", svg_h)
      // .attr("transform", "translate(" + margin.left + ", " + margin.top + ")") ;

   overall_vis.append("rect")
     .attr("class", "background")
     .attr("width", svg_w)
     .attr("height", svg_h)
	  .on("click", fade_all);

   if (segment_id === "S")
   {
      // var tree1_file = "http://localhost:8888/gp_tree.newick";
      // var tree2_file = "http://localhost:8888/np_tree.newick";
      var tree1_file = "./gp_tree.newick";
      var tree2_file = "./np_tree.newick";
   }
   else
   {
      // var tree1_file = "http://localhost:8888/z_tree.newick";
      // var tree2_file = "http://localhost:8888/l_tree.newick";
      var tree1_file = "./z_tree.newick";
      var tree2_file = "./l_tree.newick";
   }

   // here, parse newick files, by async http requests
   var remaining = 2; // necessary b/c requests are asynchronous
   // parse text file for first tree (left tree) 
   d3.text(tree1_file, function(error, parsed_text)
   {
      if (error) return console.warn(error);
      newick_string_1 = parsed_text;
      if (!--remaining) parse_newick_strings();
   });
   // parse text file for second tree (right tree) 
   d3.text(tree2_file, function(error, parsed_text)
   {
      if (error) return console.warn(error);
      newick_string_2 = parsed_text;
      if (!--remaining) parse_newick_strings();
   });

} // end load()

var newick_1;
var newick_2;

// this function parses the newick strings and populates data structures
function parse_newick_strings()
{
   // parse plain text newick format trees and convert to tree data structures
   newick_1 = Newick.parse(newick_string_1);
   newick_2 = Newick.parse(newick_string_2);
	render_trees();
}

// this function renders the 2 trees
function render_trees()
{
   // parse plain text newick format trees and convert to tree data structures
   // var newick_1 = Newick.parse(newick_string_1);
   // var newick_2 = Newick.parse(newick_string_2);

	console.log("rendering trees");

   // several functions copied from:
   // from: https://gist.github.com/kueda/1036776
   // Copyright (c) 2013, Ken-ichi Ueda
   function rightAngleDiagonal()
   {
         var projection = function(d)
         {
            return [d.y, d.x];
         }
         var path = function(pathData)
         {
            return "M" + pathData[0] + ' ' + pathData[1] + " " + pathData[2];
         }

         function diagonal(diagonalPath, i)
         {
            var source = diagonalPath.source,
               target = diagonalPath.target,
               midpointX = (source.x + target.x) / 2,
               midpointY = (source.y + target.y) / 2,
               pathData = [source,
                  {
                     x: target.x,
                     y: source.y
                  },
                  target
               ];
            pathData = pathData.map(projection);
            return path(pathData)
         }
         diagonal.projection = function(x)
         {
            if (!arguments.length) return projection;
            projection = x;
            return diagonal;
         };
         diagonal.path = function(x)
         {
            if (!arguments.length) return path;
            path = x;
            return diagonal;
         };
         // this function returns a function
         return diagonal;
      }

   // this function sets up mouse events for nodes
   function styleTreeNodes(selection)
   {
      selection.selectAll('g.leaf.node')
         .append("svg:circle")
         .attr("r", 5)
         .attr('stroke', "none")
         .attr('fill', 'none')
         .attr("pointer-events", "all") // enable mouse events to be detected even though no fill
         .on("click", highlight_from_node())

      selection.selectAll('g.inner.node')
         .append("svg:circle")
         .attr("r", 5)
         .attr('stroke', "none")
         .attr('fill', 'none')
         .attr("pointer-events", "all") // enable mouse events to be detected even though no fill
         .on("click", rotate_node)

      selection.selectAll('g.root.node')
         .append('svg:circle')
         .attr("r", 1.5)
         .attr('fill', 'black')
         .attr('stroke', 'black')
   } // end styleTreeNodes

   // this function rotates child clades around a node
   function rotate_node(pivot_node)
	{
		console.log("rotating");
	   if (pivot_node.children)
		{
			var k1 = pivot_node.children[0];
		   console.dir(k1);

			pivot_node.children.reverse();

			var k1 = pivot_node.children[0];
		   console.dir(k1);

			clear_displayed_elements();
			render_trees();
		}
	}

   // this function adjusts node positions (node y values) based on their branch lengths
   function scaleBranchLengths(nodes, w, inverted)
   {
      // Visit all nodes and adjust y pos width distance metric
      var visitPreOrder = function(root, callback)
      {
         callback(root)
         if (root.children)
         {
            for (var i = root.children.length - 1; i >= 0; i--)
            {
               visitPreOrder(root.children[i], callback)
            };
         }
      }
      visitPreOrder(nodes[0], function(node)
         {
            // rootdist is total distance from root node
            node.rootDist = (node.parent ? node.parent.rootDist : 0) + (node.length || 0)
         })
         // an array of the root dists corresponding to nodes array
         // map creates a new array based on other array and function 
      var rootDists = nodes.map(function(n)
      {
         return n.rootDist;
      });
      // var y_range = [0, (w / 3)]; // --> draw the tree on 1st 1/3 of the svg canvas
      var y_range = [0, (w * 0.35)]; // --> draw the tree on 1st 40% of the svg canvas
      if (inverted)
      {
         // y_range = [w, (w * 2 / 3)]; // --> draw the tree vertically reflected on last 1/3 of the svg canvas
         y_range = [w, (w * 0.65)]; // --> draw the tree vertically reflected on last 40% of the svg canvas
      }
      var yscale = d3.scale.linear()
         .domain([0, d3.max(rootDists)])
         .range(y_range);
      // here, we actually scale the tree node positions
      // according to the actual branch lengths
      visitPreOrder(nodes[0], function(node)
      {
         node.y = yscale(node.rootDist)
      })
      return yscale
   } // end scaleBranchLengths

   function get_segment_node_pair(segment_id, nodes_1, nodes_2)
   {
		console.log("segment_id: " + segment_id);
		console.dir( nodes_1);
		console.dir( nodes_2);
      function match_filter(n)
      {
         if (n.name === segment_id)
         {
            return true;
         }
         else
         {
            return false;
         }
      }
      nodes_1_match = nodes_1.filter(match_filter);
      nodes_2_match = nodes_2.filter(match_filter);
      // console.log ("1: " +  nodes_1_match.length + " 2: " + nodes_2_match.length);
      // console.log ("1: " +  nodes_1_match[0].name + " 2: " + nodes_2_match[0].name);
      // console.log ("1: " +  nodes_1_match[0].x + " 2: " + nodes_2_match[0].y);
      // TODO - error if match >1 node
      return [nodes_1_match[0], nodes_2_match[0]];
   }

   var tree1 = d3.layout.cluster().size([svg_h - margin.top - margin.bottom, svg_w - margin.left - margin.right])
      .children(function(node) { return node.branchset; })
		.separation( function (a, b) {
		  return a.parent == b.parent ? 1.5 : 1.8;
		  })

   var tree2 = d3.layout.cluster().size([svg_h - margin.top - margin.bottom, svg_w - margin.left - margin.right])
      .children(function(node) { return node.branchset; })
		.separation( function (a, b) {
		  return a.parent == b.parent ? 1.5 : 1.8;
		  })

   var tree1_nodes = tree1.nodes(newick_1);
   var tree1_edges = tree1.links(tree1_nodes);

   var tree2_nodes = tree2.nodes(newick_2);
   var tree2_edges = tree2.links(tree2_nodes);

   // this repositions nodes based on actual branch lengths
   var yscale = scaleBranchLengths(tree1_nodes, svg_w - margin.left - margin.right, false);
   var yscale = scaleBranchLengths(tree2_nodes, svg_w - margin.left - margin.right, true);

   tree1_g = overall_vis.append("g")
   .attr("transform", "translate(" + margin.left + ", " + margin.top + ")") ;
   tree2_g = overall_vis.append("g")
   .attr("transform", "translate(" + margin.left + ", " + margin.top + ")") ;
   bridge_g = overall_vis.append("g")
   .attr("transform", "translate(" + margin.left + ", " + margin.top + ")") ;

   // a fxn to create right angled edges connecting nodes
   var diagonal = rightAngleDiagonal();

   // actually create paths between nodes
   tree1_g.selectAll(".link")
      .data(tree1_edges)
      .enter().append("path")
      .attr("class", "link")
      .attr("d", diagonal);

   // actually create paths between nodes
   tree2_g.selectAll(".link")
      .data(tree2_edges)
      .enter().append("path")
      .attr("class", "link")
      .attr("d", diagonal);

   // define whether it is a root, inner, or leaf node
   function define_node_position(n)
   {
      if (n.children)
      {
         if (n.depth == 0) { return "root node" }
         else              { return "inner node" }
      }
      else { return "leaf node" }
   }

   // reposition nodes and add class
   tree1_g.selectAll(".node")
      .data(tree1_nodes)
      .enter().append("g")
      .attr("class", define_node_position)
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })

   tree2_g.selectAll(".node")
      .data(tree2_nodes)
      .enter().append("g")
      .attr("class", define_node_position)
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })

   styleTreeNodes(tree1_g);
   styleTreeNodes(tree2_g);

   // add labels to nodes
   tree1_g.selectAll('g.leaf.node')
      .append("text")
      .attr("dx", 8)
      .attr("dy", 3)
      .style("text-anchor", "start")
      // .style("cursor", "default") // make it not be a text cursor
      // .attr("pointer-events", "all") 
      .text(function(d) { return d.name.replace(/'/g, "").replace("snake","").replace(/[SL]/, "").replace(" ", "-"); })
		.on("click", highlight_from_node());

   // add labels to nodes
   tree2_g.selectAll('g.leaf.node')
      .append("text")
      .attr("dx", -8)
      .attr("dy", 3)
      .style("text-anchor", "end")
      // .style("cursor", "default") // make it not be a text cursor
      // .attr("pointer-events", "all") 
      .text(function(d) { return d.name.replace(/'/g, "").replace("snake","").replace(/[SL]/, "").replace(" ", "-"); })
		.on("click", highlight_from_node());

   // draw bridging lines
   tree1_nodes.forEach(function(n)
   {
      if (n.children) { return false; }
      var seg_id = n.name;
		console.log("seg_id: " + seg_id);
      var seg_pair = get_segment_node_pair(seg_id, tree1_nodes, tree2_nodes);
      var x1 = seg_pair[0].x;
      var y1 = seg_pair[0].y + 40; // to get past text. NB x,y flipped in d3.layout.cluster
      var x2 = seg_pair[1].x;
      var y2 = seg_pair[1].y - 40;
      var midx = (x1 + x2) / 2;
      var midy = (y1 + y2) / 2;

      var seg_pair_spline_coords = [
      { "x": x1, "y": y1 },
      { "x": x1, "y": midy },
      { "x": x2, "y": midy },
      { "x": x2, "y": y2 }];

      var lineFunction = d3.svg.line()
         .x(function(d) { return d.y; })
         .y(function(d) { return d.x; })
         .interpolate("bundle")
         .tension(0.95);

      var line_connect = bridge_g.append("path")
         // .attr("d", lineFunction(seg_pair)) // for straight line
         .attr("d", lineFunction(seg_pair_spline_coords))
         .attr("class", "bridge")
         .attr("id", seg_id)
         .attr("pointer-events", "stroke") // only clicking on stroke works
			.on("click", highlight_toggle); 
   });
} // end render_trees()

// highlight all bridges for a particular animal from a checkbox
function highlight_by_animal_id_from_check(animal_id)
{
   var this_check_box = d3.select("#check_by_animal").select("#animal_check_"+animal_id);
   var checked = this_check_box.property("checked");
   var id_re = "^" + animal_id+"_"; // format is snake#_genotype# -- here highlight by snake#
   highlight_by_id(id_re, checked);
};

// highlight all bridges for a particular genotype from a checkbox
function highlight_by_genotype_id_from_check(genotype_id)
{
   var this_check_box = d3.select("#check_by_genotype").select("#genotype_check_"+genotype_id);
   var checked = this_check_box.property("checked");
   var id_re = "_" + genotype_id+"$"; // format is snake#_genotype# -- here highlight by genotype#
   console.log(id_re);
   highlight_by_id(id_re, checked);
};

// inspired by: http://bl.ocks.org/mbostock/4062006
function fade_all()
{
	console.log("turning off the lights");
   bridge_g.selectAll(".bridge-highlighted")
      .transition()
      .duration(250)
      .attr("class", "bridge");
};

// this function will highlight a bridge line
// when user mouseovers a node
function highlight_from_node()
{
   return function()
   {
      var node = d3.select(this).datum();
      var node_id = node.name;
      highlight_by_id(node_id);
   }
};

// highlight lines matching certain nodes
function highlight_by_id(id)
{
   console.log("highlighting by id " + id);
   // var all_bridges = bridge_g.selectAll(".bridge")[0]; // don't understand why [0] necessary
   var all_bridges = bridge_g.selectAll("path")[0]; // don't understand why [0] necessary
   var matching_bridges = all_bridges.filter(function(d) {
     if (d.id.match(id)) { return true; }
     else { return false; }
   });
   d3.selectAll(matching_bridges).each(highlight_toggle)
}

function highlight_toggle()
{
   var currentClass = d3.select(this).attr("class");
	console.log (currentClass);
	if (currentClass === "bridge") {
	   d3.select(this).attr("class", "bridge-highlighted");
	}
	else {
	   d3.select(this).attr("class", "bridge");
	}
}

}());
