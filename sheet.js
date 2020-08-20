const sheetName = "feeds";
const entitySheetNames = "entity";
const createNameSpace = XmlService.getNamespace ('http://purl.org/dc/elements/1.1/');
var headerBuffer = null;
var entityHeaderBuffer = null;

function getFeedsSheet(){
  //Change this to redirect the source to another sheet.
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet ) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(["Id","Label","Title","Author","URL","Date Created","Summary", "commentRss", "Category"]);
  }
  return sheet;
}

function getEntitiesSheet(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(entitySheetNames);
  if (!sheet ) {
    sheet = ss.insertSheet(entitySheetNames);
    sheet.appendRow(["Id","Date Created","Name","Type","salience","sentiment.magnitude","sentiment.score"]);
  }
  return sheet;
}

function isArticlePresent(element) {
  //Can improve this by limiting the search to the ID column.
  var sheet = getFeedsSheet();
  var id = element.getChild("guid")||element.getChild("id",element.getNamespace());
  //console.log("Id %s",id);
  if ( id ){
    var textFinder = sheet.createTextFinder(id.getText());
    if (textFinder.findNext()) {
      return true;
    }
  }
  insertedCount++;
  return false;
}

function appendEntities(values){
  var sheet = getEntitiesSheet();
  var feedHeader = getHeader();
  var header = getEntityHeader();
  var id = values[feedHeader.indexOf("Id")];
  var d = values[feedHeader.indexOf("Date Created")];
  var summary = values[feedHeader.indexOf("Summary")];
  try{
    var entities = retrieveEntitySentiment(summary).entities;
    entities.forEach(function(item){

      var entityData = header.map(function(key){

        switch(key) {
          case "Id":
            return id;
          case "Date Created":
            return d;
          case "Name":
            return item.name;
          case "Type":
            return item.type;
          case "salience":
            return item.salience;
          case "sentiment.magnitude":
            try{
              return item.sentiment.magnitude;
            }catch(e){
              return "";
            }
            return "";
          case "sentiment.score":
            try{
              return item.sentiment.score;
            }catch(e){
              return "";
            }
            return "";
          default:
            return "";
        }
      });
      sheet.appendRow(entityData);
    });
  }catch(exception){
    console.error("Error adding analysis Entities.\nError:%s.\nID:%s",exception, id);
  }
  SpreadsheetApp.flush();
}

function appendEntry( xmlEntry, label ){

  var sheet = getFeedsSheet();
  var headerArray = getHeader();
  if (!isArticlePresent(xmlEntry) ){
    //console.log("New Article %s",xmlEntry);
    var arr = headerArray.map(function(key){
      //      console.log("Processing Key %s", key);
      var e = null;
      switch(key) {
        case "Id":
          e = xmlEntry.getChild("guid")|| xmlEntry.getChild("id",xmlEntry.getNamespace());
          return e.getText();
          break;
        case "Date Created":
          e = xmlEntry.getChild("published",xmlEntry.getNamespace())|| xmlEntry.getChild("pubDate");
          try{
            var d = new Date(Date.parse(e.getText()));
            return d.toString();
          }catch ( err ) {
            console.error("Error Converting/Parsing Date Obj String %s. Error %s",e.getText(),err);
            return e.getText();
          }
          break;
        case "Author":
          e = xmlEntry.getChild("author",xmlEntry.getNamespace())||xmlEntry.getChild("creator",createNameSpace);
          var value = "";
          //          console.log("What is E %s",e);
          if (!e) return "";
          if (e.getChild("name",xmlEntry.getNamespace())){
            value = e.getChild("name",xmlEntry.getNamespace()).getText();
            //            console.log("Atom - Author - %s",value);
            return value.trim();
          }else{
            value = e.getValue();
            //            console.log("RSS - Creator - %s",e.getText());
            return value.trim();
          }
          break;
        case "URL":
          e = xmlEntry.getChild("link",xmlEntry.getNamespace())|| xmlEntry.getChild("link");
          return e.getText()||e.getAttribute("href").getValue();
          break;
        case "Summary":
          e = xmlEntry.getChild("description")|| xmlEntry.getChild("summary",xmlEntry.getNamespace());
          return e.getText().trim();
          break;
        case "Title":
          e = xmlEntry.getChild("title")||xmlEntry.getChild("title",xmlEntry.getNamespace());
          return e.getText();
          break;
        case "commentRss":
          //TODO
          return "";
          break;
        case "Category":
          //TODO
          return "";
          break;
        case "Label":
          return label||"";
          break;
        default:
          return "";
      }
    });
    //    console.log("Processed %s",arr);
    sheet.appendRow(arr);
    SpreadsheetApp.flush();
    //This should not be commented out when using v1
    //appendEntities(arr);
    return arr;
  }
}

