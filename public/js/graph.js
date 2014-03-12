// ************************************************************************
// ** graph.js
// ** 
// ** data structures, functions and variables related to the node graph 
// ** and D3 drawing and animation
// ************************************************************************

// The master node list.  This should contain a list of response states.
var graph = { nodes: [] } 

// Internal represntations of the node lists used for the D3 graph
var linkedNodes = [];

// the links array indicates the rels between node array locations.  D3 doesn't support arbitrary indexes for force layouts,
// so we need to maintain this array indexed version of the links in addition to the links in our nodes list.
// Any operations made to the node lists need to update this as well.
var links = [];

var canvasWidth = $( "#canvas" ).width();
var height = $( window ).height();

// Create the initial D3 object by appending an SVG element to the canvas
var graphSVG = d3.select("#canvas")
        .append("svg")
        .attr("width", canvasWidth)
        .attr("height", height);

// TODO: determine correct values for height and width
var force = d3.layout.force()
        .nodes(linkedNodes)
        .links(links)
        .size([canvasWidth, height])
        .on("tick", tick)
        .start();

// Allow the user to drag a force layout node into a fixed position
var drag = force.drag()
    .on("dragstart", dragstart);
        
function dblclick(d) {
    d3.select(this).classed("fixed", d.fixed = false);
}

function dragstart(d) {
    d3.select(this).classed("fixed", d.fixed = true);
}

    
// The main routine - updates/renders the graph visualization.  
// This should be called anytime the underlying node lists change, including for the first render
function renderGraph() {
    
    if( force === null ) {
            throw Error("force layout has not been defined.");
        }
        
        var orphanMap = [];
        var linkedMap = [];
        
        //**** Filter the nodes into maps of orphans and linked nodes
        // TODO: profile this with a resaonable sized list and see how bad the performance is.
        
        for( var key in graph.nodes ) {
            var node = graph.nodes[key];           
                        
            // If this node has no links, store it in the orphan map, otherwise
            // store it in the nodes with links map
            if( !linkedMap.hasOwnProperty(node.nodeId) ) {
                if( node.links.length == 0 ){ orphanMap[node.nodeId] = node; }
                else { linkedMap[node.nodeId] = node; }
            }
            
            // if this node is linked to another node, put all link targets in the 
            // map of nodes with links and remove them from the orphan map (if necessary).
            for( var index in node.links ) {
                var target = node.links[index];
            
                if( orphanMap.hasOwnProperty(target) ) { 
                    delete orphanMap[target];
                }
                if( !linkedMap.hasOwnProperty(target) ) {
            
                    if( graph.nodes[target] === undefined ) {
                        // TODO: What should the behaviour be if a target node doesn't actually exist?
                        throw new Error("Node " + node.nodeId + " is linked to non-existent target node " + target );
                    }
                    linkedMap[target] = graph.nodes[target];
                }
            }
        }
        
        // Turn the maps into lists that can be used with d3
        var orphanNodes = [];
        
        for( var key in orphanMap ) {
            orphanNodes.push(orphanMap[key]);
        }
        
        linkedNodes = [];
        var linkedNodesIndex = {};
        for( var key in linkedMap ) {       
            
            var linkedNode = linkedMap[key];
            
            linkedNodes.push(linkedNode);
            // maintain a map of key->index so that we can easily build the list of links later
            linkedNodesIndex[linkedNode.nodeId] = linkedNodes.length - 1;            
        }
                
        
        // Construct the links array
        links = [];
        for( var i = 0; i < linkedNodes.length; i++ ) {
            var node = linkedNodes[i];
            if( node.links.length > 0 ) {
                for ( var j = 0; j < node.links.length; j++ ) {
                    var link = node.links[j];
                    var source = i;
                    var target = linkedNodesIndex[link];
                    links.push({source: source, target: target});                    
                }
            }
        }
        
        
        //****** End of filtering
                
        
        /*** 
          Update the boxes for the orphaned nodes
          ***/
    console.log("lists:");
    console.log(orphanNodes);    
    console.log(linkedNodes);
    console.log(links);
    
        // Join the graphNodes object to the orphan list and create a "g" element when a node is added
        var graphNodes = graphSVG
        .selectAll("g")
        .data(orphanNodes, function(d) { return d.nodeId })
            .enter()
        .append("g")
        .on("click", function (d, i) {
            selectNode(graph.nodes[d.nodeId]);
        });
        
        // Remove a "g" element when a node is removed.
        graphSVG.selectAll("g")
            .data(orphanNodes, function(d) { return d.nodeId })
            .exit()
            .remove("g");

        // populate the SVG group with the node detail
        graphNodes
        .append("circle")
        .attr("cx", function( d, i ) { return (i * 100) + 100; } )
        .attr("cy", 100)
        .attr("r","45")      
        .attr("class", "orphan");
        
        graphNodes
            .append("text")
            .text(function(d) { return d.title; } )
            .attr("x", function( d, i ) { return (i*100) + 75; } )
            .attr("y", 100);
        
        /***
            Update the force graph for linked nodes
            ***/        
        
        // Restart the force layout.
        force
        .nodes(linkedNodes)
        .links(links)
        .start();       
        
        var link = graphSVG.selectAll(".link")
            .data(links)
            .enter().append("line")
            .attr("class", "link");            
                
        var nodeGroup = graphSVG.selectAll(".node")
            .data(linkedNodes, function(d) { return d.nodeId })
            .enter().append("g")
            .attr("transform", function( d, i ) {
                return "translate(" + d.x + "," + d.y + ")";
            })
            .call(force.drag)
            .attr("class", "node");
        
        nodeGroup
            .append("circle")
            .attr("r","45");
        
        nodeGroup
            .append("text")
            .text(function( d ) { return d.title; });
            
}

function tick(e) {        
    graphSVG.selectAll(".link")
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        graphSVG.selectAll(".node")
            .attr("transform", function( d, i ) {
                return "translate(" + d.x + "," + d.y + ")";
            });            
}