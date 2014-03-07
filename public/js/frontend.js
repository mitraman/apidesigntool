/* TODOs:
1.  Error handling - there is none.
2.  Interaction design - interface needs to be rebuilt to reflect actual usage
3.  Remove 'apply' button and make interface more real-time.
4.  Update ACE editor to make links a different colour and clickable
5.  Modularize the javascript in dev and setup a workflow for prod
*/


var width = 1200;
var height = 800;

var links = [];
var nodes = [];
var relationships = [];
var nodeHashMap = [];
var activeNode = null;

// Links based on the actual object ids (used to construct the node links in the force layout)
var task_rels = [];

// Create an SVG object that will contain the graph
var svg = d3.select("#canvas").append("svg")
    .attr("width", width)
    .attr("height", height);


/*var orphansSvg = d3.select("#orphanCanvas").append("svg")
    .attr("width", 80)
    .attr("height", height);*/

// setup shapes for force layout
var link = svg.selectAll("line.link")
      .data(links);
    
var node = svg.selectAll("circle.node")
      .data(nodes);
      
      
// Retrieve a list of tasks
$.getJSON('/tasks', function(data, textStatus, jqXHR) {

	console.log(jqXHR);
	
	if( jqXHR.status === 200 ) {
	
	console.log(data);

	// TODO: Make sure that the response was succesful.
    $.each(data, function(index, taskObject) {
    
        // Create and store the node in memory
        nodes.push({index: index, nodeId : taskObject.nodeId, title : taskObject.title, description : taskObject.description, uri : taskObject.uri, responseData: taskObject.responseData, links : taskObject.links});
        
		
		// Build a list of node relationships for later use
		$.each(taskObject.links, function(linkIndex, target) {
			relationships.push({source: taskObject.nodeId, target: target});
		});                
        
    });
    
    // populate the resource dropdown list
    $('#select_resource').find('option').remove();			
    $('#select_resource').append("<option value=\"\"></option>");
		$.each(nodes, function(index, node) {
			$('#select_resource').append("<option value=\"" + node.nodeId + "\">" + node.title + "</option>");
       	});
     $(".chzn-select").chosen()
    
    drawNodes();
    
	if( nodes.length > 0 ) selectNode(0);
	
	} else {
	
		$('error-window').modal('show');
	}  	
    
});


// ** Resource selection handler

$("#select_resource").change(function(e) {
	var selectedNodeId = $('#select_resource').val();
	console.log(selectedNodeId);
	
	// Find the node in the list
	selectedNodeMatch = $.grep(nodes, function(node){ return node.nodeId === selectedNodeId; });
	
	if( selectedNodeMatch.length > 0 ) selectNode(selectedNodeMatch[0]);
});


// user has selected a node from the force graph or dropdown list
function selectNode(node) {
	activeNode = node;
 	$('#description').val(node.description);    
    $('#name').val(node.title);
    editor.setValue(node.responseData);
    $('#uri').val(node.uri);
    
    // Make sure that dropdown points to the selected node
    // Find the value that corresponds to this nodeId
    
    $("#select_resource").val(node.nodeId);
    $("#select_resource").trigger("liszt:updated");
    
}

