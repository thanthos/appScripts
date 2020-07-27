function getFeedLinks() {
  var settings = getFeedSettings();
  var index = getSourceHeader().indexOf('Feeds URL');
  if (index != -1 ){
    var result = [];
    settings.forEach(function(row){
      if ( row[index] ) {
        result.push(row[index]); }
    });
    return result;
  }
}

function getFeedSettings(){
  var sheet = SpreadsheetApp.getActive().getSheetByName("source");
  return sheet.getRange(2, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
}


/**
Deprecated. Use V2 now as the function appendEntry will no longer send the items for google NLP api to process.
*/
function processFeeds(){
  var feedsURL = getFeedLinks();
  //var feedSettings = getFeedSettings();
  if ( feedsURL && Array.isArray(feedsURL) ) {
    console.log(feedsURL);
    feedsURL.forEach(function(url){
      try{
        console.info("Getting %s",url);
        var entries = parseXMLContent(parsefeed(url));
        console.info("Number of Feeds: %s",entries.length);
        insertedCount = 0;
        entries.forEach(function(item){
          var result = appendEntry(item);
//          appendEntities(result);
        });
        console.info("Inserted %s",insertedCount);
      }catch (exception){
        console.error("Issue Encountered: %s, Parsing Feed %s",url, exception);
      }
    });
  }
  console.log("Completed");
}


function processFeed_v2(){
  var feedSettings = getFeedSettings();
  var header = getSourceHeader();
  
  var lock = LockService.getScriptLock();
  // Wait for up to 30 seconds for other processes to finish.
  lock.waitLock(30000);
  
  feedSettings.forEach(function(row){
    var url = row[header.indexOf('Feeds URL')];
    var pattern = row[header.indexOf('Pattern')];
    var enabled = row[header.indexOf('Enable?')];
    var label = row[header.indexOf('Label')];
    var nla_enabled = row[header.indexOf('NLA Enable?')];
    var label = row[header.indexOf('Label')];
    try{
      insertedCount = 0;
      if ( enabled ) {
        console.info("Getting %s",url);
        var entries = parseXMLContent(parsefeed(url));
        console.info("Number of Feeds: %s",entries.length);
        entries.forEach(function(item){
          var result = appendEntry(item,label);
          if (nla_enabled && result ) {
            appendEntities(result);
          }
        });
        console.info("Inserted %s",insertedCount);
      }else{
        if ( url ) console.warn("%s is disabled",label);
      }
    }catch (exception){
      console.error("Issue Encountered: %s, Parsing Feed %s\n%s",exception, label, exception.stack);
    }
    
    // Release the lock so that other processes can continue.
    
  });
  lock.releaseLock();
  console.log("Completed");  
}


function getSourceHeader(){
  var sheet = SpreadsheetApp.getActive().getSheetByName("source");
  var values = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues();
  return values[0];
}

function housekeepData(){
  //Move the data from 5 weeks ago to another sheet.
  
  
  
}