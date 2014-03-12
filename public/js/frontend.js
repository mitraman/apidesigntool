

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
        
        console.log(graph.nodes);
        
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
    var docStr = JSON.stringify(doc, null, '\t');
    ALPSEditor.setValue(docStr);
    $("#profile-name").val(profiles[selectedVal].name);
    
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
    editor.setValue(node.responseData);
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
    editor.getSession().setValue('');

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
    var linkTokens = editor.getSession().getValue().match(re);

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
    //updateNodeOnServer(activeNode);
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

// Create the editor
$('#editor').height(parentHeight);
var editor = ace.edit("editor");
editor.setTheme("ace/theme/dawn");
editor.getSession().setMode("ace/mode/json");

// Create the ALPS editor
$("#ALPS-editor").height(parentHeight);
var ALPSEditor = ace.edit("ALPS-editor");
ALPSEditor.setTheme("ace/theme/dawn");
editor.getSession().setMode("ace/mode/json");

// Update editor if type-ahead selection is clicked
function suggestionClicked(title, token) {
    // Complete the text based on the selection chosen.
    console.log(token);
    var appendText = title.substring(token.length);
    editor.insert(appendText + "\"");
    $('#type-ahead').dialog("close");

}

//*** TEMPORARY - TO BE REPLACED BY DYNAMIC ALPS LIST FROM BACKEND
var alpsDescriptors = {
    item: {
        id: 'item'
    },
    collection: {
        id: 'collection'
    }
};

//TODO: handle the case where we are loading data instead of typing it?
// Listen for changes in the response editor 
editor.on("change", function (e) {
    
    if( disableTypeAhead ) { 
        return;
    }
    
    // update the in-memory object with the change
    activeNode.responseData = editor.getSession().getValue();

    // TODO: Create a different div class for each type of type-ahead

    // create a type-ahead box if the user enters a letter that matches one of the ALPS vocabularies
    // we will only create a type-ahead if this is the first character after a non alphanumeric    
    if (e.data.action === "insertText") {
        var range = e.data.range.clone();
        range.start.column--;
        range.end.column--;
        var prevChar = editor.getSession().getTextRange(range);
        // regex check to see if the previous character was a non-alphanumeric
        if (!prevChar.match(/^[0-9a-z]+$/)) {
            console.log('I would do a type ahead here!');
            // TODO: Make this a callable function so I can reuse it for the other typeahead case
            var coords = editor.renderer.textToScreenCoordinates(range.start.row, range.start.column);

            // TODO: the offset should be based on the font height / screen size
            var yOffset = 20;
            $('#type-ahead').dialog({
                position: [coords.pageX, coords.pageY + yOffset],
                closeOnEscape: true,
                draggable: false,
                resizable: false,
                dialogClass: "type-ahead"
            });
            // Set the focus back on the ace editor pane so the user can continue to type
            editor.focus();

            ALPStypeAheadEnabled = true;
            tokenStartColumn = e.data.range.start.column; // ignore the initial link indicator 
            tokenStartRow = e.data.range.start.row;
        }
    }

    if (ALPStypeAheadEnabled) {
        var selectionRange = e.data.range.clone();
        selectionRange.start.column = tokenStartColumn;
        selectionRange.start.row = tokenStartRow;
        var token = editor.getSession().getTextRange(selectionRange);

        $('#type-ahead-list').find('div').remove();

        var foundMatch = false;

        $.each(alpsDescriptors, function (index, descriptor) {
            if (descriptor.id.substring(0, token.length) === token) {
                foundMatch = true;
                $('#type-ahead-list').append("<div class=\"type-ahead-suggestion\" style=\"white-space: nowrap; cursor: pointer;\"><a onclick=\"suggestionClicked('" + descriptor.id + "', '" + token + "');\" href=\"#\">" + descriptor.id + "</a></div>");
            }
        });

        // end the type ahead if there are no matching results
        // TODO: handle the case where a user hits backspace
        if (!foundMatch) {
            $('#type-ahead').dialog("close");
        }

        // end the type ahead if the user enters a terminating character (non alpha-numeric).
        if (!e.data.text.match(/^[0-9a-z]+$/)) {
            $('#type-ahead').dialog("close");
        }
        
        //TODO close the type ahead box if the focus changes.
        
        //TODO close the type ahead box if the user hits escape.
        
    }

    // ** Type Ahead for Transitions
    // create a type-ahead box if the user enters these two characters: "$
    if (e.data.action === "insertText" && e.data.text === "$") {
        var range = e.data.range.clone();
        range.start.column--;
        range.end.column--;
        var prevChar = editor.getSession().getTextRange(range);
        if (prevChar === "\"") {

            var coords = editor.renderer.textToScreenCoordinates(range.start.row, range.start.column);

            // TODO: the offset should be based on the font height / screen size
            var yOffset = 20;
            $('#type-ahead').dialog({
                position: [coords.pageX, coords.pageY + yOffset],
                closeOnEscape: true,
                draggable: false,
                resizable: false,
                dialogClass: "type-ahead"
            });
            // Set the focus back on the ace editor pane so the user can continue to type
            editor.focus();

            typeAheadEnabled = true;
            tokenStartColumn = e.data.range.start.column + 1; // ignore the initial link indicator 
            tokenStartRow = e.data.range.start.row;
        }
    }

    if (typeAheadEnabled) {
        var selectionRange = e.data.range.clone();
        selectionRange.start.column = tokenStartColumn;
        selectionRange.start.row = tokenStartRow;
        var token = editor.getSession().getTextRange(selectionRange);

        // populate the type ahead list
        $('#type-ahead-list').find('div').remove();
        for( nodeId in graph.nodes ) {
            var node = graph.nodes[nodeId];
            if (node.title.substring(0, token.length) === token) {
                $('#type-ahead-list').append("<div class=\"type-ahead-suggestion\" style=\"white-space: nowrap; cursor: pointer;\"><a onclick=\"suggestionClicked('" + node.title + "', '" + token + "');\" href=\"#\">" + node.title + "</a></div>");
            }
        }
        $('#type-ahead-list').append("<div class=\"type-ahead-suggestion\" style=\"white-space: nowrap; cursor: pointer;\"><a href=\"#\">Create New Task...</a></div>");

        // end the type ahead if the user enters a terminating character (e.g. space or enter).
        // TODO: catch the escape character
        if (e.data.text == "\"") {
            $('#type-ahead').dialog("close");
        }

        // Make the entire div selectable in the type ahead suggestion list
        $(".type-ahead-suggestion").click(function () {
            var aaaaays = $(this).find("a");
            if (aaaaays.length > 0) {
                $(this).find("a")[0].onclick();
            }
            return false;
        });



    }
});


// ** Set editor highlighter based on the content-type once the user enters a value
$('#mime_type').bind('change', function (event) {
    var value = $('#mime_type').val();

    // If we understand the content-type, set the editor accordingly
    if (value.toUpperCase() === 'APPLICATION/JSON') {
        console.log('setting editor to JSON mode');
        editor.getSession().setMode("ace/mode/json");
    } else if (value.toUpperCase() === 'APPLICATION/XML' || value.toUpperCase() === 'TEXT/XML') {
        console.log('setting editor to XML mode');
        editor.getSession().setMode("ace/mode/xml");
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