function getHeader(){
  if (!headerBuffer){
    var sheet = getFeedsSheet();
    var range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
    headerBuffer = range.getValues()[0];
  }
  return headerBuffer;
}

function getEntityHeader(){
  if (!entityHeaderBuffer){
    var sheet = getEntitiesSheet();
    var range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
    entityHeaderBuffer = range.getValues()[0];
  }
  return entityHeaderBuffer;
}


function _housekeep_sheet(sheet, cutoffDate, maxRows){
  var rowCount = 0;

  var header = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  var dateIndex = header.getValues()[0].indexOf("Date Created");

  var target_sheet = SpreadsheetApp.getActive().getSheetByName(sheet.getName()+"_"+cutoffDate.getFullYear()+"_"+cutoffDate.getMonth());
  if ( !target_sheet ){
    target_sheet = SpreadsheetApp.getActive().insertSheet(sheet.getName()+"_"+cutoffDate.getFullYear()+"_"+cutoffDate.getMonth());
    target_sheet.appendRow(header.getValues()[0]);
  }

  var effectiveMaxRows = maxRows || sheet.getLastRow();
  console.log("effectiveMaxRows -- %s",effectiveMaxRows);


  //-- method 1
  //  for (  var i = 0, rowIndex = 2; i < effectiveMaxRows; i++){
  //
  //    var row = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn());
  //    var rowValues = row.getValues();
  //    var rec_date = new Date(rowValues[0][dateIndex]);
  //    if ( rec_date < cutoffDate ) {
  //      target_sheet.appendRow(rowValues[0]);
  //      sheet.deleteRow(rowIndex);
  //      rowCount++;
  //    }else{
  //      rowIndex++;
  //    }
  //  }
  // End Method 1

  // Method 2
  var values = sheet.getRange(2,1,effectiveMaxRows,sheet.getLastColumn()).getValues();
  console.log("Values.Length %s", values.length);

  try{

    for ( var i = 0, rowIndex = 2; i < values.length; i++){
      var rowValues = values[i];
      var rec_date = new Date(rowValues[dateIndex]);
      //console.log("Check Date %s", rec_date);
      if ( rec_date < cutoffDate ) {
        target_sheet.appendRow(rowValues);
        sheet.deleteRow(rowIndex);
        rowCount++;
      }else{
        //console.log("Valid ");
        rowIndex++;
      }
    }
  }catch(exception){
      console.error("Encountered Exception %s,\n%s",exception, exception.stack);
  }finally{
    SpreadsheetApp.flush();
    console.info("Rows Moved: %s",rowCount);
  }
  // - End Method 2
}

function housekeep_feedSheet(cutoffDate){
  var sheet = SpreadsheetApp.getActive().getSheetByName("feeds");
  _housekeep_sheet(sheet, cutoffDate, 250);
}

function housekeep_entitySheet(cutoffDate){
   var sheet = SpreadsheetApp.getActive().getSheetByName("entity");
  _housekeep_sheet(sheet, cutoffDate, 250);

}

function test_continueRun(){
  var d = new Date("8/1/2020 0:00 +8");
  var sheet = SpreadsheetApp.getActive().getSheetByName("Copy of feeds");
  _housekeep_sheet(sheet, d, 5);

}
