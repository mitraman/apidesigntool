/**
 * A representation of an ALPS profile
 */
 
 
 var version;
 var descriptors = [];
 
 module.exports.readJSON = readJSON;
 
 // ALPSObject: an object representing ALPS profile in JSON
 function readJSON(ALPSObject, callback) {
 
 	// make sure there is an alps root element
 	if( !ALPSObject.hasOwnProperty('alps')) {
 		callback("the ALPS root property is not defined");
 		return;		
 	}
 	
 	var ALPSRoot = ALPSObject.alps;
 	version = ALPSRoot.version;
 	var doc = ALPSRoot.doc;
 	var descriptor = ALPSRoot.descriptor;
 	
 	// recursively parse the descriptor objects
 	if( ALPSRoot.hasOwnProperty('descriptor') ) {
 		parseDescriptor(ALPSRoot.descriptor);
 	}
 	
 	callback(null); 	
 	
 } 
 
 function parseDescriptor(descriptorList) {
 	console.log('here');
 	// TODO: make sure that this descriptor is an array
 	
 	// look for child descriptors in each descriptor before we parse
 	for( var id in descriptorList ) {
 		var descriptor = descriptorList[id];
 		if( descriptor.hasOwnProperty('descriptor') ) {
 			parseDescriptor(descriptor.descriptor);
 		}
 	}
 	
 	// Second pass : begin storing descriptors before passing control to the parent
 	for( var id in descriptorList ) {
 		var descriptor = descriptorList[id];
 		
 		var id = descriptor.hasOwnProperty('href) {
 			// this is a reference to an internal or external descriptor.  
 			// For now we will only support internal references.
 			
 		}
 		if( descriptor.hasOwnProperty('name') ) {
 		}
 		
 	}
 	
 }
 