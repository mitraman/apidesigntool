// ************************************************************************
// ** typeahead.js
// ** 
// ** creation, management and handlers for ACE editor typeahead boxes.
// ** 
// ** Preconditions: Requires variables to be initialized:
// **   responseEditor
// **   activeNode
// ************************************************************************

var linkTypeAheadEnabled = false;
var ALPSTypeAheadEnabled = false;
var expectedFocusChange = false;
var ignoreDataChange = false;

// Close the type ahead window if the user leaves the editor.
responseEditor.on("blur", function( e ) {
    if( !expectedFocusChange ) {        
        //$('#type-ahead').dialog("close");            
    }
    
});

// If the user clicks on a suggestion we don't want to pre-emptively close the typeahead box.
$("#type-ahead").mouseenter( function() {expectedFocusChange = true;} );
$("#type-ahead").mouseleave( function() {expectedFocusChange = false;} );

// Close the type-ahead window if the user hits escape.
$("#editor").on("keyup", function( e ) {    
    
    if( e.keyCode === 27 ) { 
        $('#type-ahead').dialog('close');        
        ALPSTypeAheadEnabled = false;
        linkTypeAheadEnabled = false;
    }else if( e.keyCode === 40 ) {
        // if the type-ahead dialog is open, move the selection down
    }else if( e.keyCode === 38 ) {
        // if the type-ahead dialog is open, move the selection up
    }else if( e.keyCode === 48 ) {
        linkTypeAheadEnabled = false;
        $('#type-ahead').dialog('close');
    }
});

// The list of ALPS descriptor objects used for typeaheads
// TODO: I might do something clever later, but for now just grab the global variable descriptors.
var alpsDescriptors = descriptors;

// Update editor if type-ahead selection is clicked

function createNode() {
    console.log('createNode()');
    $("#create-node").modal();
}

function suggestionClicked(title, token) {
    // Complete the text based on the selection chosen.
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

    console.log('opening dialog box');
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

$("#type-ahead").bind("dialogclose", function( e ) {
    console.log('was closed');
});


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
        
        // the start of this token will be to the right of the first non-alphanumeric character
        var document = responseEditor.getSession().getDocument();
        
        // get the location of the character to the left of the one that was entered        
        var range = e.data.range.clone();
        range.start.column--;
        range.end.column--;
        
        tokenStartColumn = e.data.range.start.column; 
        tokenStartRow = e.data.range.start.row;
        
        // e.g.somestuff=thisisthestartofthetoke  thiswouldalsobeatoke "$linktoke
        var prevChar = responseEditor.getSession().getTextRange(range);
        //console.log(prevChar);
                
        //TODO: reexcamine this logic - can be replaced with the for loop
        while( prevChar.match(/^[+_\-0-9a-z]+$/) ) {
            range.start.column--;
            range.end.column--;
            prevChar = responseEditor.getSession().getTextRange(range);
            tokenStartColumn--;                                    
        }        
        
        // Read all of the text that precedes this character to see if we should be treating this as a link token
        var cursorColumn = responseEditor.getSession().getSelection().getCursor().column;
        var lineRange = e.data.range.clone();
        lineRange.setStart(tokenStartRow, 0);
        var textLine = responseEditor.getSession().getTextRange(lineRange);
        //console.log(textLine);
        
        for( var i = textLine.length; i >= 0; i-- ) {
            if( textLine[i] === ')' ) {
                //make sure that this isn't just an empty parenthesis
                if( i === 0 || textLine[i-1] != '(' ) {
                    break;
                }
            }
            if( textLine[i] === '(' && i > 0 && textLine[i-1] === '$' ) {
                // make sure the link token hasn't been escaped with a \ character
                if( i < 2 || textLine[i-2] !== '\\' ) {
                    console.log('linktoken')
                    ALPSTypeAheadEnabled = false;
                    linkTypeAheadEnabled = true;
                    
                    // create a text range for this token
                    createTypeAheadBox(range);
                    
                    // update the start of the token based on the location of the link delim
                    tokenStartColumn = i+1;                                                            
                    
                    break;
                }
            }
        }
                
        if( !linkTypeAheadEnabled) {
            ALPSTypeAheadEnabled = true;
            createTypeAheadBox(range);
        }
                
    }

    if (ALPSTypeAheadEnabled) {        

        var selectionRange = e.data.range.clone();
        selectionRange.start.column = tokenStartColumn;
        selectionRange.start.row = tokenStartRow;
        var token = responseEditor.getSession().getTextRange(selectionRange);        

        $('#type-ahead-list').find('div').remove();

        var foundMatch = false;
            
        var typeAheadCount = 0;
        for( var descriptorId in descriptors ) {
            if( typeAheadCount > 8 ) break;
            var descriptor = descriptors[descriptorId];
            if (descriptor.id.substring(0, token.length) === token) {
                foundMatch = true;                
                
                $('#type-ahead-list').append("<div class=\"type-ahead-suggestion\" style=\"white-space: nowrap; cursor: pointer;\"><a onclick=\"suggestionClicked('" + descriptor.id + "', '" + token + "');\" href=\"#\">" + descriptor.id + "</a></div>");
                
                typeAheadCount++;
            }
        }
        
        if( typeAheadCount > 0 ) {
            // highlight the first suggestion
            //$("#type-ahead-list").children(".type-ahead-suggestion")[0].attr("class", "type-ahead-suggestion-highlight");
        }
        

        // end the type ahead if there are no matching results
        // TODO: handle the case where a user hits backspace
        if (!foundMatch) {
            $('#type-ahead').dialog("close");
        }

        // end the type ahead if the user enters a terminating character (non alpha-numeric).
        if (!e.data.text.match(/^[-+0-9a-z]+$/)) {
            $('#type-ahead').dialog("close");
        }        
        
    }

    if (linkTypeAheadEnabled) {
        var selectionRange = e.data.range.clone();
        selectionRange.start.column = tokenStartColumn;
        selectionRange.start.row = tokenStartRow;
        var token = responseEditor.getSession().getTextRange(selectionRange);
        
        console.log(token);
        
        // check for the case of the empty parenthesis ()
        if( token === ')' ) {
            console.log('empty parenthesis detected');
            token = '';
        }
        

        //TODO: If the user creates a link to a node that does not exist, they should be prompted to create it.

        // populate the type ahead list
        $('#type-ahead-list').find('div').remove();
        for( nodeId in graph.nodes ) {
            var node = graph.nodes[nodeId];
            if (node.title.substring(0, token.length) === token) {
                $('#type-ahead-list').append("<div class=\"type-ahead-suggestion\" style=\"white-space: nowrap; cursor: pointer;\"><a onclick=\"suggestionClicked('" + node.title + "', '" + token + "');\" href=\"#\">" + node.title + "</a></div>");
            }
        }
        $('#type-ahead-list').append("<div class=\"type-ahead-suggestion\" style=\"white-space: nowrap; cursor: pointer;\"><a onClick=\"createNode();\">Create New Task...</a></div>");

        // end the type ahead if the user enters a terminating character (e.g. space or enter).
        if (e.data.text == ")") {
            console.log('terminating');
            $('#type-ahead').dialog("close");
            linkTypeAheadEnabled = false;
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


