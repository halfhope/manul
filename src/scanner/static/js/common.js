﻿var ajaxErrorCounter = 0;
var maxAjaxErrors = 3;

var scanForMalware = true;
var requestDelay = 5;

var numberFilesScanned = 0;
var numberFilesToScan = 0;

function showErrorMessage(caption, text) {

    $('#spinner_gif').hide();
    $('#startButton').hide();
    $('#configPanel').hide();
    $('#scannerCaption').hide();
    $('#scannerDescription').hide();
    $('#settingsLink').hide();
    $('#progressbar').hide();
    $('#progressbar_text').hide();

    $('#errorMessage').show();
    $('#errorMessage').removeClass('hidden');

    $('#errorCaption').text(caption);
    $('#errorFormErrorCaption').attr('value', caption);

    $('#errorText').text(text);
    $('#errorFormErrorText').attr('value', text);    

    console.log(caption + ' ' + text);
}

$(document).ready(function(){  

    try {

        $('#scanForMalwareCheckbox').change(function() {      
            scanForMalware = this.checked;
        });

        $('#requestDelayTextbox').on('change keypress paste focus textInput input', function() {              
            requestDelay = parseInt(this.value);
        });

        function finish() {
            $('#result_area').show();
            $('#spinner_gif').hide();
            $('#startButton').hide();
            $('#settingsLink').hide();
            $('#progressbar').hide();
            $('#progressbar_text').hide();
            $('#configPanel').hide();
            $('#scannerCaption').hide();
            $('#scannerDescription').hide();
        }

        function finishGetFileList() {
            $('#spinner_gif').hide();
            if (!scanForMalware) {
                finish();
            } else {
                $('#scanForMalwareDiv').hide();
                sendRequest("index.php?controller=scanner&a=getSignatureScanResult&delay=" + requestDelay, handleSignatureScan);
                $('#progressbar').show();
            }
        }

        function handleSignatureScan(response) {

               if (response.phpError || ( response.meta && response.meta.phpError)) {
                   errorInfo = response.phpError ? response.phpError : response.meta.phpError;
                   showErrorMessage('PHP error', errorInfo);
                   return -1;
               }

               if (response.status == 'inProcess')
               { 
                   lastScannedFile = response.data.lastFile;
                   numberFilesScannedThisTime = parseInt(response.data.filesScannedThisTime)
                   numberFilesLeft = parseInt(response.data.filesLeft)
                   numberFilesScanned += numberFilesScannedThisTime;
                   
                   if (!numberFilesToScan) {
                       numberFilesToScan = numberFilesLeft + numberFilesScannedThisTime;
                   }
          
                   signatureScanProgress = numberFilesScanned * 100 / numberFilesToScan;
                   progressBarWidth = Math.round(signatureScanProgress) + '%';
                   
                   $('#progressbar_inner').css('width', progressBarWidth);

                   $('#progressbar_text').show();
                   $('#current_folder').text(lastScannedFile);
                   $('#files_found').text(numberFilesScanned);
                   $('#files_total').text(numberFilesToScan);

                   sendRequest("index.php?controller=scanner&a=getSignatureScanResult&delay=" + requestDelay, handleSignatureScan);

               } else if (response.status == 'finished') {
                                  
                   finish();
                                  
               } else if (response.type == 'error') {

                   showErrorMessage('Server side error', response.data);

               }
                         
            console.log(response);
        }

        function handleGetFileList(response) {

               if (response.phpError || ( response.meta && response.meta.phpError)) {
                   errorInfo = response.phpError ? response.phpError : response.meta.phpError;
                   showErrorMessage('PHP error', errorInfo);
                   return -1;
               }

               if (response.meta.status == 'inProcess')
               { 
                   console.log('num_dirs=' + response.data.length);

                   sendRequest("index.php?controller=scanner&a=getFileList&delay=" + requestDelay, handleGetFileList);

               } else if (response.meta.status == 'finished') {
                   
                   sendRequest("index.php?controller=scanner&a=getWebsiteLog&delay=" + requestDelay, function() {finishGetFileList();});
                                  
               } else if (response.meta.type == 'error') {
                   
                   showErrorMessage('Server side error', response.data);
               }
                         
            console.log(response);
        }

        function sendRequest(url, handleResponse) {        

            $.getJSON(url, function(responseJSON) { 

               handleResponse(responseJSON);
               ajaxErrorCounter = 0;           
               
            })
              .fail(function(response) {
                ajaxErrorCounter++;
                console.log("ajax error " + ajaxErrorCounter + ' ' + JSON.stringify(response));
                if (ajaxErrorCounter < maxAjaxErrors) {
                    sendRequest(url, handleResponse);
                } else {
                
                   showErrorMessage('Ajax critical error', 'Could not properly handle AJAX request ' + JSON.stringify(response));

                }
            })
        }
            
        $("#startButton").click(function() {
            $('#spinner_gif').show();        
            $(this).attr('value', PT_STR_BUTTON_CANCEL);
            console.log("getFileList");
            sendRequest("index.php?controller=scanner&a=getFileList&delay=" + requestDelay, handleGetFileList);
            $(this).hide();
        });

        sendRequest("index.php?controller=scanner&a=cleanUp", function() {console.log('Cleanup sent')});


        $("#settingsLink").click(function() {        
            if ($('#configPanel').is(":visible")) { 
                $('#configPanel').hide();

            } else {
                $('#configPanel').show();
            }        
         } 
        );

  
       $("#deleteButton").click(function() { 
           if (confirm(PT_STR_DELETE_TOOL)) {
              deleteTool();
           } 
       });
      
      function deleteTool() {
          $.post( "index.php?controller=executor", { "a": "selfDelete" })
           .done(function( data ) {
               console.log( "Data Loaded: " + data );
               var response = JSON.parse(data);
               if (response.result == "ok") { 
                   bootbox.alert(PT_STR_TOOL_DELETED); 
               } else if (response.result == "error") {
                   bootbox.alert(PT_STR_TOOL_DELETED + ": " + response.details); 
               } else {
                   bootbox.alert(PT_STR_TOOL_DELETED); 
               }               
           });
      }

    } catch(err) {
        showErrorMessage('Javascript error', err);
    }

});

