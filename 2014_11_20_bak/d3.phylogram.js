/*
pt
  d3.phylogram.js
  Wrapper around a d3-based phylogram (tree where branch lengths are scaled)
  Also includes a radial dendrogram visualization (branch lengths not scaled)
  along with some helper methods for building angled-branch trees.

  Copyright (c) 2013, Ken-ichi Ueda

  All rights reserved.

  modified by: Mark Stenglein (2014)

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

  Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer. Redistributions in binary
  form must reproduce the above copyright notice, this list of conditions and
  the following disclaimer in the documentation and/or other materials
  provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
  LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
  CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
  SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
  INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
  CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
  POSSIBILITY OF SUCH DAMAGE.

  DOCUEMENTATION

  d3.phylogram.build(selector, nodes, options)
    Creates a phylogram.
    Arguments:
      selector: selector of an element that will contain the SVG
      nodes: JS object of nodes
    Options:
      width       
        Width of the vis, will attempt to set a default based on the width of
        the container.
      height
        Height of the vis, will attempt to set a default based on the height
        of the container.
      vis
        Pre-constructed d3 vis.
      tree
        Pre-constructed d3 tree layout.
      children
        Function for retrieving an array of children given a node. Default is
        to assume each node has an attribute called "branchset"
      diagonal
        Function that creates the d attribute for an svg:path. Defaults to a
        right-angle diagonal.
      skipTicks
        Skip the tick rule.
      skipBranchLengthScaling
        Make a dendrogram instead of a phylogram.
  
  d3.phylogram.buildRadial(selector, nodes, options)
    Creates a radial dendrogram.
    Options: same as build, but without diagonal, skipTicks, and 
      skipBranchLengthScaling
  
  d3.phylogram.rightAngleDiagonal()
    Similar to d3.diagonal except it create an orthogonal crook instead of a
    smooth Bezier curve.
    
  d3.phylogram.radialRightAngleDiagonal()
    d3.phylogram.rightAngleDiagonal for radial layouts.
*/

