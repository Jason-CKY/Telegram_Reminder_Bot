var Bot = function(token, logSheet){
  this.telegramURL = 'https://api.telegram.org/bot' + token;
  this.logSheet = logSheet;
  this.logSheet.getRange("H2:H").setNumberFormat("@");
  this.logSheet.getRange("I2:I").setNumberFormat("@");
  this.logSheet.getRange("C2:C").setNumberFormat("@")
  this.logSheet.getRange("D2:D").setNumberFormat("@")
  this.logSheet.getRange("E2:E").setNumberFormat("@")
  
  this.start = function(data){
    var reply_string =  "This bot lets you set reminders! The following commands are available:\n"+
                        "/remind sets a reminder.\n" +
                        "/list displays all the reminders in the current chat.\n" +
                        "/delete deletes a reminder.\n\n\n" + 
                        "Note that all reminders set on this bot can be accessed by the user hosting this bot. Do not set any reminders that contain any sort of private information.";
                        //"/setspam set chat reminders to repeat every 5 seconds until acknowledged, default False.";
    this.sendMessage(data.message.chat.id, reply_string);
  }
  
  this.listReminders = function(data){
    var chatID = data.message.chat.id;
    var rows = this.logSheet.getDataRange().getValues();
    var filteredRows = rows.filter(function(row){
      if(row[2] == chatID){
        return row;
      }
    });
    
    var reply_string = 'These are the reminders for this chat: \n' + 
                        '------------------------------------------------------\n';

    for(var i=0; i<filteredRows.length; i++){
      var reminderID = filteredRows[i][5];
      var frequency = filteredRows[i][6];
      var date = filteredRows[i][7];
      var time = filteredRows[i][8];
      var reminderText = filteredRows[i][9];
//      this.sendMessage(chatID, "id=" + reminderID + "| \t" + frequency + " " + date + " " + time + ": " + reminderText + "\n" +
//                      '------------------------------------------------------\n'  );
      reply_string += "<b>id=" + reminderID + "</b> | \t" + frequency + " " + date + " " + time + ": " + reminderText + "\n" +
                      '------------------------------------------------------\n';    
    }
//    this.sendMessage(chatID, reply_string);
    reply_string += "To delete a reminder, type /delete &lt;id&gt;"
    this.sendMessage(chatID, reply_string);
  }
  
  this.deleteReminder = function(data){
    var reminderID = data.message.text.split(" ")[1];
    var rows = this.logSheet.getDataRange().getValues();
    var rowNum = 0;
    var foundReminder = false;
    var filteredRows = rows.filter(function(row, index){
      if(row[5] == reminderID && row[2] == data.message.chat.id){
        foundReminder = true;
        rowNum = index + 1;
        return row;
      }
    });
    if(foundReminder){
      var triggerID = filteredRows[0][4];
      this.deleteTrigger(triggerID);
      this.logSheet.deleteRow(rowNum);
      this.sendMessage(data.message.chat.id, "Reminder ID " + reminderID + " is deleted."); 
    }else{
      this.sendMessage(data.message.chat.id, "Reminder not found");
    }
  }
  
  this.addReminder = function(data){
    // get reminder text and frequency 
    var Utils = new Util();
    var reminderDate, reminderMessage, frequency;
    
    [reminderDate, reminderMessage, frequency] = Utils.formatReminderInput(data.message.text);
//    this.sendMessage(data.message.chat.id, reminderDate);
    if(reminderDate.getTime() - new Date().getTime() < 0){
      this.sendMessage(data.message.chat.id, "Reminder cannot be set in the past. Type /remind for more information");
      return;
    }
    
    var messageID = data.message.message_id;
    var fromID = data.message.from.id;
    var chatID = data.message.chat.id;
    var formattedDate = Utilities.formatDate(new Date(), "GMT+8", "yyyy/MM/dd HH:mm:ss");
    
    var date = data.message.text.split(" ")[2];
    var time = data.message.text.split(" ")[3];
    
    var reminderID = parseInt(this.logSheet.getRange(this.logSheet.getLastRow(), 6).getValue()) + 1;
    if(isNaN(reminderID)){
      reminderID = 1;
    }
    
    var date = data.message.text.split(" ")[2];
    var time = data.message.text.split(" ")[3];
    var reply_string = ["Reminder set for", frequency, date, time, "with message:", reminderMessage].join(" ");
    try{
      this.sendMessage(chatID, reply_string);
    }catch(err){
      var errorMessage = `Error in parsing reminder text. This bot parses text in html format.
Replace any unintentional tags with the following:
'<' to '&lt;'
'>' to '&gt;'
'&' to '&amp;'
See more information at https://core.telegram.org/bots/api#html-style`
      this.sendRawMessage(chatID, errorMessage);
      return;
    }
    
    var newTrigger = ScriptApp.newTrigger("createReminderTrigger").timeBased().after(reminderDate.getTime() - new Date().getTime()).create();
    var triggerID = String(newTrigger.getUniqueId());

    var rowData = [formattedDate, messageID, chatID, fromID, triggerID, reminderID, frequency, date, time, reminderMessage];
    this.logSheet.appendRow(rowData);
    
  }
  
  this.sendRawMessage = function(chatID, message){
    var reply = {
      'chat_id': chatID,
      'text': message,
      'disable_web_page_preview': true,
    };
    var method = 'sendMessage';
    var options = {
      'method' : 'post',
      'contentType': 'application/json',
      'payload' : JSON.stringify(reply)
    };
    var response = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/' + method, options);
  }
  this.sendMessage = function(chatID, message){
    var reply = {
      'chat_id': chatID,
      'text': message,
      'parse_mode': 'HTML',
      'disable_web_page_preview': true,
    };
    var method = 'sendMessage';
    var options = {
      'method' : 'post',
      'contentType': 'application/json',
      'payload' : JSON.stringify(reply)
    };
    var response = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/' + method, options);  
  }
  
  this.deleteTrigger = function(triggerID){
    var trig = ScriptApp.getProjectTriggers();
    for(var i=0; i<trig.length; i++){
      if(trig[i].getUniqueId() == triggerID){
        ScriptApp.deleteTrigger(trig[i]);
      }
    }
  }
  
  this.remindMessage = function(data){
    var text = `To set a single reminder, use the following syntax:
    /remind once &lt;YYYY-MM-DD&gt; &lt;HH:MM&gt; &lt;message&gt;
    
    E.g. /remind once 2020-10-01 16:15 Pay bills!
    
    To set a repeat reminder, use the following syntax:
    /remind every &lt;frequency&gt; &lt;HH:MM&gt; &lt;message&gt;	
    E.g. /remind every day 08:00 Go swimming.
/remind every week-5 18:00 Friday drinks!
/remind every month-1 12:00 Pay Phone Bills!
    
    Note: week-1 = Monday, week-7 = Sunday, month-1 = 1st of every month, month-12 = 12th of every month
    If month is set to 31, reminders will be sent on the 1st of the following month for months with less than 31 days.`
    
    this.sendMessage(data.message.chat.id, text);
  }
  
  this.deleteMessage = function(data){
    this.sendMessage(data.message.chat.id, 'To delete a reminder, type /delete &lt;id&gt;');
  }
  
  this.invalidInputMessage = function(data){
    this.sendMessage(data.message.chat.id, 'Invalid Reminder. Type /remind to find out the proper syntax');
  }
};

