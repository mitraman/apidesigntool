// ************************************************************************
// ** typeahead.js
// ** 
// ** creation, management and handlers for ACE editor typeahead boxes.
// ** 
// ** Preconditions: Requires variables to be initialized:
// **   responseEditor
// **   activeNode
// ************************************************************************

var typeAheadEnabled = false;
var expectedFocusChange = false;
var ignoreDataChange = false;

responseEditor.on("blur", function( e ) {
    if( !expectedFocusChange ) {        
        $('#type-ahead').dialog("close");
    }    
});

responseEditor.on("keyup", function( e ) {
    console.log(e);
});

// The list of ALPS descriptor objects used for typeaheads
// TODO: I might do something clever later, but for now just grab the global variable descriptors.
var alpsDescriptors = descriptors;

// Update editor if type-ahead selection is clicked
function suggestionClicked(title, token) {
    // Complete the text based on the selection chosen.
    console.log(token);
    var appendText = title.substring(token.length);
    
    // We used to add a quote to the end, but it wasn't helping so I've removed that.
    responseEditor.insert(appendText);
    $('#type-ahead').dialog("close");

}


// Create the empty type ahead dialog box
function createTypeAheadBox(range) {

    var coords = responseEditor.renderer.textToScreenCoordinates(range.start.row, range.start.column);

    // TODO: the offset should be based on the font height / screen size
    var yOffset = 20;
            
    // Let our focus listener know that we are temporarily taking focus away
    expectedFocusChange = true;

    $('#type-ahead').dialog({
        position: [coords.pageX, coords.pageY + yOffset],
        closeOnEscape: true,
        draggable: false,
        resizable: false,
        dialogClass: "type-ahead"
    });
    
    // Set the focus back on the ace editor pane so the user can continue to type
    responseEditor.focus();
            
    // reset our focus flag so that we can catch focus change events
    expectedFocusChange = false;
}

// *** The main routine
// Detects changes to the response editor and creates type ahead boxes when necessary
responseEditor.on("change", function (e) {

    // in some cases we may change the editor data without having a type ahead box popup
    if( ignoreDataChange ) { 
        return;
    }
    
    // update the in-memory node object with the text change
    activeNode.responseData = responseEditor.getSession().getValue();

    // create a type-ahead box if the user enters a letter that matches one of the ALPS vocabularies
    // we will only create a type-ahead if this is the first character after a non alphanumeric    
    if (e.data.action === "insertText") {
        var range = e.data.range.clone();
        range.start.column--;
        range.end.column--;
        var prevChar = responseEditor.getSession().getTextRange(range);
        // regex check to see if the previous character was a non-alphanumeric
        if (!prevChar.match(/^[0-9a-z]+$/)) {

            createTypeAheadBox(range);
            ALPStypeAheadEnabled = true;
            tokenStartColumn = e.data.range.start.column; 
            tokenStartRow = e.data.range.start.row;
        }
    }

    if (ALPStypeAheadEnabled) {
        var selectionRange = e.data.range.clone();
        selectionRange.start.column = tokenStartColumn;
        selectionRange.start.row = tokenStartRow;
        var token = responseEditor.getSession().getTextRange(selectionRange);

        $('#type-ahead-list').find('div').remove();

        var foundMatch = false;
        
        //console.log(descriptors);
        
        var typeAheadCount = 0;
        for( var descriptorId in descriptors ) {
            if( typeAheadCount > 8 ) break;
            var descriptor = descriptors[descriptorId];
            //console.log(descriptor);
            if (descriptor.id.substring(0, token.length) === token) {
                //console.log('adding to type-ahead list');
                foundMatch = true;                
                $('#type-ahead-list').append("<div class=\"type-ahead-suggestion\" style=\"white-space: nowrap; cursor: pointer;\"><a onclick=\"suggestionClicked('" + descriptor.id + "', '" + token + "');\" href=\"#\">" + descriptor.id + "</a></div>");
                typeAheadCount++;
            }
        }

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
        var prevChar = responseEditor.getSession().getTextRange(range);
        if (prevChar === "\"") {

            var coords = responseEditor.renderer.textToScreenCoordinates(range.start.row, range.start.column);

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
            responseEditor.focus();

            typeAheadEnabled = true;
            tokenStartColumn = e.data.range.start.column + 1; // ignore the initial link indicator 
            tokenStartRow = e.data.range.start.row;
        }
    }

    if (typeAheadEnabled) {
        var selectionRange = e.data.range.clone();
        selectionRange.start.column = tokenStartColumn;
        selectionRange.start.row = tokenStartRow;
        var token = responseEditor.getSession().getTextRange(selectionRange);

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