// redraw the force graph and orphan nodes
function drawNodes() {

var rect_width = 200;
var rect_height = 40;
var link_x = rect_width / 2;
var link_y = rect_height / 2;

var orphanNodes = [];
var linkedNodes = [];
var links = [];


	console.log('drawing');
	
	//TODO: Why am I maintaing a list of relationships as well as links within each individual node?  I should be able to choose one or the other.
	
	// Divide nodes into orphans and linked  
	$.each(nodes, function(index, node) {      
     	// only add this to our force graph if a relationship exists
     	if( $.grep(relationships, function(rel){ return (node.nodeId === rel.source || node.nodeId === rel.target); }).length > 0 ) {
     		linkedNodes.push(node);
     	}
     	else {
     		orphanNodes.push(node);  
     	} 
     });
     
     console.log(linkedNodes);
     console.log(orphanNodes);

	// Build a link array based on the nodes that are connected
	$.each(linkedNodes, function(i, node) {
		$.each(node.links, function( linkIndex, targetNodeId ) {			
			// Find the index of the target node
			var targetNodes = $.grep(linkedNodes, function(e){ return e.nodeId === targetNodeId; });
			if( targetNodes.length > 0 ) {
				links.push({source: i, target : targetNodes[0].index});
			}
		});
	});     
         
// Render orphaned nodes in the orphan pool area
svg.selectAll("g.orphan").remove();
var orphans = svg.selectAll("g.orphan").data(orphanNodes).enter().append("g")
	.on("click",function(d,i) {		
        selectNode(orphanNodes[i]); 
    })
    .attr("transform", function(d) { return "translate(" + (rect_width + 20) * (d.index) + ",20)"; });    

console.log('orphans:');    
console.log(orphans);
   
orphans.append("rect")
	//.attr("x", function(d) { if( d.index > 1 ) { return (rect_width + 20) * (d.index-1); } else {return rect_width * (d.index-1);} })
	//.attr("y", function(d) { return 25 })
    .attr("width", rect_width)
    .attr("height", rect_height)
    .attr("rx", 10)
    .attr("ry", 10)
    .attr("class", "orphan-task");

orphans.append("text")
      .attr("dy", ".3em")
      .attr("y", 20)
      .attr("x", 10)
      .attr("class", "task.title")      
      .attr("style", "font-family: 'font-family: 'Architects Daughter', cursive;")
      .text(function(d, i) {return d.title});

     
  // Create a force layout object
var force = d3.layout.force()
    .nodes(linkedNodes)
    .links(links)
    .gravity(0.1)
    .charge(-2000)
    .linkDistance(200)
    .size([width, height])
    .start();

link = link.data(force.links(), function(d) {return d.id;});
link.enter().append("line").attr("class", "link");
link.exit().remove();

node = node.data(force.nodes(), function(d) {return d.id;});

var timerId;

// Call the edit node modal if the user clicks on a rectangle
// TODO: populate the fields appropriately
node.exit().remove();
var nodeEnter = node.enter().append("g").call(force.drag)
    .on("click",function(d,i) {
        selectNode(linkedNodes[i]); 
    })
    .on("mouseover", function(d,i) {
        timerId = setTimeout(function() {
            // TODO: Create a popup window that describes the node's main features
            
        }, 1000);
    });


// Draw shadow
/*nodeEnter.append("rect")
    .attr("x", 8).attr("y", 8).attr("width", rect_width).attr("height", rect_height).attr("rx", 10).attr("ry", 10).attr("class", "task.shadow");*/

//TODO: Set the colour of the rectangle according to some meta-info (like method or connections)

nodeEnter.append("rect")
    .attr("width", rect_width).attr("height", rect_height).attr("rx", 10).attr("ry", 10).attr("class", function(d) { if (d.index > 0) return "task"; else return "first-task"; });
    
/*nodeEnter.append("circle")
    .attr("cx", rect_width).attr("r", 10).attr("class", "task");*/

// TODO: center the text manually as most browsers don't support text alignment for SVG
nodeEnter.append("text")
      .attr("dy", ".3em")
      .attr("y", 20)
      .attr("x", 10)
      .attr("class", "task.title")      
      .attr("style", "font-family: 'font-family: 'Architects Daughter', cursive;")
      .text(function(d, i) {return d.title});
      
/*nodeEnter.append("text")
      .attr("dy", ".3em")   
      .attr("y", 40)
      .attr("x", 10)
      .attr("class", "task.body")
      .attr("style", "font-family: 'Architects Daughter', cursive;")
      .text(function(d) {return d.description}); */

node.exit().remove();

      

// animation function
force.on("tick", function() {    
    link.attr("x1", function(d) { if( d.source.x === NaN ) return; return d.source.x + link_x;})
        .attr("y1", function(d) { return d.source.y + link_y; })
        .attr("x2", function(d) { return d.target.x + link_x; })
        .attr("y2", function(d) { return d.target.y + link_y; });

        // Use translation to place the elements within the box
        node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
        
});

}

$('#removeNode').click(function() {	
   deleteNodeOnServer(activeNode, function() {
   		console.log('delete completed.');
   		
   		// Remove the node from the list
   		var nodeMatches = $.grep(nodes, function(node){ return node.nodeId === activeNode.nodeId });
   		console.log(node);
   		nodes.splice(nodeMatches[0].index, 1);
   		drawNodes();
   });   
});


	


$('#create-node-save').click(function() {
	
	var title = $('#create-node-name').val();
	var description = $('#create-node-description').val();
	var url = $('#create-node-uri').val();
	var links = [];
	var method = "GET";
	var responseData = "";
	
	var nodeId = createNodeOnServer(title, description, url, method, responseData, links, newNodeCreated);
	
});


