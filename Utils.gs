var Util = function(){
  this.timezone = "GMT+8";

  this.isValidReminder = function(userInput){
    /* ensure reminder command is valid
     must be in the form: 
     /remind <every/once> <date> <HH:MM> <message>
    */
    var frequency = userInput.split(" ")[1];
    var date = userInput.split(" ")[2];
    var time = userInput.split(" ")[3];
    
    return (userInput.split(" ").length >= 5) && (frequency == 'every' || frequency == 'once') &&
            this.isValidTime(time) && this.isValidDate(date);
  }
  
  this.isValidDate = function(date){
    if(date.split("-").length == 3 ){
      // check if its in the form YYYY-MM-DD
      var test_date = new Date(date);
      var month = parseInt(date.split('-')[1]);
      return !isNaN(Date.parse(date)) && (test_date.getMonth()+1)==month;
    }else if(date.split("-")[0] == "day"){
      return true;
    }else if(date.split("-")[0] == 'week'){
      var weekDay = parseInt(date.split("-")[1]);
      return weekDay >= 1 && weekDay <= 7;
    }else if(date.split("-")[0] == 'month'){
      var monthDay = parseInt(date.split("-")[1]);
      return monthDay >= 1 && monthDay <= 31;
    }
    return false;
  }
  
  this.isValidTime = function(time){
    if(time.split(":").length != 2 || time.split(":")[0].length != 2 || time.split(":")[1].length != 2){
      return false;
    }
    var hour = parseInt(time.split(":")[0]);
    var minute = parseInt(time.split(":")[1]);
    return (hour>=0 && hour<24) && (minute>=0 && minute<60)
  }
  
  this.formatReminderInput = function(inputString){
//    /remind once 2019/01/01 16:15 Pay bills!
//    /remind every day 08:00 Go running.
//    /remind every week-5 18:00 Friday drinks!
//    /remind every month-1 12:00 Mobile data reset.
//    return [Date object, reminderText, "once"/"week"/"month"]
    var text = inputString.split(" ");
    var frequency = text[1];
    var date = text[2];
    var time = text[3];
    var reminderText = text.slice(4).join(" ");
    var outputDate;
    if(text[1] == 'once'){
      outputDate = new Date([date, time, this.timezone].join(" "));
    }else{
      if(date == 'day'){
      // if daily reminder, see if the time has already passed
      // if time has passed, return time in milliseconds before its due again
        var currentDate = Utilities.formatDate(new Date(), "GMT+8", "yyyy/MM/dd");
        outputDate = new Date([currentDate, time, this.timezone].join(" "));
        if(outputDate.getTime() - new Date().getTime() < 0){
          // if time already passed
          var MILLIS_PER_DAY = 1000 * 60 * 60 * 24;
          outputDate = new Date(outputDate.getTime() + MILLIS_PER_DAY);
        }
      }else{
        // weekly or monthly
        // weekly case 0: sunday, 6: saturday
        if(date.split('-')[0] == 'week'){
          var currentDayOfWeek = parseInt(Utilities.formatDate(new Date(), "GMT+8", "u"));
          var currentDate = Utilities.formatDate(new Date(), "GMT+8", "yyyy/MM/dd");
          var dayToSet = parseInt(date.split('-')[1]);
          var distance = (dayToSet + 7 - currentDayOfWeek) % 7;
          outputDate = new Date([currentDate, time, this.timezone].join(" "));
          outputDate.setDate(outputDate.getDate() + distance);
          if (outputDate.getTime() - new Date().getTime() < 0){
            outputDate.setDate(outputDate.getDate() + 7);
          }
        }else if(date.split('-')[0] == 'month'){
          // check if the day of the month has already passed
          var currentDate = Utilities.formatDate(new Date(), "GMT+8", "yyyy/MM/dd");
          outputDate = new Date([currentDate, time, this.timezone].join(" "));
          outputDate.setDate(parseInt(date.split('-')[1]));
          if (outputDate.getTime() - new Date().getTime() < 0){
            outputDate.setMonth(outputDate.getMonth() + 1);
          }
        }
      }
    }
    
    return [outputDate, reminderText, frequency];
  }
}