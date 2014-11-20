/*

  fasta.js

  A simple javascript wrapper to parse a local fasta file 
  and output it based on the array of highlighted segment ids

*/

// <script src="./queue.js"> </script>

(function() {

fasta = {};

// parse this right away
parse_fasta();

fasta.parse_started = 0;
fasta.seqs = {};

fasta.render = function(selector)
{
	var sel = d3.select(selector);
   sel.append("pre").text(generate_fasta());
};

function generate_fasta()
{
	// parse_fasta();

	// return highlighted_segments.toString();
	var fasta_string = "";
	highlighted_segments.forEach(function(seg_id)
	{
	   var seq = fasta.seqs[seg_id];
		fasta_string = fasta_string + ">" + seg_id + "\n" + seq + "\n";
	});
	return fasta_string;
}

function parse_fasta()
{
   if (!fasta.parse_started)
	{
		fasta.parse_started = 1;
      d3.text("./segment_sequences.fasta", function(error, parsed_text)
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

