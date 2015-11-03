/*

//ヨコハマ・アート・LODを使ってイベント情報サイトを作ってみよう
//Code for YOKOHAMA ハンズオン
//Iwao KOBAYASHI
//2015年11月5日

*/

//SPARQLエンドポイント設定
//var endpoint = "http://localhost:4567/sparql";
var endpoint = "http://data.yafjp.org/sparql";


//イベントデータを展開（一覧画面用）
var eventTable = function(data){
  $.each(data.results.bindings, function(i, val) {
    var startDate = new Date(val.start.value).toLocaleDateString();//日付フォーマット変更
    var endDate = new Date(val.end.value).toLocaleDateString();//日付フォーマット変更
    var eventID = val.s.value.split("_")[1];//イベントID取得
    $("#eventTable").append(
      "<div class='col-md-4 eventItem'>" +
      "<img class='thumbnail' src='" + val.image.value + "' height='200px' />" +
      "<h3>" + cutDown(val.label.value, 25) + "</h3>" +
      "<div class='description'>" +
      "<p>" + cutDown(val.description.value, 150) + "</p>" +
      "</div>" +
      "<dl>" +
      "<dt><span class='label label-success'>開始日時</span></dt><dd>" + startDate + "</dd>" +
      "<dt><span class='label label-success'>終了日時</span></dt><dd>" + endDate + "</dd>" +
      "<dt><span class='label label-primary'>開催場所</span></dt><dd>" + val.location.value + "</dd>" +
      "</dl>" +
      "<p><a class='btn btn-default' href=detail.html?id=" + eventID + " role='button'>View details »</a></p>" +
      "</div>"
    );
  });
};

//イベント紹介文字数制限
var cutDown = function(description,limitNum){
  var followChar = ' …';
  var description = description.toString();
  var textLength = description.length;

  if( limitNum < textLength ){
    return description.substr(0,(limitNum)) + followChar;
  }else{
    return description;
  }
};

//年月選択ドロップダウン作成
var makeDropdown = function(){
  //今日の年月を取得
  var thisYear = new Date().getFullYear();
  var thisMonth = new Date().getMonth() + 1;

  //次月と前月を確定
  if(thisMonth == 12){
    var previousYM = [thisYear, 11];
    var nextYM = [thisYear + 1, 1];
  }else if(thisMonth == 1){
    var previousYM = [thisYear - 1, 12];
    var nextYM = [thisYear, 2];
  }else {
    var previousYM = [thisYear, thisMonth - 1];
    var nextYM = [thisYear, thisMonth + 1];
  }

  //フォームを作成
  $("#queryForm").append(
    "表示対象を指定：" +
    "<select name='month'>" +
      "<option value='" + nextYM.join('/') + "'>" + nextYM[1] + "月</option>" +
      "<option value='" + thisYear + '/' + thisMonth + "' selected='1'>" + thisMonth + "月</option>" +
      "<option value='" + previousYM.join('/') + "'>" + previousYM[1] + "月</option>" +
    "</select>"
  );

  //イベントを作成（ドロップダウンで年月を指定）
  $("select[name=month]").change(function(){
    var month = $("select[name=month]").val();
    //イベント再表示
    //表示をリセット
    $(".eventItem").remove();
    getEvents(month);
  });
};

