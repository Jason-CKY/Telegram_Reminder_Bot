var token = "xxxx";
var telegramUrl = "https://api.telegram.org/bot" + token;
var webAppUrl = "xxxx";
var ssId = "xxxx";

function getMe() {
  var url = telegramUrl + "/getMe";
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

function setWebHook(){
  var url = telegramUrl + "/setWebhook?url=" + webAppUrl;
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

function doPost(e){
  var Utils = new Util();
  var logSheet = SpreadsheetApp.openById(ssId).getSheets()[0];
  var bot = new Bot(token, logSheet);
  var data = JSON.parse(e.postData.contents);
  if(data.message){
    var text = data.message.text;
    if(text == "/start" || text == "/help"){
      bot.start(data);
    }else if(text == '/remind'){
      bot.remindMessage(data);
    }else if(text == '/delete'){
      bot.deleteMessage(data);
    }
    else if(text.split(" ")[0] == "/remind"){
      if(Utils.isValidReminder(text)){
        bot.addReminder(data);
      }else{
        bot.invalidInputMessage(data);
      }
    }else if(text == "/list"){
      bot.listReminders(data);
    }else if(text.split(" ")[0] == "/delete"){
      bot.deleteReminder(data);
    }
  }
}