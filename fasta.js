/*

  fasta.js

  A simple javascript wrapper to parse a local fasta file 
  and output it based on the array of highlighted segment ids

*/

// <script src="./queue.js"> </script>

if (!d3) { throw "error: d3.js is required but not included"};

(function() {

fasta = {};

// parse this right away
parse_fasta();

fasta.parse_started = 0;
fasta.seqs = {};

fasta.render = function(selector)
{
	var sel = d3.select(selector);
   sel.append("pre").attr("class", "fasta_pre").text(generate_fasta());
	return this;
};

fasta.update_highlighted_segments = function(selector){
	clear(selector);
   fasta.render(selector);
}

function generate_fasta()
{
	var fasta_string = "";

	// only a subset will be displayed
	if (highlighted_segments.length > 0)
	{
	   highlighted_segments.forEach(function(seg_id)
	   {
	      var seq = fasta.seqs[seg_id];
		   if (!seq)
		   {
		      console.log ("no sequence available for segment ID: " + seg_id);
		   }
		   else
		   {
		      fasta_string = fasta_string + ">" + seg_id + "\n" + seq + "\n";
		   }
	   });
	}
	else
	{
	   // display all sequences 
	   var seg_ids = Object.keys(fasta.seqs);
		seg_ids.forEach(function(seg_id){
         var seq = fasta.seqs[seg_id];
		   fasta_string = fasta_string + ">" + seg_id + "\n" + seq + "\n";
	   });
	}
	return fasta_string;
}

function parse_fasta()
{
   if (!fasta.parse_started)
	{
		fasta.parse_started = 1;

	   var fasta_file = "./segment_sequences.fasta";
	   // console.log ("parsing fasta file: " + fasta_file);

      d3.text(fasta_file, function(error, parsed_text)
      {
         if (error) return console.warn(error);

         // parse to an array of lines
         all_fasta_lines = parsed_text.match(/[^\r\n]+/g);

			var seq_name = "";
			var seq = "";

			// parse fasta lines
			all_fasta_lines.forEach(function(line) 
			{
			   if (line.match(/^>/))
				{
					if (seq_name.length > 0)
					{
					   fasta.seqs[seq_name] = seq;
						seq = "";
					}
				   seq_name = line.replace(">", "");
				}
				else
				{
				   seq = seq + line;
				}
			});
		   // last record
		   if (seq_name.length > 0)
		   {
		      fasta.seqs[seq_name] = seq;
			   seq = "";
		   }

			
     });
	}
}


}());