// Callback function called when a node is succesfully created on the backend
function newNodeCreated(nodeId) {
	
	// Set this as the active node
	if( $.grep(nodes, function(node){ return node.nodeId === nodeId; }).length > 0 ) {
     	activeNode = node
     }else {
     	console.error('Unable to find newly created node in list with id ' + nodeId);
     	return;
     }               
                
    // Clear the property sheet
	$('#name').val('');
	$('#description').val('');
	$('#uri').val('');
	editor.getSession().setValue('');
	
	// Redraw the force layout
    drawNodes();
    
    // Close the popup window
    $('#create-node').modal('hide')
    
}

// Save changes made in the property editor to the backend
$('button#saveResponseData').click(function() {

	// Look for links
	// TODO: improve regex to match on the title only without including quotes or dollar signs
	var re = /["][$](?:(?:\\.)|(?:[^"\\]))*?["]/g;
	//var links = re.match(editor.getSession().getValue());
	var linkTokens = editor.getSession().getValue().match(re);
		
	console.log("activeNode :" + activeNode);
	var sourceNodeIndex = $.grep(nodes, function(e){ return e.nodeId === activeNode.nodeId; })[0].index;
	
	if( linkTokens != null ) {	
		
		// TODO: Update this based on changes made to drawing algorithm
		
		/*
		The code I use when building relationships based on backend data:
		// Build a list of node relationships for later use
		$.each(taskObject.links, function(linkIndex, target) {
			relationships.push({source: taskObject.nodeId, target: target});
		});  
		*/
		
		// delete existing links
		var existingLinks = $.grep(relationships, function(e){ return e.source === activeNode.nodeId; });
		
		console.log('existing links:');
		console.log(existingLinks);
		
		$.each(existingLinks, function(indexInArray, existingLink) {
			relationships.splice(indexInArray, 1);
		});
		
		// For some reason I am also maintaining a list of in-memory links within each node object.  This needs to be cleared and updated as well.
		var nodeLinks = [];
		
		for( var i = 0; i < linkTokens.length; i++ ) 
		{
			console.log(linkTokens[i]);
			// remove the preceeding '$' character and quotes until we improve the regex			
			var link = linkTokens[i].substr(2, linkTokens[i].length-3);
			console.log(link);
			
			// Find the actual node id for the target of the link
			var targetNode = $.grep(nodes, function(e){ return e.title === link; });
			if( targetNode.length > 0 ) {					
				var targetNodeIndex = targetNode[0].index;
				console.log("adding link");
				relationships.push({ source: activeNode.nodeId, target: targetNode[0].nodeId });
				nodeLinks.push(targetNode[0].nodeId);
			}
			
		}
		
		activeNode.links = nodeLinks;
			 	
	}
	
	var title = $('#name').val();
	var description = $('#description').val();
	var uri = $('#uri').val();
	
	activeNode.title = title;
	activeNode.description = description;
	activeNode.uri = uri;
	
	drawNodes();
	
	// Save data to backend
	updateNodeOnServer(activeNode);
});

// **** RESPONSE EDITOR FUNCTIONS ****
var typeAheadEnabled = false;
var tokenStartColumn = 0;
var tokenStartRow = 0;
// Setup ACE Editor

// Set the height of the div for the editor
var parentHeight = $('#property-editor').parent().height();
    
// Create the editor
$('#editor').height(parentHeight);
var editor = ace.edit("editor");
editor.setTheme("ace/theme/dawn");
editor.getSession().setMode("ace/mode/json");
		
// Update editor if type-ahead selection is clicked
function suggestionClicked(title, token) {
	// Complete the text based on the selection chosen.
	console.log(token);
	var appendText = title.substring(token.length);
	editor.insert(appendText + "\"");
	$( '#type-ahead' ).dialog("close");
	
}		
		
