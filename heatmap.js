/* heatmap.js */

(function() {

heatmap = {};

// column labels
var s_column_labels = [];
var l_column_labels = [];
// row labels
var s_row_labels = [];
var l_row_labels = [];
// heatmap data, 
var s_heatmap_data = [];
var l_heatmap_data = [];

read_heatmap_data("./l_heatmap_data.txt", l_heatmap_data, l_column_labels, l_row_labels); 
read_heatmap_data("./s_heatmap_data.txt", s_heatmap_data, s_column_labels, s_row_labels); 

// function to render heatmaps
heatmap.render = function(selector) {



   var sel = d3.select(selector);
   var width = sel.style("width");
   var width = parseInt(width);
   // TODO: what height to use?
   var height = 500;

	// how wide should each column be?
	// define width (in column units) of space for labels and spacer b/t 2 heatmaps
	var label_columns = 4;
	var spacer_columns = 2;
   var number_columns = s_column_labels.length + l_column_labels.length + (label_columns * 2) + spacer_columns;
	var s_fraction = (s_column_labels.length + label_columns) / number_columns;
	var l_fraction = (l_column_labels.length + label_columns) / number_columns;
	var column_width = Math.floor(width / number_columns);
	var s_offset = (label_columns/number_columns) * width;
	var l_offset = (s_fraction + (spacer_columns/number_columns) + (label_columns/number_columns)) * width;

	// how high should each cell be?
	var number_rows = s_row_labels.length;
	var row_height = Math.floor((height-150) / number_rows);
   
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
   
   	// color scale
      var bins = [ 0.01,  0.1, 0.25, 0.5, 1]; 
      var red_colors  = [ 'rgb(255, 255, 255)',
                          'rgb(242, 218, 200)',
                          'rgb(245, 132, 102)',
                          'rgb(241, 90, 34)',
                          'rgb(158, 11, 15)',
                          'rgb(84, 0, 0)' ];
      var blue_colors = [ 'rgb(255, 255, 255)',
                          'rgb(207, 224, 237)',
                          'rgb(160, 191, 224)',
                          'rgb(109, 152, 205)',
                          'rgb(71, 99, 174)',
                          'rgb(25, 81, 64)' ];

	render_heatmap(s_heatmap_data, bins, blue_colors, s_column_labels, s_row_labels, s_offset, "S");
	render_heatmap(l_heatmap_data, bins, red_colors, l_column_labels, l_row_labels, l_offset, "L");

   function render_heatmap(heatmap_data, bins, colors, column_labels, row_labels, x_offset, label)
   {
		var g = svg.append("g");

   	// TODO: draw scale
      var colorScale = d3.scale.threshold()
            .domain(bins)
            .range(colors);
   
		var y_offset = 40;  // for space for column labels and main label

   	var heatmap_height = height;
   	var heatmap_width = width;
   	// var cell_width = heatmap_width / ( 2 * column_labels.length);
   	var cell_width = column_width;
   	var cell_height = row_height;

   
		var label_x = x_offset + (column_labels.length / 2) * cell_width;
		var label_text = label + " segment genotype"
   	// add big label
		var main_label = g.append("text")
		  .attr("x", label_x)
		  .attr("y", 0)
		  .attr("y", 0)
		  .attr("class", "main_labels")
		  .attr("dy", "1.5em")
		  .text(label_text);

   	// add column labels
      var col_labels = g.selectAll(".column_labels")
                 .data(column_labels)
                 .enter().append("text")
                 .attr("x", function(d, i) { var x = x_offset + (i * cell_width) + (cell_width / 2); return x; })
                 .attr("y", function(d, i) { return (y_offset); })
                 .attr("dy", "-0.5em")
                 .attr("id", function(d, i) { return "h" + label + " c" + i ; })
                 .attr("class", function (d, i) { return "column_labels" + " h" + label + " c" + i ;})
                 .text(function(d,i) { return (d); })
					  .on("click", highlight_by_col());

   	// lay out the heatmap
      var heatmap_rects = g.selectAll(".cells")
                 .data(heatmap_data)
                 .enter().append("rect")
                 .attr("x", function(d) { return x_offset + d.col * cell_width; })
                 .attr("y", function(d) { return y_offset + (d.row * cell_height); })
                 .attr("class", function(d) { return "cell" + " h" + label + " c" + d.col + " r" + d.row; })
                 // .attr("class", "cell") 
                 .attr("id", function(d) { return " h" + label + " c" + d.col + " r" + d.row; })
                 .attr("width", cell_width)
                 .attr("height", cell_height)
                 .style("fill", function(d) { return colorScale(d.value); });
   }
} // end heatmap.render


function read_heatmap_data(file, heatmap_data, column_labels, row_labels)
{
   d3.text(file, function(text) {

      var data = d3.tsv.parseRows(text);
      // row, col indexing will be 0 based 
      var row_ctr = -1;
      data.forEach(function(d)
      {
        if (row_ctr === -1)
        {
           d.shift(); // pop off empty first cell w/out header
			  // copy column labels
			  var i = 0;
			  d.forEach(function(label){
			     column_labels[i] = label;
				  i++;
			  });
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
   }); // end d3.text
} // end read_heatmap_data

function highlight_by_col_X() {

   return function()
   {
      var col = d3.select(this);
      var col_id = col.attr("id");
      var col_class = col.attr("class");
      console.log ("highlighting column (id): " + col_id);
      console.log ("highlighting column (class): " + col_class);
		var cells_to_select_classes=".cell." + col_id.replace(/ /g,".");
      console.log ("highlighting column (classes): " + cells_to_select_classes);

		// var all_cells = d3.selectAll(".cell"); 
		var all_cells = d3.selectAll(cells_to_select_classes); 
      console.log ("cells_to_hightlight: " + all_cells);
		// all_cells.each().attr("class", function { 
		   // var existing_classes = this.attr("class")
   }
}

function highlight_by_col() {

   return function()
   {
      var col = d3.select(this);
      var col_id = col.attr("id");
      var col_class = col.attr("class");
      console.log ("highlighting column (id): " + col_id);
      console.log ("highlighting column (class): " + col_class);
		var cells_to_select_classes=".cell." + col_id.replace(/ /g,".");
      console.log ("highlighting column (classes): " + cells_to_select_classes);

		// var all_cells = d3.selectAll(".cell"); 
		var all_cells = d3.selectAll(cells_to_select_classes); 
      console.log ("cells_to_hightlight: " + all_cells);
		all_cells.style("stroke", "#000").style("stroke-width", "0.5px");
   }
}

function fade_all() {
   // clear all highlighting
   d3.selectAll(".place-highlighted").attr("class", "place");
}

}());