function createReminderTrigger(event){
  var Utils = new Util();
  var logSheet = SpreadsheetApp.openById(ssId).getSheets()[0];
  var bot = new Bot(token, logSheet);
  var triggerID = String(event.triggerUid);
  var rowNum;
  var rows = bot.logSheet.getDataRange().getValues();
  var filteredRows = rows.filter(function(row, index){
    if(String(row[4]) == triggerID){
      rowNum = index + 1;
      return row;
    }
  });
    
  var trig = ScriptApp.getProjectTriggers();
  for(var i=0; i<trig.length; i++){
    if(trig[i].getUniqueId() == triggerID){
      var frequency = filteredRows[0][6];
      var reminderText = filteredRows[0][9];
      var chatID = filteredRows[0][2];
      bot.sendMessage(chatID, reminderText);
      if(frequency == 'once'){
        bot.logSheet.deleteRow(rowNum);
      }else if(frequency == 'every'){
        [reminderDate, reminderMessage, frequency] = Utils.formatReminderInput(['/remind', filteredRows[0][6], filteredRows[0][7], filteredRows[0][8], filteredRows[0][9]].join(" "));
        var newTrigger = ScriptApp.newTrigger("createReminderTrigger").timeBased().after(reminderDate.getTime() - new Date().getTime()).create();
        triggerID = String(newTrigger.getUniqueId());
        bot.logSheet.getRange(rowNum, 5).setValue(triggerID);
      }
      ScriptApp.deleteTrigger(trig[i]);
    }
  }
}