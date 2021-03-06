 function parsefeed(feedUrl){

   var headers =  {
     'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36'
   };
   var params = {
     'contentType': 'application/xml	',
     'muteHttpExceptions': true,
     'headers': headers
   };

   var response = UrlFetchApp.fetch(feedUrl,params);
   if ( response.getResponseCode()  < 400  ) {
     return response.getContentText();
   }else{
     console.warn("HTTP Error %s, %s ",response.getResponseCode(),response.getContentText());
     return "";
   }
}

function parseXMLContent(xmlContent){
  var document = XmlService.parse(xmlContent);
  var entries = null;
  if ( document .hasRootElement() ) {
    var root = document.getRootElement();
    var atom = XmlService.getNamespace('http://www.w3.org/2005/Atom');
    if ( root.getName() === "feed" ){
      entries = root.getChildren("entry",atom);
      return entries;
    }
    else if (root.getName() === "rss" ){
      entries = root.getChild("channel").getChildren("item");
      return entries;
    }
    else{
      console.warn("Unknown Type");
      return [];
    }
  }
  console.warn("No Root Element Found");
  return [];
}

function getSampleHeader(entry){
  var headers = [];
  entry.getChildren().forEach(function(child){
    if (!headers.find(function(i){
      return i === child.getName();
    })) {
      headers.push(child.getName());
    }
  });
  return headers;
}
