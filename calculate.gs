var API_TOKEN = "OAuth Access Tokenを記載";
var BOT_TOKEN = "Bot User OAuth Access Tokenを記載";
// ページネーション
var MAX_HISTORY_PAGINATION = 10;
var HISTORY_COUNT_PER_PAGE = 1000;
var stamps = {};
var counts = [];
var names = [];
var sheet = SpreadsheetApp.getActiveSheet();
// 時間の判定
var timezone = sheet.getParent().getSpreadsheetTimeZone();
var now = new Date;

// ボタン表示
var meetingDate = Browser.inputBox("ランキングを出力したい期間(yyyy-MM)を入力してください。", Browser.Buttons.OK_CANCEL);

if(meetingDate == "cancel"){
  Browser.msgBox("スクリプトを終了します。");
} else {
  var targetmonth = Utilities.formatDate(new Date(meetingDate), timezone, 'yyyy-MM');
  Browser.msgBox( targetmonth + "の期間のランキングを出力します。");
}


function StoreLogsDelta() {
  var logger = new SlackChannelHistoryLogger();
  logger.run();
  //シートを削除
  sheet.clear();
  sheet.getRange(1,1).setValue(targetmonth);

  var names = Object.keys(stamps);
  var ary = [];
  for (var i=0; i<names.length; i++) {
    ary.push([names[i]]);
  }
  sheet.getRange(2,1,ary.length,1).setValues(ary);
  for (var i=0; i<names.length; i++) {
    counts.push([stamps[names[i]]]); 
  }
  sheet.getRange(2,2,counts.length,1).setValues(counts);
  //降順でソート
  sheet.getRange(2,2,counts.length,2).sort({column: 2, ascending: false});
};

var SlackChannelHistoryLogger = (function () {
    function SlackChannelHistoryLogger() {
        this.memberNames = {};
    }
    SlackChannelHistoryLogger.prototype.requestSlackAPI = function (path, params) {
        if (params === void 0) { params = {}; }
        var url = "https://slack.com/api/" + path + "?";
        var qparams = [("token=" + encodeURIComponent(API_TOKEN))];
        for (var k in params) {
            qparams.push(encodeURIComponent(k) + "=" + encodeURIComponent(params[k]));
        }
        url += qparams.join('&');
        try{
          var resp = UrlFetchApp.fetch(url);
          var data = JSON.parse(resp.getContentText());
          if (data.error) {
            throw "GET " + path + ": " + data.error;
          }
          return data;
         }catch(e){
          return "err";
          }
    };
    SlackChannelHistoryLogger.prototype.run = function () {
        var _this = this;
        var channelsResp = this.requestSlackAPI('conversations.list');
            for (var _i = 0, _a = channelsResp.channels; _i < _a.length; _i++) {
              var ch = _a[_i];
              this.importChannelHistoryDelta(ch);
            }

    };  
    SlackChannelHistoryLogger.prototype.importChannelHistoryDelta = function (ch) {
        var _this = this;
        var now = new Date();
        var oldest = '1'; // oldest=0 does not work
        var messages = this.loadMessagesBulk(ch, { oldest: oldest });
        var dateStringToMessages = {};


      if(messages != "err"){
        messages.forEach(function (msg) {
          var date = new Date(+msg.ts * 1000);
          var rec = msg.reactions ? msg.reactions : "";
          var m_date = Utilities.formatDate(date, timezone, 'yyyy-MM');
              if(rec !== "" && m_date == targetmonth){
                var name = rec[0].name;
          Logger.log(m_date);
                var tmp = 0;
                if (stamps[name]) {
                  tmp = stamps[name];
                  stamps[name] = tmp + rec[0].count;
                } else {
                  stamps[name] = rec[0].count;
                }      
              }
        });
      }

    };
    SlackChannelHistoryLogger.prototype.loadMessagesBulk = function (ch, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var messages = [];
        options['count'] = HISTORY_COUNT_PER_PAGE;
        options['channel'] = ch.id;
        var loadSince = function (oldest) {
            if (oldest) {
                options['oldest'] = oldest;
            }
            var resp = _this.requestSlackAPI('conversations.history', options);
          if(resp != "err"){
            messages = resp.messages.concat(messages);
          }
            return resp;
        };
        var resp = loadSince();
        var page = 1;
        while (resp.has_more && page <= MAX_HISTORY_PAGINATION) {
            resp = loadSince(resp.messages[0].ts);
            page++;
        }
        return messages.reverse();
    };
    return SlackChannelHistoryLogger;
})();
