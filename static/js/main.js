// First we have to configure RequireJS
require.config({
    // This tells RequireJS where to find Ractive and rvc
    paths: {
        ractive: 'lib/ractive',
        rv: 'loaders/rv',
        mapbox: 'lib/mapbox',
        jquery: 'lib/jquery-1.11',
        jqueryui: 'lib/jquery_ui',
        versus: 'versus',
		bootstrap: 'bootstrap/bootstrap.min',
        autocomplete: 'lib/jquery.autocomplete'
    },
    shim: {
    	"fullpage": {
    		deps: [ "jquery", "slimscroll" ]
    	},
    	'slimscroll': {
    		deps: [ "jquery" ]
    	},
		'bootstrap': {
			deps: [ "jquery" ]
		},
    	'omnivore': {
    		deps: [ "csv2geojson" ]
    	},
        'flip': {
            deps: ["jquery"]
        },
        'autocomplete': {
            deps: ["jquery"]
        }
    }
});


require(["versus"]);