// Listen for changes in the response editor 
editor.on("change", function (e) {
	// update the in-memory object with the change
	activeNode.responseData = editor.getSession().getValue();

	// create a type-ahead box if the user enters "$
	if( e.data.action==="insertText" && e.data.text==="$") {
		var range = e.data.range.clone();
		range.start.column--;
		range.end.column--;		
		var prevChar = editor.getSession().getTextRange(range);
		if( prevChar === "\"") {

			var coords = editor.renderer.textToScreenCoordinates(range.start.row, range.start.column);
			
			// TODO: the offset should be based on the font height / screen size
			var yOffset = 20;
			$( '#type-ahead' ).dialog({ 
				position: [coords.pageX, coords.pageY + yOffset], 
				closeOnEscape: true, 
				draggable : false, 
				resizable : false, 
				dialogClass : "type-ahead" });
			// Set the focus back on the ace editor pane so the user can continue to type
			editor.focus();		
			
			typeAheadEnabled = true;	
			tokenStartColumn = e.data.range.start.column + 1;  // ignore the initial link indicator 
			tokenStartRow = e.data.range.start.row;
		}
	}
	
	if(typeAheadEnabled) {
		var selectionRange = e.data.range.clone();
		selectionRange.start.column = tokenStartColumn;
		selectionRange.start.row = tokenStartRow;
		var token = editor.getSession().getTextRange(selectionRange);
		
		// populate the type ahead list
		$('#type-ahead-list').find('div').remove();			
		$.each(nodes, function(index, node) {
			if( node.title.substring(0,token.length) === token) {
				$('#type-ahead-list').append("<div class=\"type-ahead-suggestion\" style=\"white-space: nowrap; cursor: pointer;\"><a onclick=\"suggestionClicked('" + node.title + "', '" + token + "');\" href=\"#\">" + node.title+"</a></div>");
  			}
       	});
       	  		$('#type-ahead-list').append("<div class=\"type-ahead-suggestion\" style=\"white-space: nowrap; cursor: pointer;\"><a href=\"#\">Create New Task...</a></div>");
		
		// end the type ahead if the user enters a terminating character (e.g. space or enter).
		// TODO: catch the escape character
		if( e.data.text == "\"" ) {
			$( '#type-ahead' ).dialog("close");
		}
		
		// Make the entire div selectable in the type ahead suggestion list
		$(".type-ahead-suggestion").click(function(){
			var aaaaays = $(this).find("a");
			if( aaaaays.length > 0 ) {
				$(this).find("a")[0].onclick();
			}			 
			return false;
		});

		
		
	}
});


// ** Set editor highlighter based on the content-type once the user enters a value
$('#mime_type').bind('change', function(event) {
	var value = $('#mime_type').val();
	
	// If we understand the content-type, set the editor accordingly
	if( value.toUpperCase() === 'APPLICATION/JSON' ) {
		console.log('setting editor to JSON mode');
		editor.getSession().setMode("ace/mode/json");
	}else if( value.toUpperCase() === 'APPLICATION/XML' || value.toUpperCase() === 'TEXT/XML' ) {
		console.log('setting editor to XML mode');
		editor.getSession().setMode("ace/mode/xml");
	}
}
);

// ** response header autocomplete
/*$('.header-key').typeahead(
  {
    name: 'http-headers',
    prefetch: 'js/http-headers.json',
    template: [                                                                 
    '<p>{{name}}</p>',                              
    '<p>{{description}}</p>'                         
  ].join(''),                                                                 
  engine: Hogan   
  });*/
  /**
  Disable typeahead until we figure out how to apply it to a dynamic table.
$('.header-key').typeahead(
  {
    name: 'http-headers',
    prefetch: 'js/http-headers.json',
    header: 'HTTP Headers'   
  });
  **/


// because we are dynamically changing the headers table and adding/removing rows on the fly, we need to catch events that
// propogate up to the table after inserting HTML.
$('#table_headers').on("keyup click", function(event) {
	console.log('caught an event at the table level');
	console.log(event);
	if( event.target.className === 'header-key' ) {
	
		var headerValueEl = event.target.parentNode.parentNode.children[2].children[0];
		console.log(headerValueEl);
	
		// TODO: strip whitespace?
		if( event.target.value === '' ) {
			headerValueEl.readOnly = true;	
		}else {		
			headerValueEl.readOnly = false;
		}
	}else if( event.target.className === "icon-remove" ) {
		console.log("remove row");
		var tr = event.target.parentNode.parentNode.parentNode;
		tr.remove();
	}else if( event.target.id === "addHeader" ) {
		console.log("add row");
		var trHTML = "<tr>" + 
							"<td><a id=\"remove\" href=\"#\" ><i class=\"icon-remove\"></i></a></td>" + 
							"<td><input class=\"header-key\" type=\"text\" placeholder=\"HTTP Header Name\"/></td>" + 
							"<td><input class=\"header-value\" type=\"text\" placeholder=\"HTTP Header Value\" readonly=\"true\"/></td>" + 							
				"</tr>";
		$('#table_headers tr:last').replaceWith(trHTML);
		$('#table_headers tr:last').after("<td colspan=\"3\"><button class=\"btn btn-primary\" type=\"button\" id=\"addHeader\">Add Header</button></td>");
	} 
});




// Event handler functions
function propertyChange(event) {
	console.log('change occured');
	console.log(event);
	
	// Determine if this is a change we need to act upon
	if(event.type === "keydown") {
		// TODO: Make sure this was an input character that we care about
		
	}
	
	// FOR FUTURE USE
}

// Bind event handlers to input objects
$('#name').bind({
	keydown : propertyChange,
	paste : propertyChange
});



