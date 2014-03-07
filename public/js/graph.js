// Width and height of the viewport
var width = 1200;
var height = 800;

var forceGraphNodes = [];
var forceGraphLinks = [];
var orphanNodes = [];

function rebuildForceNodeList() {
	
	// Rebuild the node and link arrays
	forceGraphNodes = [];
	forceGraphLinks = [];
	orphanNodes = [];
	
	// Divide nodes into orphans and linked  
	$.each(nodes, function(index, node) {      
     	// only add this to our force graph if a relationship exists
     	if( $.grep(relationships, function(rel){ return (node.nodeId === rel.source || node.nodeId === rel.target); }).length > 0 ) {
     		forceGraphNodes.push(node);
     	}
     	else {
     		orphanNodes.push(node);  
     	} 
     });
          
	// Build a link array based on the nodes that are connected
	$.each(forceGraphNodes, function(i, node) {
		$.each(node.links, function( linkIndex, targetNodeId ) {			
			// Find the index of the target node
			var targetNodes = $.grep(linkedNodes, function(e){ return e.nodeId === targetNodeId; });
			if( targetNodes.length > 0 ) {
				forceGraphLinks.push({source: i, target : targetNodes[0].index});
			}
		});
	});     	
}

// redraw the force graph and orphan nodes
function drawNodes() {

// Dimensions of the shapes
var rect_width = 200;
var rect_height = 40;
var link_x = rect_width / 2;
var link_y = rect_height / 2;

	         
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



//TODO: Set the colour of the rectangle according to some meta-info (like method or connections)
nodeEnter.append("rect")
    .attr("width", rect_width).attr("height", rect_height).attr("rx", 10).attr("ry", 10).attr("class", function(d) { if (d.index > 0) return "task"; else return "first-task"; });
    
// TODO: center the text manually as most browsers don't support text alignment for SVG
nodeEnter.append("text")
      .attr("dy", ".3em")
      .attr("y", 20)
      .attr("x", 10)
      .attr("class", "task.title")      
      .attr("style", "font-family: 'font-family: 'Architects Daughter', cursive;")
      .text(function(d, i) {return d.title});
     
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

