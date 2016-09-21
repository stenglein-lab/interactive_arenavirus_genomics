// main javascript/d3 for rendering cartoons and plots
// 
// Mark Stenglein 8/1/2014

/* segment_cartoons.js */

(function () {

segment_cartoons = {};

var segments_all = [];


// read in segment names from file
d3.text("./segment_names.txt", function(text) {
  var data = d3.tsv.parseRows(text);
  data.forEach(function(d){
     var segment_id = d[0];
     segments_all.push(segment_id);
  });

});



// global vars related to svg plot size

// margins for drawing areas
var plot_margin = {top: 10, right: 40, bottom: 40, left: 50};
var cartoon_margin = {top: 20, right: 40, bottom: 10, left: 50};
var margin = plot_margin;

segment_cartoons.render = function(selector)
{

var sel = d3.select(selector);
var drawing_area = sel;
var width = sel.style("width");
var width = parseInt(width);


// svg canvas width for everything
var svg_width = width - margin.left - margin.right;
   
// y-axis scaling 
// how tall plots will be in pixels
var plot_canvas_height = 120;
var svg_height = plot_canvas_height - margin.top - margin.bottom;

// vars to control printing
var segment_count = 0;
var segments_per_page = 6;

render_segments();

// render some or all segments
function render_segments(segment_filter)
{
   // clear display 1st
   clear_displayed_elements();

   // figure out which segments to display
   var segments = null;
   if (segment_filter)
   {
      // pull out subset of segments to render
      function segment_filter_function(d)
      {
         if (d[0].match(segment_filter)) { return true; }
         else { return false; }
      }
      segments = segments_all.filter(segment_filter_function);
   }
   else
   {
      // all segments (copy whole array)
      segments = segments_all.slice(0);
   }
   for (seg_index = 0; seg_index < segments.length; seg_index++) 
   {
      // var snake_id = segments[seg_index][0];
      var segment_id = segments[seg_index][0];
      render_segment(segment_id);

      // deal w/ pagination
      segment_count++;
      // if ((segment_count === 5) || (segment_count % segments_per_page) == 0)
      if ((segment_count % segments_per_page) === 0)
      {
         console.log("segment " + segment_id + " #: " + segment_count);
         var pb_p = drawing_area.append("p").style("page-break-after", "always").style("text-align", "right");
         var page_number = "page " + (segment_count / segments_per_page);
         // uncomment to add page #s to bottom of page
         // pb_p.text( page_number );
      }
   }
}

function render_segment(segment_id)
{
   var header_text = "segment " + segment_id;
   drawing_area.append("p").text(header_text).attr("class", "header_p")
   draw_all(segment_id);
   return;
}

function draw_all(segment_id)
{
   draw_cartoon(segment_id);
   draw_plots(segment_id);
   return;
}

// draw cartoons of segments showing ORFS and other annotations
function draw_cartoon(segment_id)
{
   console.log ("drawing genome cartoon for segment " + segment_id  );
   
   var width = svg_width;
   var height = 40; // TODO: don't hardcode (or is OK?)

   // add a new svg canvas area
   var svg = drawing_area.append("svg")
    .attr("width", width + cartoon_margin.left + cartoon_margin.right)
    .attr("height", height + cartoon_margin.top + cartoon_margin.bottom ) 
    .append("g")
    .attr("transform", "translate(" + cartoon_margin.left + "," + cartoon_margin.top + ")");
 
    // file w/ annotation data
    var file_name = "210_seg_renamed.tsv"; // TODO - don't hardcode
    // var tsv_data_file = "http://localhost:8888/" + file_name;
    var tsv_data_file = "./" + file_name;

    // read file w/ annotation data
    d3.tsv(tsv_data_file, process_tsv);

    // accessor function to process data from tsv file
    // will actually draw the cartoon
    // this function gets called once d3.tsv is done reading data file (asynchronous)
    function process_tsv(error, all_data)
    {

    // Coerce the data to numbers.
    all_data.forEach(function(d) {
       d.start = +d.start;
       d.stop = +d.stop; });

    // pull out subset we're interested in
    function this_segment_data(d)
    {
       return d.segment === segment_id;
    }
    var data = all_data.filter(this_segment_data);

    // figure out how long this segment is
    var seq_length = 1;
    data.forEach(function(d) 
    { 
       if (d.type === "S")
       {
          seq_length = d.stop;
       }
    });

    // setup scales for drawing

    // Compute the scales’ domains.
    var nt_x = d3.scale.linear();

     var max_nt = 8000;
     if (seq_length < 4000)
     {
         max_nt = max_nt / 2;
         width = width / 2;
     }

     nt_x.domain([1, max_nt]); // 8000 nt will be width of drawing area for L segs
     nt_x.range([0,width]);

     // y scale 
     // remember: input domain,  output range
     // y units for drawing objects will be 0-100
     // so, like a percentage of whatever the height of the drawing area is
     var y_scale = d3.scale.linear();
     y_scale.range([height, 0]);
     y_scale.domain([0, 100]);

     // draw a line for the segment
     var y_midpoint = 30; // these units in % of drawing area, essentially
     var orf_height = 25;
     var seg_line_data = [ { "x": 1,          "y": y_midpoint},  
                           { "x": seq_length, "y": y_midpoint}];

     var seg_line = d3.svg.line()
         .x(function(d) { return nt_x(d.x); })
         .y(function(d) { return y_scale(d.y); });

     var ss_lineGraph = svg.append("g").append("path")
                        .attr("d", seg_line(seg_line_data))
                        .attr("stroke", "black")
                        .attr("stroke-width", 1)
                        .attr("fill", "none");

     // -----------------------------------
     // draw ORFs and partial ORFS cartoons
     // -----------------------------------

     // create a subset of all features that are ORFs or partial ORFs
     function get_orf_data(d)
     {
        if (d.type === 'L' || d.type === 'Z' || d.type === 'PL' || d.type === 'PZ') { return true; }
        else if (d.type === 'NP' || d.type === 'GPC' || d.type === 'PNP' || d.type === 'PGPC') { return true; }
        else { return false; }
     }
     var orf_data = data.filter(get_orf_data);
 
     // for each of these features
     orf_data.forEach(function(d)
     {
        var orf_label = "";
        var orf_color = "steelblue";

        // hexadecimal RGB color codes
        var l_color = "#DF9496";
        var z_color = "#F6F4DA";
        var gp_color = "#D9E2E1";
        var np_color = "#A1BFDF";
        // var np_color = "#727B84";
        // other options
        // #F58466 --> a red from heatmap
        // #A1BFDF --> a blue from heatmap

        //  ORF colors 
        if (d.type === 'L' || d.type === 'PL' ) { orf_color = l_color; } 
        else if (d.type === 'Z' || d.type === 'PZ' ) { orf_color = z_color; } 
        else if (d.type === 'GPC' || d.type === 'PGPC' ) { orf_color = gp_color; } 
        else if (d.type === 'NP' || d.type === 'PNP' ) { orf_color = np_color; } 

        //  ORF labels 
        if (d.type === 'L' || d.type === 'Z' || d.type === 'NP' || d.type === 'GPC') { orf_label = d.type + " CDS"; }
        else if (d.type === 'PL' || d.type === 'PZ' || d.type === 'PNP' || d.type === 'PGPC') { orf_label = d.type.substring(1) }

        //               |-| <- arrow_delta
        //  -------------\
        //  |             \
        //  |             /|
        //  -------------/ |
        //  |              |   
        //  start          stop
        //
        // draw arrow-boxes for each ORF
        var arrow_delta = 80; // nt units 
        if (d.stop < d.start)
        {
           // anti-sense feature
           arrow_delta = 0-arrow_delta;
        }

        // setup coordinates of the box to draw for the orf
        var orf_line_data = [ { "x": (d.start + (arrow_delta / 4)),    "y": y_midpoint },  
                              { "x": d.start,    "y": (y_midpoint + orf_height)},  
                              { "x": d.stop - arrow_delta,    "y": (y_midpoint + orf_height)},  
                              { "x": d.stop,     "y": y_midpoint },  
                              { "x": d.stop - arrow_delta,     "y": (y_midpoint - orf_height) },  
                              { "x": d.start,    "y": (y_midpoint - orf_height) },
                              { "x": (d.start + (arrow_delta/4)),    "y": y_midpoint } 
                              ];  
   
        var orf_line = d3.svg.line()
            .x(function(d) { return nt_x(d.x); })
            .y(function(d) { return y_scale(d.y); });

        // fudge factor for partial ORF labels, which overlap
        // do it differently for L and Z and NP and GPC so the labels don't overlap
        var partial_label_offset = 0;
        if (d.type === 'PZ' || d.type === 'PGPC' )
        {
           partial_label_offset = 45;
        }
        else if ( d.type === 'PL' || d.type === 'PNP' )
        {
           partial_label_offset = -45;
        }
   
        var orf_lineGraph = svg.append("g").append("path")
                           .attr("d", orf_line(orf_line_data))
                           .attr("stroke", "black")
                           .attr("stroke-width", 1.5)
                           .attr("fill", orf_color);

        // Add a label for the ORF
        var label_x = nt_x(partial_label_offset + (d.start + d.stop)/2);
        var label_y = y_scale(y_midpoint + orf_height + 30);
        svg.append("text")
        .attr("font", "helvetica")
        .attr("text-anchor", "middle")
        .attr("x", label_x)
        .attr("y", label_y)
        .text(orf_label);


        // Add an upper label for partial ORFs
        if (d.type === 'PZ' || d.type === 'PL' || d.type === 'PNP' || d.type === 'PGPC' )
        {
           var label_x = nt_x(partial_label_offset + (d.start + d.stop)/2);
           var label_y = y_scale(y_midpoint + orf_height + 65);
           svg.append("text")
           .attr("font", "helvetica")
           .attr("text-anchor", "middle")
           .attr("x", label_x)
           .attr("y", label_y)
           .text("partial");
        }

     }); // end foreach orf
      
     // --------------------------------------
     // draw triangles for terminal sequences
     // --------------------------------------

     // create a subset of all features that are end motifs
     function get_end_data(d)
     {
        if (d.type === 'E') { return true; }
        else if (d.type === 'PE') { return true; }
        else { return false; }
     }
     var end_data = data.filter(get_end_data);
 
     // for each of these features
     end_data.forEach(function(d)
     {

        var end_color = "purple";

        //     
        //  -\
        //  | \
        //  | / 
        //  -/  
        //  |   
        //  start
        //
        // draw arrow-boxes for each end motif
        var arrow_delta = 20; // nt units 
        if (d.stop < d.start)
        {
           arrow_delta = 0-arrow_delta;
        }
        // coordinates of little box thingy for end features
        var end_line_data = [ { "x": (d.start + (arrow_delta / 4)),    "y": y_midpoint },  
                              { "x": d.start,    "y": (y_midpoint + orf_height)},  
                              { "x": d.stop - arrow_delta,    "y": (y_midpoint + orf_height)},  
                              { "x": d.stop,     "y": y_midpoint },  
                              { "x": d.stop - arrow_delta,     "y": (y_midpoint - orf_height) },  
                              { "x": d.start,    "y": (y_midpoint - orf_height) },
                              { "x": (d.start + (arrow_delta/4)),    "y": y_midpoint } 
                              ];  
   
        var end_line = d3.svg.line()
            .x(function(d) { return nt_x(d.x); })
            .y(function(d) { return y_scale(d.y); });
   
        var end_lineGraph = svg.append("g").append("path")
                           .attr("d", end_line(end_line_data))
                           .attr("stroke", "black")
                           .attr("stroke-width", 1.5)
                           .attr("fill", end_color);

     }); // end foreach end motif
      

     // --------------------------------------
     // draw triangles for recombination jxns
     // --------------------------------------

     // create a subset of all features that are rj (recombination jxn) motifs
     function get_rj_data(d)
     {
        if (d.type === 'RJ') { return true; }
        else { return false; }
     }

     var rj_data = data.filter(get_rj_data);
 
     // for each of these features
     rj_data.forEach(function(d)
     {
        var rj_color = "red";

        //     
        //  ______
        //  \   /
        //   \ / 
        //    |   
        // midpoint
        //
        var arrow_halfwidth = 40; // nt units 
        var arrow_midpoint = (d.start + d.stop ) / 2;
        var arrow_height = orf_height / 2; 

        // coordinates of arrowhead
        var rj_line_data = [ { "x": (arrow_midpoint - arrow_halfwidth) ,    "y": (y_midpoint+orf_height+arrow_height+10) },  
                             { "x": (arrow_midpoint + arrow_halfwidth) ,    "y": (y_midpoint+orf_height+arrow_height+10) },  
                             { "x": (arrow_midpoint + 0              ) ,    "y": (y_midpoint+orf_height+ 10            ) },  
                             { "x": (arrow_midpoint - arrow_halfwidth) ,    "y": (y_midpoint+orf_height+arrow_height+10) },  
                              ];  

        // draw a dashed line too
        var dashed_line_extra = 15;
        var rj_dashed_line_data = [ 
                                   { "x": arrow_midpoint,    "y": (y_midpoint + orf_height + dashed_line_extra) },  
                                   { "x": arrow_midpoint,    "y": (y_midpoint - orf_height - dashed_line_extra) },  
                                  ];  
   
        var rj_line = d3.svg.line()
            .x(function(d) { return nt_x(d.x); })
            .y(function(d) { return y_scale(d.y); });
   
        var rj_lineGraph = svg.append("g").append("path")
                         .attr("d", rj_line(rj_dashed_line_data))
                         .attr("stroke", "red")
                         .attr("stroke-width", 2)
                         .style("stroke-dasharray", ("1, 1"))  ;

         var rj_lineGraph = svg.append("g").append("path")
                         .attr("d", rj_line(rj_line_data))
                         .attr("stroke", "black")
                         .attr("stroke-width", 1.5)
                         .attr("fill", rj_color);

     }); // end foreach rec jxn (rj)
      

   }; // end process_tsv 

   return;

} // end draw_cartoons


// draw plots (tracks) for a segment
function draw_plots(segment_id)
{
   console.log ("drawing plots for segment " + segment_id  );
   
   var width = svg_width;
   var height = svg_height;

   // add a new svg canvas area
   var svg = drawing_area.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
 
    var file_name = segment_id + ".tsv";
    // console.log ("opening " + file_name);
    // var tsv_data_file = "http://localhost:8888/" + file_name;
    var tsv_data_file = "./" + file_name;

    // read file w/ coverage data
    d3.tsv(tsv_data_file, process_tsv);

    // accessor function to process data from tsv file
    // will actually draw the plots
    // this function gets called once d3.tsv is done reading data file (asynchronous)
    function process_tsv(data)
    {

    // Coerce the data to numbers.
    data.forEach(function(d) {
       d.x = +d.x;
       d.coverage = +d.coverage;
       // this because secondary structure data is sparse (not a y for each x)
       if (d.secondary_structure == 0) { d.secondary_structure = null; }
       else { d.secondary_structure = +d.secondary_structure; }
     });

    // get subset of x,y points for which secondary structure data exists
    function valid_ss_data(d)
    {
       return d.secondary_structure != null;
    }
    var ss_data = data.filter(valid_ss_data);

     // Make scales for displaying data
     var nt_x = d3.scale.linear();
     var max_x =  d3.max(data, function(d) { return d.x});

     var max_nt = 8000;
     if (max_x < 3500)
     {
         // S segments < 3500 (most of them)
         max_nt = 3500;
         width = width * 3.5 / 8;
     }
     else if (max_x < 4000)
     {
         // S segments 3500-4500
         max_nt = 4000;
         width = width * 4 / 8;
     }
     else if (max_x < 7000)
     {
         // for most L segments
         max_nt = 7000;
         width = width * 7 / 8 ;
     }
     else if (max_x < 7500)
     {
         // for most L segments
         max_nt = 7500;
         width = width * 7.5 / 8 ;
     }

     nt_x.domain([1, max_nt]); // 8000 nt will be width of drawing area for L segs
     nt_x.range([0,width]);

     // console.log ("max_nt: " + max_nt + " width: " + width);
    
     // Add the x-axis.
     // transform the x axis height y units to push it down to the bottom of the graph
     svg.append("g")
         .attr("class", "x axis")
         .attr("transform", "translate(0," + height + ")")
         .call(d3.svg.axis().scale(nt_x).orient("bottom"));

     // Add an x-axis label.
     svg.append("text")
     .attr("class", "x label")
     .attr("font", "helvetica")
     .attr("text-anchor", "middle")
     .attr("x", ( width / 2 ) )
     .attr("y", height + 35 )
     .text("genome position (nt)");

     // make y scales and axes now

     // max value for y-axis log coverage
     var max_y =  d3.max(data, function(d) { return d.coverage});
     if (max_y < 1000) { max_y = 10000; }
     else if (max_y < 10000) { max_y = 100000; }
     else if (max_y < 100000) { max_y = 1000000; console.log ("that's some pretty high coverage! " + max_y); }

     // cov_y is a (log) scale for the coverage y value 
     var cov_y = d3.scale.log();
     // remember, y-coords start at top of page so y axis is "upside down"
     cov_y.range([height, 0]);
     cov_y.domain([1, max_y]);

     // secondary structure y axis -> 0-100
     // remember: input domain,  output range
     var ss_y = d3.scale.linear();
     ss_y.range([height, 0]);
     ss_y.domain([0, 100]);   // 0-100 here refers to -∆G values
         
     // variables to handle positioning of multiple y axes
     var scale_number = 0;
     var y_axis_offset = -70; // for subsequent axes
     var y_axis_text_offset = -37;

     // checkboxes to turn on/off tracks
     var cov_check_box = document.getElementById('cov_check');
     var ss_check_box = document.getElementById('ss_check');

     // Plot coverage track
     if (cov_check_box.checked)
     {
        // Add the coverage y-axis.
        svg.append("g")
            .attr("class", "cov y axis")
            .attr("transform", "translate(" + (scale_number * y_axis_offset) +", 0)")
            .call(d3.svg.axis().scale(cov_y).orient("left").ticks(0))
            .selectAll(".tick text")
              .text(null)
            .filter(powerOfTen)
              .text(10)
            .append("tspan")
              .attr("dy", "-.7em")
              .text(function(d) { return Math.round(Math.log(d) / Math.LN10); });

         function powerOfTen(d) 
         {
           return d / Math.pow(10, Math.ceil(Math.log(d) / Math.LN10 - 1e-12)) === 1;
         }

        // coverage y-axis label
        svg.append("text")
        .attr("class", "cov y label")
        .attr("text-anchor", "middle")
        .attr("y", ((scale_number * y_axis_offset) + y_axis_text_offset))
        .attr("x", 0 - (height / 2) )
        // .attr("dy", "1em") // units of em shift text by size of current font
        .attr("transform", "rotate(-90)")
        .text("coverage");

        scale_number++;

        // this is the line for the coverage data
        // var cov_lineFunction = d3.svg.line()
        //   .x(function(d) { return nt_x(d.x); })
        //   // since log scale 0 not allowed -> 0.1 will be below axis, therefore 0-like
        //   .y(function(d) { if (d.coverage < 1) { return cov_y(1); } else { return cov_y(d.coverage); } });

        // to fill under line, better to use an area than a filled line
        var cov_lineFunction = d3.svg.area()
           .x(function(d) { return nt_x(d.x); })
           // since log scale 0 not allowed -> 0.1 will be below axis, therefore 0-like
           .y0(cov_y(1))
           .y1(function(d) { if (d.coverage < 1) { return cov_y(1); } else { return cov_y(d.coverage); } });

        var cov_lineGraph = svg.append("g").append("path")
                           .attr("d", cov_lineFunction(data))
                           .attr("class", "cov_line");
     }

     // plot secondary structure (-dG) track
     if (ss_check_box.checked)
     {
        // Add the secondary structure size y-axis.
        svg.append("g")
            .attr("class", "ss axis")
            // .attr("transform", "translate(" + (scale_number * y_axis_offset) +", 0)")   // left axis
            .attr("transform", "translate(" +  (width + 4) + ", 0)")
            .attr("fill", "red")
            .call(d3.svg.axis().scale(ss_y).orient("right").ticks(3));
   
        // secondary structure y-axis label
        svg.append("text")
        .attr("class", "ss y label")
        .attr("text-anchor", "middle")
        // .attr("y", ((scale_number * y_axis_offset) + y_axis_text_offset + 10))
        .attr("y", width + 50)
        .attr("x", 0 - (height / 2) )
        .attr("fill", "red")
        .attr("transform", "rotate(-90)")
        .text("-∆G (kcal/mol)");

        // secondary structure y-axis label
        // svg.append("text")
        // .attr("class", "ss y label")
        // .attr("text-anchor", "middle")
        // .attr("y", ((scale_number * y_axis_offset) + y_axis_text_offset)+12)
        // .attr("x", 0 - (height / 2) )
        // // .attr("dy", "1em") // units of em shift text by size of current font
        // .attr("fill", "grey")
        // .attr("transform", "rotate(-90)")
        // .text("(∆G<50 grey)");

        // this complicated business creates a "gradient" to color structure values above 50 red
        // and those below 50 grey 
        svg.append("linearGradient")
         .attr("id", "energy-gradient")
         .attr("gradientUnits", "userSpaceOnUse")
         .attr("x1", 0).attr("y1", ss_y(0))
         .attr("x2", 0).attr("y2", ss_y(100))
        .selectAll("stop")
         .data([
           {offset: "0%", color: "darkslategray"},   // mess with these values to change gradient
           {offset: "30%", color: "darkslategray"},
           {offset: "70%", color: "red"},
           {offset: "100%", color: "red"}
         ])
       .enter().append("stop")
         .attr("offset", function(d) { return d.offset; })
         .attr("stop-color", function(d) { return d.color; });
   
   
        // this is the line for the secondary structure prediction data
        var ss_lineFunction = d3.svg.line()
           // .x(function(d) { if (d.x % 5) { return undefined; } else { return nt_x(d.x);}  })
           .defined(function(d) { return d.secondary_structure != null; })
           .x(function(d) { return nt_x(d.x);  })
           .y(function(d) { return ss_y(d.secondary_structure);})
           .interpolate("linear");
   
        // draw the 2˚ structure line
        var ss_lineGraph = svg.append("g").append("path")
                           .attr("d", ss_lineFunction(ss_data))
                           .attr("class", "ss_line")
                           .attr("stroke-width", 1)
                           .attr("fill", "none");

        // draw a scale box for the gradient 
        var ss_colorbar = svg.append("g").append("rect")
                          .attr("class", "ss_box")
                          .attr("width", 4)
                          .attr("height", height)
                          .attr("y", 0)
                          // .attr("x", (scale_number * y_axis_offset))
                          .attr("x", width)

     }  // end plot sec structure

   }; // end proess_tsv callback

} // end draw_plots
}

}());