if (!d3) { throw "d3 wasn't included!"};
(function() {

  d3.phylogram = {}



  d3.phylogram.rightAngleDiagonal = function() {
    var projection = function(d) { return [d.x, d.y]; }
    
    var path = function(pathData) {
      return "M" + pathData[0] + ' ' + pathData[1] + " " + pathData[2];
    }
    
    function diagonal(diagonalPath, i) {

      var source = diagonalPath.source,
          target = diagonalPath.target,
          midpointX = (source.x + target.x) / 2,
          midpointY = (source.y + target.y) / 2,
          pathData = [source, {x: target.x, y: source.y}, target];
      pathData = pathData.map(projection);
      return path(pathData)
    }
    
    diagonal.projection = function(x) {
      if (!arguments.length) return projection;
      projection = x;
      return diagonal;
    };
    
    diagonal.path = function(x) {
      if (!arguments.length) return path;
      path = x;
      return diagonal;
    };
    
    return diagonal;
  }
  
  // could make nodes look a certain way
  // don't draw little circles
  d3.phylogram.styleTreeNodes = function(vis) {
     vis.selectAll('g.leaf.node')
      .append("svg:circle")
         .attr("r", 5)
         .attr('stroke', 'none')
         .attr('fill', 'none')
         .attr("pointer-events", "all")
         // .attr("id", function(d) { return d.name; })
         .on("mouseover", highlight(vis))
         .on("mouseout", fade(vis))
    
    vis.selectAll('g.root.node')
      .append('svg:circle')
        .attr("r", 5)
        .attr('fill', 'steelblue')
        .attr('stroke', 'none')
  }
  
  // this function adjusts node positions (node y values) based on their branch lengths
  function scaleBranchLengths(nodes, w, inverted) {
    // Visit all nodes and adjust y pos width distance metric
    var visitPreOrder = function(root, callback) {
      callback(root)
      if (root.children) {
        for (var i = root.children.length - 1; i >= 0; i--){
          visitPreOrder(root.children[i], callback)
        };
      }
    }
    visitPreOrder(nodes[0], function(node) {
      // rootdist is total distance from root node
      node.rootDist = (node.parent ? node.parent.rootDist : 0) + (node.length || 0)
    })
    // an array of the root dists corresponding to nodes array
    // map creates a new array based on other array and function 
    var rootDists = nodes.map(function(n) { return n.rootDist; });

    // MDS - option to flip 
    var x_range = [0,(w/3)]; // --> draw the tree on 1st 1/3 of the svg canvas
    if (inverted)
    {
       x_range = [w,(w*2/3)]; // --> draw the tree vertically reflected on 1st 1/3 of the svg canvas
    }
    var xscale = d3.scale.linear()
      .domain([0, d3.max(rootDists)])
      .range(x_range);

    // here, we actually scale the tree node positions
    // according to the actual branch lengths
    visitPreOrder(nodes[0], function(node) {
      node.x = xscale(node.rootDist)
    })
    return xscale
  } // end scaleBranchLengths

   // from: http://bl.ocks.org/mbostock/4062006
   // Returns an event handler for fading a given chord group.
   function fade(vis) {
     return function(g, i) {
       console.log ("fading");
       vis.selectAll(".bridge")
         .transition()
           .style("stroke", "#E8E8E8");
     };
   }

   // from: http://bl.ocks.org/mbostock/4062006
   // Returns an event handler for fading a given chord group.
   // function highlight(vis, node) {
   function highlight(vis) {
   return function()
   {
     console.log ("highlight");
     // this actually gets at data linked to this node
     var node = d3.select(this).data()[0];
     var node_snake_id = node.name.split('_')[0];
     var all_bridge = vis.selectAll(".bridge")[0];
     function same_snake_filter(d)
     {
        var bridge_snake_id = d.id.split('_')[0];
        if (node_snake_id === bridge_snake_id) { return true; }
        else { return false; }
     }

     var same_snake_bridges = all_bridge.filter(same_snake_filter);
     d3.selectAll(same_snake_bridges).transition().style("stroke", "blue");
   }
   }
  
  d3.phylogram.build = function(selector, nodes1, nodes2, vis1, vis2, vis3, options) {
    options = options || {}
    var w = options.width || d3.select(selector).style('width') || d3.select(selector).attr('width'),
        h = options.height || d3.select(selector).style('height') || d3.select(selector).attr('height'),
        w = parseInt(w),
        h = parseInt(h);

    var tree1 = d3.layout.cluster()
      // .size([h, w])
      .size([w/3, h]) 
      // .sort(function(node) { return node.children ? node.children.length : -1; }) // length is the branch length
      .children(function(node) { return node.branchset });

    var tree2 = d3.layout.cluster()
      // .size([h, w])
      .size([w/3, h]) 
      // .sort(function(node) { return node.children ? node.children.length : -1; }) // length is the branch length
      .children(function(node) { return node.branchset });

    // var diagonal = d3.phylogram.rightAngleDiagonal();
    var diagonal = d3.svg.diagonal();

    var nodes_1 = tree1(nodes1);
    var nodes_2 = tree2(nodes2);
    
    var xscale_1 = scaleBranchLengths(nodes_1, w, false);
    var xscale_2 = scaleBranchLengths(nodes_2, w, true);
        
    // these are the lines that connect the nodes in tree 1
    // they are svg path elements
    var link_1 = vis1.selectAll("path.link")
        .data(tree1.links(nodes_1))
       .enter().append("svg:path")
        .attr("class", "link_1")
        .attr("d", diagonal)  // diagonal function specifies path between 2 nodes 
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", "1px");

    // these are the lines that connect the nodes in tree 2
    // they are svg path elements
    var link_2 = vis3.selectAll("path.link")
        .data(tree2.links(nodes_2))
      .enter().append("svg:path")
        .attr("class", "link_2")
        .attr("d", diagonal)  // diagonal function specifies path between 2 nodes 
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", "1px");
        
    // define whether it is a root, inner, or leaf node
    function define_node_position(n)
    {
       if (n.children) {
         if (n.depth == 0) {
           return "root node"
         } else {
           return "inner node"
         }
       } else {
         return "leaf node"
       }
    }

    // add nodes to svg canvas for tree 1
    var node_set_1 = vis1.selectAll("g.node")
        .data(nodes_1)
      .enter().append("svg:g")
      // create an svg g element for each node
        .attr("class", "node_1")
        // define whether it is a root, inner, or leaf node
        .attr("class", define_node_position)
        // move nodes to correct position
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })

    // add nodes to svg canvas for tree 2
    var node_set_2 = vis3.selectAll("g.node")
        .data(nodes_2)
      // create an svg g element for each node
      .enter().append("svg:g")
        .attr("class", "node_2")
        // define whether it is a root, inner, or leaf node
        .attr("class", define_node_position)
        // move nodes to correct position
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      
    d3.phylogram.styleTreeNodes(vis1)
    d3.phylogram.styleTreeNodes(vis3)
    
    if (!options.skipLabels) {
      // MDS - 9/2/14 - skip distance labels
      // vis.selectAll('g.inner.node')
        // .append("svg:text")
          // .attr("dx", -6)
          // .attr("dy", -6)
          // .attr("text-anchor", 'end')
          // .attr('font-size', '8px')
          // .attr('fill', '#ccc')
          // .text(function(d) { return d.length; });

      if (true)
      {
      // console.log("making labels");
      // label for all leaf nodes
      vis1.selectAll('g.leaf.node').append("svg:text")
        .attr("dx", 8)
        .attr("dy", 3)
        .attr("text-anchor", "start")
        .attr('font-family', 'Helvetica Neue, Helvetica, sans-serif')
        .attr('font-size', '8x')
        .attr('fill', 'black')
        .text(function(d) { return d.name ; });
      
      vis3.selectAll('g.leaf.node').append("svg:text")
        .attr("dx", -8)
        .attr("dy", 3)
        .attr("text-anchor", "end")
        .attr('font-family', 'Helvetica Neue, Helvetica, sans-serif')
        .attr('font-size', '6x')
        .attr('fill', 'grey')
        .text(function(d) { return d.name ; });
       }
    }
    

    // draw lines
    nodes_1.forEach(function(n)
    {
       if (n.children) { return false; }
       var seg_id = n.name;
       var seg_pair = get_segment_node_pair(seg_id, nodes_1, nodes_2);
       var x1 = seg_pair[0].x;
       var y1 = seg_pair[0].y;
       var x2 = seg_pair[1].x;
       var y2 = seg_pair[1].y;
       var midx = (x1 + x2) / 2;
       var midy = (y1 + y2) / 2;
       var seg_pair_spline_coords =
       [ { "x": x1,   "y": y1 } ,
         { "x": x1, "y": midy } ,
         { "x": x2, "y": midy } ,
         { "x": x2,   "y": y2 } ];

       var lineFunction = d3.svg.line()
                                .x(function(d) { return d.x; })
                                .y(function(d) { return d.y; })
                                // .interpolate("linear"); // for straight line
                                .interpolate("bundle");

       var line_connect = vis1.append("path")
                          // .attr("d", lineFunction(seg_pair)) // for straight line
                          .attr("d", lineFunction(seg_pair_spline_coords))
                          .attr("stroke", "#E8E8E8")
                          .attr("stroke-width", 1)
                          .attr("class", "bridge")
                          .attr("id", seg_id)
                          .attr("fill", "none");

    });

    function get_segment_node_pair(segment_id, nodes_1, nodes_2)
    {
       function match_filter (n) 
       {
          // if (n.name.match(segment_id)) { return true; }
          if (n.name === segment_id) { return true; }
          else { return false; }
       }
       nodes_1_match = nodes_1.filter(match_filter);
       nodes_2_match = nodes_2.filter(match_filter);
       // console.log ("1: " +  nodes_1_match.length + " 2: " + nodes_2_match.length);
       // console.log ("1: " +  nodes_1_match[0].name + " 2: " + nodes_2_match[0].name);
       // console.log ("1: " +  nodes_1_match[0].x + " 2: " + nodes_2_match[0].y);
       return [nodes_1_match[0], nodes_2_match[0]];
    }

    function per_snake_filter(nodes)
    {
       return false;
    }

    
    return {tree: tree1, vis: vis1}
  }  // end build

  
  
}());
