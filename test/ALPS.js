/**
 * New node file
 */

 
var testProfile = 
{ 
    "alps" : {
        "version" : "1.0",
        "doc" : {
            "href" : "http://example.org/samples/full/doc.html"
        },
        "descriptor" : [
            {
                "id" : "search", 
                "type" : "safe",
                "doc" : {"value" : 
                    "A search form with a two inputs"
                },
                "descriptor" : [
                    {
                        "id" : "value",
                        "name" : "search",
                        "type" : "descriptor",
                        "doc" : {"value" : "input for search"}
                    },
                    {"href" : "#resultType"}
                ]
            },
           {
                "id" : "resultType",
                "type" : "descriptor",
                "description" : {"value" : "results format"},
                "ext" : [
                    {
                        "href" : "http://alps.io/ext/range", 
                        "value" : "summary,detail"
                    }
                ]
            }
        ]  
    }
};

var ALPS = require('../ALPSProfile.js');
var assert = require("assert");

describe('ALPS', function() {
	it( 'no ALPS root', function(done) {
		var noRoot = {"descriptor" : [  { "id" : "search", "type" : "safe", "doc" : {"value" : "A search form with a two inputs" } } ] };
		console.log(noRoot);
		ALPS.readJSON(noRoot, function(err) {
			assert(err != null);
			done();
		});
	}); 

	it( 'good profile', function(done) {
		ALPS.readJSON(testProfile, function(error) {
			assert(error == null);
			done();
		});
		
	});  
});
