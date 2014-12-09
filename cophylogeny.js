/* 

cophylogeny.js

*/


if (!d3) { throw "error: d3.js is required but not included"};

// anonymous function wrapper
(function() {

cophylogeny = {};

// TODO
//  zoomable
//  scale bars

// glocal variables
// margins for svg drawing area
var margin = { top: 20, right: 20, bottom: 20, left: 20 };

var svg_h = 0;
var svg_w = 0;

var newick_string_1, newick_string_2; // these will hold plain text newick trees

// variables for svg canvas and groups
var overall_vis;
var tree1_g, tree2_g, bridge_g;
var tree1_name, tree2_name;

// svg is the svg element upon which to draw the cophylogeny
cophylogeny.render = function(selector, newick_file_1, newick_file_2, width, height)
{
	var sel = d3.select(selector);
   var w = width || sel.style('width') || sel.attr('width');
   var h = height || sel.style('height') || sel.attr('height');

   svg_h = h - margin.top - margin.bottom;
   svg_w = w - margin.left - margin.right;

   // create an SVG canvas area
   overall_vis = sel.append("svg")
      .attr("width", svg_w)
      .attr("height", svg_h)
      .attr("transform", "translate(" + margin.left + ", " + margin.top + ")") ;

	// plain white background
   overall_vis.append("rect")
     .attr("class", "background")
     .attr("width", svg_w)
     .attr("height", svg_h)
	  .on("click", fade_all);

   // determine tree names for labeling
	// use everything before first "."
	tree1_name = newick_file_1.match(/\w+/)[0].toUpperCase();
	tree2_name = newick_file_2.match(/\w+/)[0].toUpperCase();
	// console.log ("nf1: " + newick_file_1 + "t1n: " + tree1_name);

   // here, parse newick files, by async http requests
   var remaining = 2; // necessary b/c requests are asynchronous

   // parse text file for first tree (left tree) 
   d3.text(newick_file_1, function(error, parsed_text)
   {
      if (error) return console.warn(error);
      newick_string_1 = parsed_text;
      if (!--remaining) parse_newick_strings();
   });
   // parse text file for second tree (right tree) 
   d3.text(newick_file_2, function(error, parsed_text)
   {
      if (error) return console.warn(error);
      newick_string_2 = parsed_text;
      if (!--remaining) parse_newick_strings();
   });

} // end load()

// this function parses the newick strings and populates data structures
function parse_newick_strings()
{
   // parse plain text newick format trees and convert to tree data structures
   var newick_1 = Newick.parse(newick_string_1);
   var newick_2 = Newick.parse(newick_string_2);

	// actually draw the trees
	render_trees(newick_1, newick_2);
}

// this function renders the 2 trees
function render_trees(newick_1, newick_2)
{

	// console.log("rendering trees");

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
         .on("click", highlight_from_node());

      selection.selectAll('g.inner.node')
         .append("svg:circle")
         .attr("r", 5)
         .attr('stroke', "none")
         .attr('fill', 'none')
         .attr("pointer-events", "all"); // enable mouse events to be detected even though no fill

      selection.selectAll('g.root.node')
         .append('svg:circle')
         .attr("r", 1.5)
         .attr('fill', 'black')
         .attr('stroke', 'black')
   } // end styleTreeNodes


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

   // add labels 
	tree1_g.append("text")
	.attr("class", "tree_label")
	.attr("x", 0)
	.attr("y", 0)
	.text(tree1_name);

	// tree1_g.append("text")
	// .attr("class", "tree_label")
	// .attr("x", 0)
	// .attr("y", 15)
	// .text("Phylogeny");

	tree2_g.append("text")
	.attr("class", "tree_label")
	.attr("x", svg_w - margin.left - margin.right)
	.attr("y", 0)
	.style("text-anchor", "end")
	.text(tree2_name);

	// tree2_g.append("text")
	// .attr("class", "tree_label")
	// .attr("x", svg_w - margin.left - margin.right)
	// .attr("y", 15)
	// .style("text-anchor", "end")
	// .text("Phylogeny");



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

// inspired by: http://bl.ocks.org/mbostock/4062006
function fade_all()
{
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
	if (currentClass === "bridge") {
	   d3.select(this).attr("class", "bridge-highlighted");
	}
	else {
	   d3.select(this).attr("class", "bridge");
	}
}

}());
