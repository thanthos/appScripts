const sheetName = "feeds";
const entitySheetNames = "entity";
const createNameSpace = XmlService.getNamespace ('http://purl.org/dc/elements/1.1/');
var headerBuffer = null;
var entityHeaderBuffer = null;
var insertedCount = 0;


function getFeedsSheet(){
  //Change this to redirect the source to another sheet.
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet ) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(["Id","Title","Author","URL","Date Created","Summary", "commentRss", "Category"]);
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
    var entities = retrieveEntitySentiment(summary).entities; ; 
    entities.forEach(function(item){
      
      var values = header.map(function(key){
        
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
            return item.sentiment.magnitude;
          case "sentiment.score":
            return item.sentiment.score;
          default:
            return "";
        }
      });
      sheet.appendRow(values);     
    });
    
    
  }catch(exception){
    console.error("Error adding analysis Entities.\nError:%s.\nID:%s",exception, id);
  }
}

function appendEntry( xmlEntry ){
  
  var sheet = getFeedsSheet();
  var headerArray = getHeader();
  if (!isArticlePresent(xmlEntry) ){
    //console.log("New Article %s",xmlEntry);
    var arr = headerArray.map(function(key){
      //      console.log("Processing Key %s", key);
      switch(key) {
        case "Id":
          var e = xmlEntry.getChild("guid")|| xmlEntry.getChild("id",xmlEntry.getNamespace());
          return e.getText();
          break;
        case "Date Created": 
          var e = xmlEntry.getChild("published",xmlEntry.getNamespace())|| xmlEntry.getChild("pubDate");
          try{
            var d = new Date(Date.parse(e.getText()));
            return d.toString();
          }catch ( err ) {
            console.error("Error Converting/Parsing Date Obj String %s. Error %s",e.getText(),err);
            return e.getText();
          }
          break;
        case "Author": 
          var e = xmlEntry.getChild("author",xmlEntry.getNamespace())||xmlEntry.getChild("creator",createNameSpace);   
          //          console.log("What is E %s",e);
          if (!e) return "";
          if (e.getChild("name",xmlEntry.getNamespace())){
            var value = e.getChild("name",xmlEntry.getNamespace()).getText();
            //            console.log("Atom - Author - %s",value);
            return value.trim();
          }else{
            var value = e.getValue();
            //            console.log("RSS - Creator - %s",e.getText());
            return value.trim();
          }
          break;
        case "URL": 
          var e = xmlEntry.getChild("link",xmlEntry.getNamespace())|| xmlEntry.getChild("link");
          return e.getText()||e.getAttribute("href").getValue();          
          break;
        case "Summary": 
          var e = xmlEntry.getChild("description")|| xmlEntry.getChild("summary",xmlEntry.getNamespace());
          return e.getText().trim();          
          break;   
        case "Title": 
          var e = xmlEntry.getChild("title")||xmlEntry.getChild("title",xmlEntry.getNamespace());
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
        default:
          return "";
      }
    });
    //    console.log("Processed %s",arr);
    sheet.appendRow(arr);
    appendEntities(arr);
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