/**
 * A representation of an ALPS profile
 */

// TODO: I need to adapt this properly to client side js
//  * how do I allow multiple profiles to be loaded?
//  * should I keep a global list of descriptors?

//TODO: Do I need to worry about someone calling readJSON more than once?

var ERR_ROOT_MISSING = "the ALPS root property is not defined";
var ERR_TYPE_MISSING = "the type property is missing for the descriptor named ";
var ERR_DUPE_ID = "duplicate ID found for descriptor ID ";
var ERR_DESCRIPTOR_NOT_ARRAY = "the descriptor must be an array";
var ERR_REF_NOT_FOUND = "a reference to a local descriptor was not found"

 var version;
 var descriptors = [];
 
 // ALPSObject: an object representing ALPS profile in JSON
 function readJSON(ALPSObject, callback) {
	 
	console.log('> in ALPSProfile.readJSON');
	 	 
 	var ALPSRoot = getProperty(ALPSObject, 'alps');
 	
	if( ALPSRoot == null ) {
 		callback(ERR_ROOT_MISSING);
 		return;		
 	}
	
	this.version = getProperty(ALPSRoot, 'version');		
 
 	var descriptor = getProperty(ALPSRoot, 'descriptor');
 	
 	// recursively parse the descriptor objects
 	if( descriptor != null ) {
 		try {
 			var error = parseDescriptorList(descriptor);
 		} catch(e) {
 			callback(e.message);
 			return;
 		}
 	}
 	
 	callback(null); 	
 	
 } 
 
 function parseDescriptorList(descriptorList) {

	 // Make sure that the descriptor is an array
	 if(Object.prototype.toString.call( descriptorList ).indexOf('Array') < 0 ) {
	 	throw new Error(ERR_DESCRIPTOR_NOT_ARRAY);
	 }
	 
 	// do a first pass of parsing to popuate the descriptor list.  
	// we won't dereference any hrefs until later
 	for( var index in descriptorList ) {
 		 			 		
 		var descriptor = descriptorList[index];
 		var aDescriptor = parseDescriptor(descriptor);
 		 		 		
 		// make sure the ID doesn't already exist
 	 	if( descriptors[aDescriptor.id] != null ) {
 	 		var errMsg = ERR_DUPE_ID + aDescriptor.id;
 	 		throw new Error(errMsg);
 	 	}
 	 	
 	 	// Store the parsed descriptor in our object map
 	 	descriptors[aDescriptor.id] = aDescriptor;
 		
 	} 	
 	
 	// dereference any links that we have found during parsing
 	for( var descriptorID in descriptors ) {
 		var descriptor = descriptors[descriptorID];
		if( descriptor.hasOwnProperty('href') ) {
			// this is a reference to an internal or external descriptor.
			// we can now populate the reference 
			if( descriptor.href[0] == '#') {
				// this is a local reference to a descriptor. 
				// first make sure it exists
				var localID = descriptor.href.substring(1);
				console.log(localID);
				if( descriptors[localID] === null) {
					throw new Error(ERR_REF_NOT_FOUND);
				}
			}
			
			
		}
		
 	}
 }
 
 function parseDescriptor(descriptor) {
	var aDescriptor = {};
	 
	// iterate through the descriptor and store the properties.
	// I'm iterating because of the need for case insensitivity.
	for( var propertyName in descriptor ) {
			 			
			var normalizedPropName = propertyName.toLowerCase();
			
			if( normalizedPropName === 'descriptor') {
				parseDescriptorList(descriptor[propertyName]);
			}
			 			
			else if( normalizedPropName === 'name') {
				aDescriptor.name = descriptor[propertyName];
			}
			
			else if( normalizedPropName === 'id') {
				aDescriptor.id = descriptor[propertyName];
			}
			
			else if( normalizedPropName === 'href') {
				// we will deref this link later.. for now just store the property.
				aDescriptor.href = descriptor[propertyName]; 				
			}
			
			else if( normalizedPropName === 'ext') {
				aDescriptor.ext = descriptor[propertyName];
			}
			
			else if( normalizedPropName === 'type') {
				aDescriptor.type = descriptor[propertyName];
			}
			
			else if( normalizedPropName === 'doc') {
				aDescriptor.doc = descriptor[propertyName];
			}
			
		} 	
		
		// Log a warning if we were unable to find an id for this descriptor
		if(!aDescriptor.hasOwnProperty('id') && !aDescriptor.hasOwnProperty('href')) {
			// TODO: implement logging
			console.log('WARNING: a descriptor does not have an id or href property');
		}
		
		// Make sure that the required properties exist for this descriptor
		if(!aDescriptor.hasOwnProperty('type') && !aDescriptor.hasOwnProperty('href')) {
			var errMsg = ERR_TYPE_MISSING + aDescriptor.id;
			throw new Error(errMsg);
		}
		
		return aDescriptor;	 
	 
 }
 
 function getProperty(obj, propertyName) {
	 for( property in obj) {
		 if( property.toUpperCase() === propertyName.toUpperCase()) return obj[property];
	 }
	 
	 return null;
 }
 
 // A case insensitive search for a named property
 function findProperty(obj, propertyName) {
	 for( property in obj) {
		 if( property.toUpperCase() === propertyName.toUpperCase()) return property;
	 }
	 
	 return null;
 }
 
 