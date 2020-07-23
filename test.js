
function test() {
  var output = ContentService.createTextOutput('<b>Hello, world!</b>');
  output.append('<p>Hello again, world.</p>');
  console.log(output.getContent());
}


function getToken(){
  console.log(ScriptApp.getIdentityToken());
  console.log(ScriptApp.getOAuthToken());
  
}


function test_getFeedLinks(){
  console.log(getFeedLinks());
  
}

function testGetHeader(){
  console.log(getHeader());
}


function testGetRSS(){
  
  var entries = parseXMLContent(parsefeed("https://www.channelnewsasia.com/rssfeeds/8395986"));
  
  console.log("Number of Entries %s", entries.length);
  
  if ( entries.length > 0 ) {
    
    var entry = entries[0];
    
    //console.log("Entry Value %s",entry.getValue());
    //console.log("Entry Text %s",entry.getText());
    //console.log("Entry Name %s",entry.getName());
    //console.log("Number of Children %s",entry.getChildren().length);
    //console.log("Getting Name Space %s",entry.getNamespace());
    //    var summary = entry.getChild("summary",entry.getNamespace());
    //    console.log("child Name = '%s'",summary.getName());
    //    console.log("child Value %s",summary.getValue().trim());
    //    console.log("Child content %s",summary.getContentSize());
    //    console.log("Child content %s",summary.getContent(0).asCdata().getText());
    console.log(entry.getValue());
    entry.getChildren().forEach(function(item){
      
      console.log("Name %s", item.getName());
      
    });
    
    
    //    var e = entry.getChild("published",entry.getNamespace())|| entry.getChild("pubDate");
    //    var v = e.getText();
    //    console.log("Value Text %s",v);
    //    var millisec = Date.parse(v);
    //    console.log("MilliSec %s",millisec);
    //    var d = new Date(millisec);
    //    console.log(d.toString());  
    //    var children = entry.getChildren();
    //    children.forEach(function(child){
    //////      console.log("child Value %s",child.getValue().trim());
    ////      console.log("child Text %s",child.getText().trim());
    //      console.log("child Name = '%s'",child.getName());
    ////      console.log("child child %s",child.getChildren().length);
    ////      
    ////      
    //    });
    //    
    
  }
  
}

function testLang(){
  
  var text = "Saw some jokers already listed NDP tote bag for sale..,,,and I wonder. Moi already have to many digital thermometer at home, one for each hole, can sell?";
  var entities = retrieveEntitySentiment(text).entities; 
  entities.forEach(function(entity){
    var name = entity.name;
    var type = entity.type;
    var mentions = entity.mentions;
    var sentiment = entity.sentiment;
    
    console.log("%s : %s - \nMentions Cnt:%s\nSentiment cnt:%s",name,type, mentions.length, sentiment.length, );
                console.log("Is mentions an Array - %s",Array.isArray(mentions));
    console.log("Is sentiment an Array - %s",Array.isArray(sentiment));
    
    if ( Array.isArray(mentions) ){
      mentions.forEach(function(item){
        console.log("1. %s : %s : %s ",JSON.stringify(item.text), item.type, item.sentiment);
      });
    }
    
    if ( Array.isArray(sentiment) ){
      sentiment.forEach(function(item){
        console.log("2. %s : %s ",JSON.stringitem.magnitude, item.score);
      });
    }
  });
  
  console.log(JSON.stringify(entities));
  
}

function testXMLContentParse() {
  
  var doc = XmlService.parse(text);
  console.log("Has Root Element %s",doc.hasRootElement());
  console.log("Content -  %s",doc.getAllContent());
  
  
  
}

function testXMLCdata(){
  
  
  var illegalCharacters = '<em>The Amazing Adventures of Kavalier & Clay</em>';
  var cdata = XmlService.createCdata(illegalCharacters);
  var text = XmlService.createText(illegalCharacters);
  var root = XmlService.createElement('root').addContent(cdata).addContent(text);
  var document = XmlService.createDocument(root);
  var xml = XmlService.getPrettyFormat().format(document);
  console.log(xml);
  
  var contents = root.getAllContent();
  var counter = 1;
  contents.forEach(function (item){
    if ( item.asCdata() ){
      console.log("%s) %s ", counter, item.asCdata().getText());
    }else{
      console.log("%s)  %s ", counter, item.getText());
    }
    
    counter++;
    
  });
  
  
}


function testHTMLOUTPUT(){

var output = HtmlService.createHtmlOutput('<b>Hello, world!</b>');
console.log(output.getContent());
}
