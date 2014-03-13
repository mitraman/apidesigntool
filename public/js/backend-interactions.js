// ****
// Interactions with the Backend

function createNodeOnServer(title, description, url, methods, responseData, links, callback) {
         
     var taskContainer = { task : { title : title, 
                                   description : description, 
                                   url : url, 
                                   methods : methods, 
                                   response : responseData, 
                                   links : links } };
     console.log(taskContainer);
   //Write task to the server   
   var writeTaskAJAX = $.ajax({
        url: '/tasks',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(taskContainer),
        dataType: 'json'
    });
    
    writeTaskAJAX.done(function(data, textStatus, jqXHR) {    	
        if( jqXHR.status === 200) {
        	console.log('success!');
        	console.log(data);
            var nodeId = data[0]._id;
                        
            var node = {
                nodeId: nodeId,
                title: title,
                description: description,
                uri: url,
                methods : methods,
                responseData: responseData,
                links: links
               };            
               
            graph.nodes[nodeId] = node;
            
            if( callback != null ) {
            	callback(nodeId);
            }
                        
        }else {
        	console.log('you got problems');
        	console.log(jqXHR);
        }        
    });
}

function updateNodeOnServer(node, callback) {
     
   console.log('updating it');
   console.log(node);
   //Write node to the server   
   
   var taskContainer = { task : { title : node.title, description : node.description, url : node.uri, methods : node.methods, response : node.responseData, links : node.links} };
   console.log(taskContainer);
   
   var PUTurl = "/tasks/" + node.nodeId;
   
   var writeTaskAJAX = $.ajax({
        url: PUTurl,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(taskContainer),
        dataType: 'json'
    });
    
    writeTaskAJAX.done(function(data, textStatus, jqXHR) {
        console.log(data);
        
        if( jqXHR.status === 200) {
            if( callback != null ) {
            	callback();
            }                        
        }else {
        	console.log('you got problems');
        	console.log(jqXHR);
        	console.log(textStatus);
        }        
    });
}

function deleteNodeOnServer(node, callback) {
 
   var DELETEurl = "/tasks/" + node.nodeId;
   
   $.ajax({
        url: DELETEurl,
        type: 'DELETE',
        contentType: 'application/json',
        dataType: 'json',
       timeout: 100
    })
    .done(function( data, textStatus, jqXHR ) {
        callback();
    })
   .fail(function( jqXHR, textStatus, errorThrown ) {
        console.log("DELETE call failed.");
       console.log(textStatus);
       console.log(errorThrown);
    });
       
}

function retrieveALPSProfiles( callback ) {    
    //console.log("retrieveALPSProfiles");
    $.getJSON('/ALPS/profiles', function (data, textStatus, jqXHR) {
        if (jqXHR.status === 200) {
            
            $.each(data, function (index, profile) {
                profiles.push(profile);                
                // parse the profile
                /*
                readJSON(profile.doc, function(err) {
                    console.log('finished parsing');                    
                });
                */
            });        
            callback();
        }
    });
}

function createALPSProfile( profile, callback ) {    
    console.log("createALPSProfile");    
    
    var data = {profile: profile};
    
    console.log(data);
     var writeTaskAJAX = $.ajax({
        url: '/ALPS/profiles',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        dataType: 'json'
    });
    
     writeTaskAJAX.done(function(data, textStatus, jqXHR) {    	
        if( jqXHR.status === 200) {
        	console.log('success!');
        	console.log(data);

            if( callback != null ) {
                profiles.push(profile);
            	callback();
            }
                        
        }else {
        	console.log('you got problems');
        	console.log(jqXHR);
        }        
    });
}