//イベント一覧データ取得
var getEvents = function(month){

  //指定の年月から最終日を取得
  if (month){
    var ym = month.split("/");
    var thisYear = ym[0];
    var thisMonth = ym[1];
  }else{
    var thisYear = new Date().getFullYear();
    var thisMonth = new Date().getMonth() + 1;
  };

  var lastDay = new Date(thisYear, thisMonth, 0).getDate();

  //SPARQLクエリ
  var query = [
    "PREFIX yav: <http://yafjp.org/terms/yav/1.0#>",
    "PREFIX cal: <http://www.w3.org/2002/12/cal/icaltzd#>",
    "PREFIX schema: <http://schema.org/>",

    "SELECT distinct * ",
    "where {",
    "?s a yav:Event ;",
    "rdfs:label ?label ;",
    "schema:location [ rdfs:label ?location ] ;",
    "schema:image ?image ;",
    "schema:description ?description ;",
    "cal:dtstart ?start ;",
    "cal:dtend ?end .",
    "FILTER ((?end > '" + thisYear + "-" + thisMonth + "-01T00:00:00'^^xsd:dateTime) and (?end < '" + thisYear + "-" + thisMonth + "-" + lastDay + "T00:00:00'^^xsd:dateTime))",
    "FILTER (lang(?location) ='ja' )",
    "FILTER (regex(xsd:string(?s), 'http://yan.yafjp.org/'))",
    "}",
    "ORDER by ASC(?end)",
    "OFFSET 0",
    "LIMIT 500"
  ].join("");

  //サブタイトル書き換え
  $("#subTitle").html("<h2>" + thisMonth + "月のイベント</h2>");

  //GETリクエスト（一覧データを取得）
  $.get(endpoint,
  {
    query: query,
    format: "json",
  },
  function(data){
    //data = JSON.parse(data);//本番では不要かも
    //console.log(data);
    eventTable(data);
  });
};

//詳細データ取得
var getDetail = function(){
  var eventID = location.href.split('?id=')[1];
  var uri = "http://yan.yafjp.org/event/event_" + eventID ;
  //GETリクエスト
  $.get(uri + '.json',
  function(data){
    //data = JSON.parse(data);//本番では不要かも
    detailView(data);
  });
}

//属性があるかないか調べたうえで出力
var checkValue = function(hash, property) {
  //console.log(hash);
  if(property in hash){
    return hash[property][0].value;
  }else{
    return "";
  };
};

//イベントデータを展開（詳細画面用）
var detailView = function(data){
  var eventID = location.href.split('?id=')[1];
  var uri = "http://yan.yafjp.org/event/event_" + eventID ;
  //console.log(uri);
  //console.log(data[uri]);

  var startDate = new Date(data[uri]['http://www.w3.org/2002/12/cal/icaltzd#dtstart'][0].value).toLocaleDateString();
  var endDate = new Date(data[uri]['http://www.w3.org/2002/12/cal/icaltzd#dtend'][0].value).toLocaleDateString();

  if(startDate == endDate) {
    date = startDate;
  }else{
    date = startDate + "〜" + endDate;
  };

  $("#eventTable").append(
    "<h2 class='blog-post-title'>" + data[uri]['http://www.w3.org/2000/01/rdf-schema#label'][0].value + "</h2>" +
    "<p>" + data[uri]['http://schema.org/description'][0].value + "</p>" +
    "<dl>" +
    "<dt>日時</dt><dd>" + date + "<br>" + checkValue(data[uri],'http://purl.org/jrrk#scheduleNote') + "</dd>" +
    "</dl>" +
    "<dl>" +
    "<dt>会場</dt><dd><a href='" + data[uri]['http://schema.org/location'][0].value + "'>" + data[uri]['http://purl.org/jrrk#location'][0].value + "</a></dd>" +
    "</dl>" +
    "<dl>" +
    "<dt>料金</dt><dd>" + checkValue(data[uri],'http://schema.org/price') + "</dd>" +
    "</dl>" +
    "<dl>" +
    "<dt>ウェブサイト</dt><dd><a href='" + checkValue(data[uri],'http://schema.org/url') + "'>" + checkValue(data[uri],'http://schema.org/url') + "</a></dd>" +
    "</dl>" +
    "<dl>" +
    "<dt>問い合わせ先</dt><dd>" + data[data[uri]['http://schema.org/contactPoint'][0].value]['http://www.w3.org/2000/01/rdf-schema#label'][0].value + "<br>" +
    "（住所：" + checkValue(data[data[uri]['http://schema.org/contactPoint'][0].value],'http://purl.org/jrrk#address') + " / " +
    "電話：" + checkValue(data[data[uri]['http://schema.org/contactPoint'][0].value],'http://schema.org/telephone') + "）</dd>"
);
  $("#eventImage").append("<img src =" + data[uri]['http://schema.org/image'][0].value + " />");
  document.title = data[uri]['http://www.w3.org/2000/01/rdf-schema#label'][0].value + " | YOKOHAMA art LOD" ;

};
