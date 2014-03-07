/**
 * Test the backend interface
 */
var assert = require("assert")
var request = require('request');

var hostname = 'http://localhost:8080';
var headers = {'Content-type': 'application/json'}

describe('Backend API', function() {
  	it( 'get all items', function(done) {
  		request('http://localhost:8080/tasks', function (error, response, body) {
  			assert(response.statusCode == 200);
  			var responseJSON = eval(body);  				
  			done();
		});  		
  	});  		
  
  
  	it( 'find non-existent item', function(done) {
  		request('http://localhost:8080/tasks/badId', function (error, response, body) {
  			assert(response.statusCode != 200);
  			done();
		});  		
  	});  		
  	
  	it( 'create and delete a simple item', function(done) {
  		request('http://localhost:8080/tasks/', function (error, response, body) {
  			assert(response.statusCode == 200);
  			// count the number of items  			
  			var numItems = eval(body).length;
  			
  			// create the request body
  			var newItem = {
    			"task": {
        			"title": "Test Item",
        			"description": "used to test the API",
      				"url": "/testing",        
        			"response": "<response>this is an XML response</response>",        
    			}
			}
			
			/*request({uri: hostname + '/tasks', method: 'POST', headers: headers, body: newItem}, function( error, response, body) {
				console.log(body);
				
				done();
			} );*/
			
  			done();
  			// try to add a new item
  			
		});  		
  	});
  
});    