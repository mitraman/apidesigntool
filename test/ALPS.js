/**
 * New node file
 */

 
var goodProfile = 
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

var assert = require("assert");

describe('ALPS', function() {
	
	/*
	it( 'no ALPS root', function(done) {
		var ALPS = require('../ALPSProfile.js');
		var profileObject = {"descriptor" : [  { "id" : "search", "type" : "safe", "doc" : {"value" : "A search form with a two inputs" } } ] };
		
		ALPS.readJSON(profileObject, function(error) {
			assert(error.indexOf(ALPS.ERR_ROOT_MISSING) > -1, 'Incorrect or missing error message (' + error + ')');
			done();
		});
	}); 
	
	it( 'descriptor is not array', function(done) {
		var ALPS = require('../ALPSProfile.js');
		var profile = {"alps" : { "descriptor" : { "id" : "search", "type" : "safe", "doc" : {"value" : "A search form with a two inputs" } } } };
		ALPS.readJSON(profile, function(error) {			
			assert(error.indexOf(ALPS.ERR_DESCRIPTOR_NOT_ARRAY) > -1, 'Incorrect or missing error message (' + error + ')');
			done();
		});	
	});
	
	it( 'nested descriptor is not array', function(done) {
		var ALPS = require('../ALPSProfile.js');
		var profile = {"alps" : { "descriptor" : [ { "id" : "search", "type" : "safe", "descriptor" : { "id" : "nested", "type" : "safe" } } ] } };
		ALPS.readJSON(profile, function(error) {
			assert(error.indexOf(ALPS.ERR_DESCRIPTOR_NOT_ARRAY) > -1, 'Incorrect or missing error message (' + error + ')');
			done();
		});	
	});
	
	it( 'duplicate descriptor IDs', function(done) {
		var ALPS = require('../ALPSProfile.js');
		var profile = { "alps" : { "descriptor" : [  { "id" : "search", "type" : "safe", "doc" : {"value" : "A search form with a two inputs" } }, {"id" : "search", "type" : "safe"} ] } };
		ALPS.readJSON(profile, function(error) {
			assert(error.indexOf(ALPS.ERR_DUPE_ID) > -1, 'Incorrect or missing error message (' + error + ')');
			done();
		});	
	});

	it( 'case sensitivity test', function(done) {
		var ALPS = require('../ALPSProfile.js');
		var profile = { "alps" : { "descRiPtor" : [  { "ID" : "blah", "type" : "SaFe", "doc" : {"value" : "A search form with a two inputs" } }, {"id" : "blah", "type" : "safe"} ] } };
		ALPS.readJSON(profile, function(error) {
			assert(error.indexOf(ALPS.ERR_DUPE_ID) > -1, 'Incorrect or missing error message (' + error + ')');
			done();
		});		
	});
	
	it( 'missing type property', function(done) {
		var ALPS = require('../ALPSProfile.js');
		var profile = { "alps" : { "descriptor" : [  { "ID" : "search", "type" : "SaFe" }, {"id" : "blah"} ] } };
		ALPS.readJSON(profile, function(error) {
			assert(error.indexOf(ALPS.ERR_TYPE_MISSING) > -1, 'Incorrect or missing error message (' + error + ')');
			done();
		});		
	});  
	
	*/
	
	console.log('starting test 1...');
	it( 'reference to bad descriptor', function(done) {
		var ALPS = require('../ALPSProfile.js');
		var profile = { "alps" : { "descriptor" : [  { "ID" : "search", "type" : "SaFe" }, {"href" : "#doesnotexist"} ] } };
		ALPS.readJSON(profile, function(error) {
			console.log('calling done 1');
			assert(error.indexOf(ALPS.ERR_TYPE_MISSING) > -1, 'Incorrect or missing error message (' + error + ')');			
			done();
		});		
	});
	
	console.log('I should not get here until test 1 is done.');

	console.log('starting test 2');
	it( 'good profile', function(done) {
		var ALPS = require('../ALPSProfile.js');
		ALPS.readJSON(goodProfile, function(error) {
			assert(error == null, error);
			console.log(ALPS.version);
			console.log(ALPS.descriptors);
			done();
		});				
	});  
});
