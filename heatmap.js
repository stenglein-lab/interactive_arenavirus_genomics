/* heatmap.js */

(function() {

heatmap = {};


heatmap.render = function(selector){

var sel = d3.select(selector);
var width = sel.style("width");
var width = parseInt(width);
// TODO: what height to use?
var height = 500;

var svg = sel.append("svg")
    .attr("width", width)
    .attr("height", height);

var g = svg.append("g");

// big rectangle covering whole drawing area
g.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
	 .on("click", fade_all); // clear highlighted cities if click anywhere else

// column labels
var column_labels = [];
// row labels
var row_labels = [];
// heatmap data, 
var heatmap_data = [];

// d3.text("http://localhost:8888/l_heatmap_data.txt", function(text) {
d3.text("./l_heatmap_data.txt", function(text) {

  var data = d3.tsv.parseRows(text);
  // row, col indexing will be 0 based 
  var row_ctr = -1;
  data.forEach(function(d)
  {
	  console.log(d);
	  if (row_ctr === -1)
	  {
		  d.shift(); // pop off empty first cell w/out header
		  column_labels = d;
	  }
	  else
	  {
		  var row_label = d.shift();
	     row_labels[row_ctr] = row_label;
		  var col_ctr = 0;
		  d.forEach(function(v) 
		  {
		     var new_cell = {};
		     new_cell.row_label = row_label
		     new_cell.col_label = column_labels[col_ctr];
		     new_cell.row = row_ctr;
		     new_cell.col = col_ctr;
		     new_cell.value = v;
			  col_ctr += 1;
			  heatmap_data.push(new_cell);
			  // better to do this as a 2d array?
		  });
	  }
	  row_ctr += 1;
  });

  render_heatmap();

});

function render_heatmap()
{
   console.dir(column_labels);
   console.dir(row_labels);
   console.dir(heatmap_data);

	// color scale
   var bins = [ 0.01,  0.1, 0.25, 0.5, 1]; 
   var red_colors = [ 'rgb(255, 255, 255)',
                      'rgb(242, 218, 200)',
                'rgb(245, 132, 102)',
                'rgb(241, 90, 34)',
                'rgb(158, 11, 15)',
                'rgb(84, 0, 0)' ];

   var colorScale = d3.scale.threshold()
         .domain(bins)
         .range(red_colors);

	var heatmap_height = height;
	var heatmap_width = width;
	var cell_width = heatmap_width / ( 2 * column_labels.length);
	var cell_height = heatmap_width / ( 2 * row_labels.length );

	// lay out the heatmap
   var heatmap_rects = svg.selectAll(".cells")
              .data(heatmap_data)
              .enter().append("rect")
              .attr("x", function(d) { return d.col * cell_width; })
              .attr("y", function(d) { return d.row * cell_height; })
              .attr("class", "cell")
              .attr("width", cell_width)
              .attr("height", cell_height)
              .style("fill", function(d) { return colorScale(d.value); });
}
} // end heatmap.render

function fade_all() {
   // clear all highlighting
   d3.selectAll(".place-highlighted").attr("class", "place");
}



}());
