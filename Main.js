var insertedCount = 0;


function getFeedLinks() {
  var settings = getFeedSettings();
  var index = getSourceHeader().indexOf('Feeds URL');
  var result = [];
  if (index !== -1 ){
    settings.forEach(function(row){
      if ( row[index] ) {
        result.push(row[index]); }
    });
  }
  return result;
}

function getFeedSettings(){
  var sheet = SpreadsheetApp.getActive().getSheetByName("source");
  return sheet.getRange(2, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
}



function processFeed_v2(){
  var feedSettings = getFeedSettings();
  var header = getSourceHeader();

  var lock = LockService.getScriptLock();
  // Wait for up to 30 seconds for other processes to finish.
  lock.waitLock(30000);

  feedSettings.forEach(function(row){
    var url = row[header.indexOf('Feeds URL')];
    var enabled = row[header.indexOf('Enable?')];
    var label = row[header.indexOf('Label')];
    var nlaEnabled = row[header.indexOf('NLA Enable?')];

    try{
      insertedCount = 0;
      if ( enabled ) {
        console.info("Getting %s",url);
        var entries = parseXMLContent(parsefeed(url));
        console.info("Number of Feeds: %s",entries.length);
        entries.forEach(function(item){
          var result = appendEntry(item,label);
          if (nlaEnabled && result ) {
            appendEntities(result);
          }
        });
        console.info("Inserted %s",insertedCount);
      }else{
        if ( url ) {
          console.warn("%s is disabled",label);
        }
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
  var today = new Date();
  var cutoffDate = null;
  if ( today.getMonth() === 0 ){
    cutoffDate = new Date(`12/1/${today.getFullYear()-1} 0:00 +8`);
  }else{
    cutoffDate = new Date(`${today.getMonth()}/1/${today.getFullYear()} 0:00 +8`);
  }
  var lock = LockService.getScriptLock();
  // Wait for up to 30 seconds for other processes to finish.
  lock.waitLock(30000);

  housekeep_feedSheet(cutoffDate);
  housekeep_entitySheet(cutoffDate);

  lock.releaseLock();
  console.log("Completed");
}
