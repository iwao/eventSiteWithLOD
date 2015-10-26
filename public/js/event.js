/*

//ヨコハマ・アート・LODを使ってイベント情報サイトを作ってみよう
//Code for YOKOHAMA ハンズオン
//Iwao KOBAYASHI
//2015年11月5日

*/

//SPARQLエンドポイント設定
var endpoint = "http://localhost:4567/sparql";

//イベントデータを展開
var eventTable = function(data){
  $.each(data.results.bindings, function(i, val) {
    var startDate = new Date(val.start.value).toLocaleDateString();
    var endDate = new Date(val.end.value).toLocaleDateString();
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
      "<p><a class='btn btn-default' href=" + val.s.value + " role='button'>View details »</a></p>" +
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

//ドロップダウンで月を指定
$("select[name=month]").change(function(){
  //alert($("select[name=month]").val());
  var month = $("select[name=month]").val();
  //イベント再表示
  //表示をリセット
  $(".eventItem").remove();
  getEvents(month);
});

//イベントデータ取得
var getEvents = function(month){

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
    "FILTER ((?end > '2015-" + month + "-01T00:00:00'^^xsd:dateTime) and (?end < '2015-" + month + "-07T00:00:00'^^xsd:dateTime))",
    "FILTER (lang(?location) ='ja' )",
    "}",
    "ORDER by ASC(?end)",
    "OFFSET 0",
    "LIMIT 100"
  ].join("");

  //サブタイトル書き換え
  $("#subTitle").html("<h2>" + month + "月のイベント</h2>");

  //GETリクエスト
  $.get(endpoint,
  {
    query: query,
    format: "json",
  },
  function(data){
    data = JSON.parse(data);//本番では不要かも
    console.log(data);
    eventTable(data);
  });
};

getEvents(11);
