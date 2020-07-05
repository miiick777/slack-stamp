function Ranking() {
  var range = sheet.getRange(1, 1, sheet.getLastRow(), 2);
  var s_cnt = range.getValues();

  var tmp = 0;
  var tmp_n = "";

  for (var j=1; j<s_cnt.length; j++) {
    for (var k=j+1; k<s_cnt.length; k++) {
      if(s_cnt[j][1] < s_cnt[k][1]){
         tmp =  s_cnt[j][1];
        s_cnt[j][1] = s_cnt[k][1];
        s_cnt[k][1] = tmp;
         tmp_n =  s_cnt[j][0];
        s_cnt[j][0] = s_cnt[k][0];
        s_cnt[k][0] = tmp_n;
      }
    }
  }
  sheet.getRange(1,1,s_cnt.length,2).setValues(s_cnt);
  var snt = "年月:" + targetmonth
  for (var j=1; j<s_cnt.length; j++) {
    var snt = snt + "\n"+j+"位: :"+s_cnt[j][0] + ": " +s_cnt[j][1] + "回 \n"
  }
  Logger.log(snt);
  slack(snt,s_cnt[1][0]);
};

function slack(message,name) {
    var url        = 'https://slack.com/api/chat.postMessage';
    var token      = BOT_TOKEN;
    var channel    = '結果を出力するチャンネル名';
    var text       = message;
    var username   = 'GetStamp';
    var icon_emoji = ':'+name+':';

    var parse      = 'full';
    var method     = 'post';

    var payload = {
        'token'      : token,
        'channel'    : channel,
        'text'       : text,
        'username'   : username,
        'parse'      : parse,
        'icon_emoji' : icon_emoji,
        'link_names' : true
    };

    var params = {
        'method' : method,
        'payload' : payload
    };
    var response = UrlFetchApp.fetch(url, params);
};
