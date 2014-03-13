
var profiles = [];
var activeNode = null;

// Hide the non-active panes
$("#ALPS-pane").hide();

//TODO: this should be move to backend-interactions.js
// Retrieve a list of tasks
$.getJSON('/tasks', function (data, textStatus, jqXHR) {

    if (jqXHR.status === 200) {

        // TODO: Make sure that the response was succesful.
        
        $.each(data, function (index, taskObject) {
            
            if( !taskObject.hasOwnProperty("_id") ){
               throw Error("task is missing identifier");
            }
               
            
             var node = {
                nodeId: taskObject._id,
                title: taskObject.title,
                description: taskObject.description,
                uri: taskObject.url,
                methods : taskObject.methods,
                responseData: taskObject.response,
                links: taskObject.links
               };            
               
            graph.nodes[taskObject._id] = node;
        });
        
        //console.log(graph.nodes);
        
        // populate the resource dropdown list
        $('#select_resource').find('option').remove();
        $('#select_resource').append("<option value=\"\"></option>");
        var firstNodeId = null;
        for( nodeId in graph.nodes ) {
            if( firstNodeId === null ) { firstNodeId = nodeId; }
            $('#select_resource').append("<option value=\"" + nodeId + "\">" + graph.nodes[nodeId].title + "</option>");
        }
        $(".chzn-select").chosen();
        
        renderGraph();

        if (firstNodeId != null) { selectNode(graph.nodes[firstNodeId]); }

    } else {

        $('error-window').modal('show');
    }

});

// Load ALPS profiles
retrieveALPSProfiles(function(error) {
    // Load the select box with the profile names
    $("#profile-list").children().remove();
    $.each(profiles, function(key, profile) {
        $("#profile-list")
            .append($("<option></option>")
            .attr("value",key) 
            .text(profile.name)); 
                        
        // parse the profile and store a list of descriptor names
        if( profile.representation === 'json'  ) {
            readJSON(profile.doc, function() {});
        }else if( profile.representation === 'xml' ) {
            parseXML(profile.doc, function() {});
        }else {
            console.log('UNKNOWN REPRESNETATION FOR ALPS PROFILE');
        }
        
    });
    
});

// user has selected the ALPS pane
$("#ALPS").click(function(e) {    
    $("#ALPS-pane").show();
    $("#property-editor").hide();            
    $("#ALPS").parent("li").siblings().attr("class","");
    $("#ALPS").parent("li").attr("class", "active");
});

$("#Editor").click(function(e) {
    $("#ALPS-pane").hide();
    $("#property-editor").show();
    $("#Editor").parent("li").siblings().attr("class","");
    $("#Editor").parent("li").attr("class", "active");
});

// ** dropdown selection handler
$("#select_resource").change(function (e) {
    var selectedNodeId = $('#select_resource').val();

    var selectedNode = graph.nodes[selectedNodeId];
    selectNode(selectedNode);
});

// user has selected an ALPS profile from the list
$("#profile-list").change(function(e) {
    var selectedVal = $( "#profile-list" ).val();
    
    // Load the selected profile in the editor
    var doc = profiles[selectedVal].doc;
    //var docStr = JSON.stringify(doc, null, '\t');
    ALPSEditor.setValue(doc);
    $("#profile-name").val(profiles[selectedVal].name);
    //todo: set the appropriate rep value
    
    
});

// The content-type of the ALPS doc has changed
$("#profile-rep").change(function(e) {
    var contentType = $( "#profile-rep" ).val();
    console.log(contentType);
    
    if( contentType === 'xml' ) {
        ALPSEditor.getSession().setMode("ace/mode/xml");
    }else if( contentType === 'json' ) {
        ALPSEditor.getSession().setMode("ace/mode/json");
    }
});

// New alps profile event
$("#new-profile").click(function(e) {
    // clear the profile editor window
    //ALPSEditor.setValue('{ \n    \"alps\": {\n        "version\": \"1.0\" \n    }\n}');
    ALPSEditor.setValue('');
    $("#profile-name").val("");        
});

// save ALPS profile
$("#profile-save").click(function(e) {
    //TODO: determine if this is a new profile or an update
    var name = $("#profile-name").val();
    var doc = ALPSEditor.getValue();
    var rep = $("#profile-rep").val();
    var profile = {name: name, doc: doc, representation: rep };
    console.log(profile);
    createALPSProfile(profile, function() {
    });
    
    
});

// user has selected a node from the force graph or dropdown list
function selectNode(node) {
    activeNode = node;
    $('#description').val(node.description);
    $('#name').val(node.title);    
    $('#uri').val(node.uri);    
    
    
    $("#methods").find("input").each(function(index, methodCheckBox) {
        var methodName = methodCheckBox.id.split("checkbox_")[1];
        
        if( $.inArray(methodName, node.methods) < 0 ) {
            $("#" + methodCheckBox.id).prop("checked",false);    
        } else {
            $("#" + methodCheckBox.id).prop("checked",true);    
        }
    });

    disableTypeAhead = true;
    // is this call synchronous?
    responseEditor.setValue(node.responseData);
    disableTypeAhead = false;

    // Make sure that dropdown points to the selected node
    $("#select_resource").val(node.nodeId);
    $("#select_resource").trigger("liszt:updated");

}

