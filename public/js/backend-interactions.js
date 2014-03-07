// ****
// Interactions with the Backend

function createNodeOnServer(title, description, url, method, repsonseData, links, callback) {
     
     var taskContainer = { task : { title : title, description : description, url : url, method : method, response : repsonseData, links : links} };
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

            nodes.push({nodeId : nodeId, title : node.title, uri : node.uri, description : node.description, responseData: node.responseData});
            
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
   
   var taskContainer = { task : { title : node.title, description : node.description, url : node.uri, method : node.method, response : node.responseData, links : node.links} };
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
 
 	console.log('deleting...');
   var DELETEurl = "/tasks/" + node.nodeId;
   
   var writeTaskAJAX = $.ajax({
        url: DELETEurl,
        type: 'DELETE',
        contentType: 'application/json',
        dataType: 'json'
    });
    
    writeTaskAJAX.done(callback);
}
