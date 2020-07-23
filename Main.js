function getFeedLinks() {
  var sheet = SpreadsheetApp.getActive().getSheetByName("source");
  var feedsArray = sheet.getRange(2, 1, sheet.getLastRow(), 1).getValues();
  var result = [];
  feedsArray.forEach(function(row){
    if ( row[0] ) {
      result.push(row[0]); }
  });
  return result;
}


function processFeeds(){
  var feedsURL = getFeedLinks();
  console.log(feedsURL);
  feedsURL.forEach(function(url){
    try{
      console.info("Getting %s",url);
      var entries = parseXMLContent(parsefeed(url));
      console.info("Number of Feeds: %s",entries.length);
      insertedCount = 0;
      entries.forEach(function(item){
        appendEntry(item);
      });
      console.info("Inserted %s",insertedCount);
    }catch (exception){
      console.error("Issue Encountered: %s, Parsing Feed %s",url, exception);
    }
  });
  console.log("Completed");
}


function housekeepData(){
//Move the data from 5 weeks ago to another sheet.



}