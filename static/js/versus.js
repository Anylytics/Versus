// Now we've configured RequireJS, we can load our dependencies and start
define([ 'ractive', 'rv!../ractive/versus', 'jquery', 'bootstrap', 'autocomplete', 'players', 'history'], function ( Ractive, html, $, bootstrap, autocomp, opponents, hist) {


	var versusRactive = new Ractive({
	  el: 'versus-ractive',
	  data: {
	  	opponentone: "",
	  	opponentoneID: "",
	  	opponentone_country: "",
	  	opponenttwo_country: "",
	  	opponenttwo: "",
	  	opponenttwoID: "",
	  	advantage_name: "",
	  	advantage_ratio: "",
	  	opponentone_initials: "",
	  	opponenttwo_initials: "",
	  	wintimeline: {},
	  	surface: "Overall",
        aces: [50, 50],
        df: [50, 50],
        FstWin: [50, 50],
        SndWin: [50, 50],
        rWins: {'Overall': 0, 'Clay' : 0, 'Carpet': 0, 'Hard': 0, 'Grass': 0},
        oWins: {'Overall': 0, 'Clay' : 0, 'Carpet': 0, 'Hard': 0, 'Grass': 0},
        nonzero: function(value) {
        	if (value > 0) 
        		return value;
        },
        getPercentage: function(data) {
        	return data[0] / (data[0]+data[1]) * 100;
        }
      },
	  template: html
	});

	function clearData() 
	{
		versusRactive.set("aces", [50, 50]);
		versusRactive.set("df",[50, 50]);
		versusRactive.set("FstWin", [50, 50]);
		versusRactive.set("SndWin", [50, 50]);
		versusRactive.set("rWins", {'Overall': 0, 'Clay' : 0, 'Carpet': 0, 'Hard': 0, 'Grass': 0});
		versusRactive.set("oWins", {'Overall': 0, 'Clay' : 0, 'Carpet': 0, 'Hard': 0, 'Grass': 0});
		versusRactive.set("advantage_name", "");
		versusRactive.set("advantage_ratio", "");
		versusRactive.set("opponentone_country", "");
		versusRactive.set("opponenttwo_country", "");
		versusRactive.set("wintimeline", "");
		versusRactive.set("opponentone_initials", "");
		versusRactive.set("opponenttwo_initials", "");
		versusRactive.set("opponentoneID", "");
		versusRactive.set("opponenttwoID", "");
	}



	function convertNumber(number)
	{
		var str = "" + number
		var pad = "0000"
		var ans = pad.substring(0, pad.length - str.length) + str
		return ans
	}

	function loadMatch(ID1, ID2)
	{
		$.ajax({
	        url: "./name/"+ID1+"/"+ID2,
	        dataTye: "json",
	        success: function(json) {
	        	console.log(json["name"]);
	        	versusRactive.set("opponentone", json["name"][0]);
	        	versusRactive.set("opponenttwo", json["name"][1]);
	        	$('#autocomplete-one').autocomplete().clear();
				$('#autocomplete-one').autocomplete().element.value = json["name"][0];
				$('#autocomplete-two').autocomplete().clear();
				$('#autocomplete-two').autocomplete().element.value = json["name"][1];
	        	refreshOpponents(json["name"][0]);
	        	refreshData(json["name"][0], json["name"][1], "Overall");
	        }
	    });

	   
	}

	function refreshData(opponent1, opponent2, surface)
	{
		$.ajax({
	        url: "./id/"+opponent2,
	        dataTye: "json",
	        success: function(json) {
	        	versusRactive.set("opponenttwoID", json["playerID"]);
	        }
	    });

		$.ajax({
	        url: "./country/"+opponent2,
	        dataTye: "json",
	        success: function(json) {
	        	versusRactive.set("opponenttwo_country", json['country']);
	        }
	    });

		$.ajax({
	        url: "./versus/"+opponent1+"/"+opponent2+"/"+surface,
	        dataTye: "json",
	        success: function(json) {
	        	//Generate URL
	        	var url = convertNumber(versusRactive.get("opponentoneID")) + convertNumber(versusRactive.get("opponenttwoID"));
	        	History.pushState(null, url, "?match="+url); 
	            // Calculate Ace Percentage
	            versusRactive.set("aces", [json["r_aces"], json["o_aces"]] );

	            versusRactive.set("df", [ json["r_df"], json["o_df"] ]);
	            //Rafa First Serve Win
	            rafa_fs = Math.round(json["r_1stWon"] / json["r_1stIn"] * 100);
	            //Opponent First Serve Win
	            opp_fs = Math.round(json["o_1stWon"] / json["o_1stIn"] * 100);
	            versusRactive.set("FstWin", [ rafa_fs , opp_fs ] );

	            //Rafa Second Serve Win
	            rafa_ss = Math.round(json["r_2ndWon"] / (json["r_svpt"] - json["r_1stIn"] - json["r_df"]) * 100);
	            //Opponent Second Serve Win
	            opp_ss = Math.round(json["o_2ndWon"] / (json["o_svpt"] - json["o_1stIn"] - json["o_df"]) * 100);
	            versusRactive.set("SndWin", [ rafa_ss , opp_ss ] );

	            versusRactive.set("rWins", json["r_win"]);
	            versusRactive.set("oWins", json["o_win"]);

	            var adv = "B Toss Up";
	            var wins = "";
	            if ( parseInt(json["r_win"][surface]) > parseInt(json["o_win"][surface]) ){
	            	adv = opponent1;
	            	wins = json["r_win"][surface] + "/"+(parseInt(json["r_win"][surface])+parseInt(json["o_win"][surface]));
	            }
	            if ( parseInt(json["r_win"][surface]) < parseInt(json["o_win"][surface]) ){
	            	adv = opponent2;
	            	wins = json["o_win"][surface] + "/"+(parseInt(json["r_win"][surface])+parseInt(json["o_win"][surface]));
	            }
	            versusRactive.set("advantage_name", adv.split(" ").slice(1).join(" "));
	            versusRactive.set("opponentone_initials", opponent1.split(' ').map(function (s) { return s.charAt(0); }).join(''));
	            versusRactive.set("opponenttwo_initials", opponent2.split(' ').map(function (s) { return s.charAt(0); }).join(''));
	            versusRactive.set("advantage_ratio", wins);
	            versusRactive.set("wintimeline", json["wintimeline"])
	            
	            //versusRactive.set("opponenttwo_country", json['o_country']);
	            console.log(json);
	            

	        }
	    });
	}

	function refreshOpponents(player)
	{
		
		clearData();

		$.ajax({
	        url: "./id/"+player,
	        dataTye: "json",
	        success: function(json) {
	        	versusRactive.set("opponentoneID", json['playerID']);
	        }
	    });


		$.ajax({
	        url: "./country/"+player,
	        dataTye: "json",
	        success: function(json) {
	        	versusRactive.set("opponentone_country", json['country']);
	        }
	    });


		$.ajax({
	        url: "./opponents/"+player,
	        dataTye: "json",
	        success: function(json) {
	        	if (versusRactive.get("opponenttwo") != "")
				{	
					if (json['opponents'].indexOf(versusRactive.get("opponenttwo")) == -1)
					{
						versusRactive.set("opponenttwo", "");
						$('#autocomplete-two').autocomplete().clear();
						$('#autocomplete-two').autocomplete().element.value = "";
					}
					else
					{
						refreshData(player, versusRactive.get("opponenttwo"), versusRactive.get("surface"));
					}
				}
				$('#autocomplete-two').autocomplete().setOptions({lookup: json['opponents']});
	        	console.log(json);
	        }
	    });



		
	}

	versusRactive.on( 'changeSurface', function( event, object )  {
		versusRactive.set("surface", object);
		refreshData(versusRactive.get("opponentone"), versusRactive.get("opponenttwo"), versusRactive.get("surface"));
	});

	$('#autocomplete-one').autocomplete({
	    lookup: opponents,
	    onSelect: function (suggestion) {
	       if (!(suggestion.value === versusRactive.get("opponentone")))
		   {
		       versusRactive.set("opponentone", suggestion.value);
		       refreshOpponents(versusRactive.get("opponentone"));
		   }
		}
	});
	
	$('#autocomplete-two').autocomplete({
	    lookup: [""],
	    onSelect: function (suggestion) {
	       versusRactive.set("opponenttwo", suggestion.value);
	       refreshData(versusRactive.get("opponentone"), versusRactive.get("opponenttwo"), versusRactive.get("surface"));
		}
	});

	$('#autocomplete-one').keypress(function() {
		adjustFontSize($(this));
	});

	$('#autocomplete-two').keypress(function() {
		adjustFontSize($(this));
	});

	$('.autocomplete-suggestions').click(function() {
   		if ($('autocomplete-one')!='') {
   			adjustFontSize($('#autocomplete-one'));
   		}
   		if ($('autocomplete-two')!='') {
   			adjustFontSize($('#autocomplete-two'));
   		}
	});

	$('body').keyup(function(e){
	   if(e.keyCode == 8){
	   		if ($('autocomplete-one')!='') {
	   			adjustFontSize($('#autocomplete-one'));
	   		}
	   		if ($('autocomplete-two')!='') {
	   			adjustFontSize($('#autocomplete-two'));
	   		}
	   }
	});

	function adjustFontSize(inputBox) {
	  
		var textLength = inputBox.val().length;

		if(textLength < 10) {
			inputBox.css('font-size', '1em');
		} else if (textLength >= 10	&& textLength < 20) {
			var textSize = 1-(textLength-10)/20;
			inputBox.css('font-size', textSize+'em');
		} else if (textLength >= 20 ) {
			inputBox.css('font-size', '0.5em');
		}

	}

	$(function () {
	  $('[data-toggle="tooltip"]').tooltip()
	})

	//Get the State (matchID) if one exists
	var matchID = History.getState()['title'];
	if (matchID != "")
	{
		var ID1 = matchID.substring(0,4);
		var ID2 = matchID.substring(4);
		if (!isNaN(ID1) & !isNaN(ID2))
		{
			//Passed basic validation. Attempt to pollinate database
			loadMatch(ID1, ID2);
		}
	}


    return versusRactive;

});