$('#removeNode').click(function () {
    console.log("calling deleteNodeOnServer()");
    deleteNodeOnServer(activeNode, function () {
        console.log('delete completed.');
        
        console.log(activeNode);

        // Remove the node from the list
        var nodeMatches = $.grep(nodes, function (node) {
            return node.nodeId === activeNode.nodeId
        });
        
        console.log(nodeMatches);
        nodes.splice(nodeMatches[0].index, 1);
        
        console.log('delete - drawNodes()');
        drawNodes();
    });
});




$('#create-node-save').click(function () {
    
    console.log("create-node-save");

    var title = $('#create-node-name').val();
    var description = $('#create-node-description').val();
    var url = $('#create-node-uri').val();
    var links = [];
    var methods = ["GET"];
    var responseData = "";

    var nodeId = createNodeOnServer(title, description, url, methods, responseData, links, newNodeCreated);

});


// Callback function called when a node is succesfully created on the backend
function newNodeCreated(nodeId) {

    console.log("newNodeCreated");
    
    // Set the new node as the active node
    activeNode = graph.nodes[nodeId];        

    // Clear the property sheet
    $('#name').val('');
    $('#description').val('');
    $('#uri').val('');
    responseEditor.getSession().setValue('');

    // Redraw the force layout
    renderGraph();

    // Clear the popup window fields and close it
    $("#create-node-name").val('');
    $("#create-node-uri").val('');
    $("#create-node-description").val('');
    $('#create-node').modal('hide')

}

// Save changes made in the property editor to the backend
$('button#saveResponseData').click(function () {
    console.log('saveResponseData button clicked');
    
    // Look for links
    // TODO: improve regex to match on the title only without including quotes or dollar signs
    var re = /["][$](?:(?:\\.)|(?:[^"\\]))*?["]/g;
    var linkTokens = responseEditor.getSession().getValue().match(re);

    console.log("activeNode :" + activeNode);
    
    if (linkTokens != null) {
        
        var nodeLinks = [];

        for (var i = 0; i < linkTokens.length; i++) {

            // remove the preceeding '$' character and quotes until we improve the regex			
            var link = linkTokens[i].substr(2, linkTokens[i].length - 3);
            
            // ** THE PROBLEM IS THAT GRAPH.NODES IS NOT AN ARRAY.  NEED TO THINK ABOUT HOW TO FIX THIS
            // ** EFFICIENTLY            
            // For now I'm iterating through the list each time, just to get this part done.  This needs to be optimized if performance suffers.
            for( nodeId in graph.nodes ) {
                var node = graph.nodes[nodeId];
               if( node.title === link ) {
                   nodeLinks.push(node.nodeId);
                   break;
               }
            }
                        
        }
        
        activeNode.links = nodeLinks;

    }

    var title = $('#name').val();
    var description = $('#description').val();
    var uri = $('#uri').val();
    
    var methodList = [];
    $("#methods").find("input").each(function( index, checkbox ) {
        if( $("#" + checkbox.id).attr("checked") != undefined ) {
            methodList.push(checkbox.value);
        }
    });
        
        
    activeNode.title = title;
    activeNode.description = description;
    activeNode.uri = uri;
    activeNode.methods = methodList;

    renderGraph();

    // Save data to backend
    updateNodeOnServer(activeNode);
});

// **** RESPONSE EDITOR FUNCTIONS ****

var typeAheadEnabled = false;
var ALPStypeAheadEnabled = false;
var tokenStartColumn = 0;
var tokenStartRow = 0;

var disableTypeAhead = false;
var disableALPSTypeAhead = false;

// Setup ACE Editor

// Set the height of the div for the editor
var parentHeight = $('#property-editor').parent().height();

// Create the response editor
$('#editor').height(parentHeight);
var responseEditor = ace.edit("editor");
responseEditor.setTheme("ace/theme/dawn");
responseEditor.getSession().setMode("ace/mode/json"); 

// Create the ALPS editor
$("#ALPS-editor").height(parentHeight);
var ALPSEditor = ace.edit("ALPS-editor");
ALPSEditor.setTheme("ace/theme/dawn");
ALPSEditor.getSession().setMode("ace/mode/json");


// ** Set editor highlighter based on the content-type once the user enters a value
$('#mime_type').bind('change', function (event) {
    var value = $('#mime_type').val();

    // If we understand the content-type, set the editor accordingly
    if (value.toUpperCase() === 'APPLICATION/JSON') {
        console.log('setting editor to JSON mode');
        responseEditor.getSession().setMode("ace/mode/json");
    } else if (value.toUpperCase() === 'APPLICATION/XML' || value.toUpperCase() === 'TEXT/XML') {
        console.log('setting editor to XML mode');
        responseEditor.getSession().setMode("ace/mode/xml");
    }
});

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
$('#table_headers').on("keyup click", function (event) {
    console.log('caught an event at the table level');
    console.log(event);
    if (event.target.className === 'header-key') {

        var headerValueEl = event.target.parentNode.parentNode.children[2].children[0];
        console.log(headerValueEl);

        // TODO: strip whitespace?
        if (event.target.value === '') {
            headerValueEl.readOnly = true;
        } else {
            headerValueEl.readOnly = false;
        }
    } else if (event.target.className === "icon-remove") {
        console.log("remove row");
        var tr = event.target.parentNode.parentNode.parentNode;
        tr.remove();
    } else if (event.target.id === "addHeader") {
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
    if (event.type === "keydown") {
        // TODO: Make sure this was an input character that we care about

    }

    // FOR FUTURE USE
}

// Bind event handlers to input objects
$('#name').bind({
    keydown: propertyChange,
    paste: propertyChange
});