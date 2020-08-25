const sheetName = "feeds";
const entitySheetNames = "entity";
const createNameSpace = XmlService.getNamespace ('http://purl.org/dc/elements/1.1/');
const _feedHeader = ["Id","Label","Title","Author","URL","Date Created","Summary", "commentRss", "Category"];
const _entityHeader = [_feedHeader[0],_feedHeader[5],"Name","Type","salience","sentiment.magnitude","sentiment.score"];
var headerBuffer = null;
var entityHeaderBuffer = null;

function getFeedsSheet(){
  //Change this to redirect the source to another sheet.
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet ) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(_feedHeader);
  }
  return sheet;
}

function getEntitiesSheet(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(entitySheetNames);
  if (!sheet ) {
    sheet = ss.insertSheet(entitySheetNames);
    sheet.appendRow(_entityHeader);
  }
  return sheet;
}

function isArticlePresent(element) {
  //Can improve this by limiting the search to the ID column.
  var sheet = getFeedsSheet();
  var id = element.getChild("guid")||element.getChild("id",element.getNamespace());
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
  var id = values[feedHeader.indexOf(_feedHeader[0])];
  var d = values[feedHeader.indexOf(_feedHeader[5])];
  var summary = values[feedHeader.indexOf(_feedHeader[6])];
  try{
    var entities = retrieveEntitySentiment(summary).entities;
    entities.forEach(function(item){

      var entityData = header.map(function(key){

        switch(key) {
          case "Id":
            return id;
          case _feedHeader[5]:
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
    var arr = headerArray.map(function(key){
      var entity = null;
      switch(key) {
        case "Id":
          entity = xmlEntry.getChild("guid")|| xmlEntry.getChild("id",xmlEntry.getNamespace());
          return entity.getText();
          break;
        case _feedHeader[5]:
          entity = xmlEntry.getChild("published",xmlEntry.getNamespace())|| xmlEntry.getChild("pubDate");
          try{
            var d = new Date(Date.parse(e.getText()));
            return d.toString();
          }catch ( err ) {
            console.error("Error Converting/Parsing Date Obj String %s. Error %s",entity.getText(),err);
            return entity.getText();
          }
          break;
        case "Author":
          entity = xmlEntry.getChild("author",xmlEntry.getNamespace())||xmlEntry.getChild("creator",createNameSpace);
          if (!entity) {
            return "";
          }
          else if (entity.getChild("name",xmlEntry.getNamespace())){
            return entity.getChild("name",xmlEntry.getNamespace()).getText().trim();
          }else{
            return entity.getValue().trim();
          }
          break;
        case "URL":
          entity = xmlEntry.getChild("link",xmlEntry.getNamespace())|| xmlEntry.getChild("link");
          return entity.getText()||entity.getAttribute("href").getValue();
          break;
        case "Summary":
          entity = xmlEntry.getChild("description")|| xmlEntry.getChild("summary",xmlEntry.getNamespace());
          return entity.getText().trim();
          break;
        case "Title":
          entity = xmlEntry.getChild("title")||xmlEntry.getChild("title",xmlEntry.getNamespace());
          return entity.getText();
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
    sheet.appendRow(arr);
    SpreadsheetApp.flush();
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

  var _targetSheet = SpreadsheetApp.getActive().getSheetByName(`${sheet.getName()}_${cutoffDate.getFullYear()}_${cutoffDate.getMonth()}`);
  if ( !_targetSheet ){
    _targetSheet = SpreadsheetApp.getActive().insertSheet(`${sheet.getName()}_${cutoffDate.getFullYear()}_${cutoffDate.getMonth()}`);
    _targetSheet.appendRow(header.getValues()[0]);
  }

  var effectiveMaxRows = maxRows || sheet.getLastRow();
  console.log("effectiveMaxRows -- %s",effectiveMaxRows);


  /*-- method 1
  //  var done = false;
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
   End Method 1 */

  // Method 2
  var values = sheet.getRange(2,1,effectiveMaxRows,sheet.getLastColumn()).getValues();
  console.log("Values.Length %s", values.length);

  try{

    for ( var i = 0, rowIndex = 2; i < values.length; i++){
      var rowValues = values[i];
      var recDate = new Date(rowValues[dateIndex]);
      if ( recDate < cutoffDate ) {
        target_sheet.appendRow(rowValues);
        sheet.deleteRow(rowIndex);
        rowCount++;
      }else{
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
