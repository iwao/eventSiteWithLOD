# ヨコハマ・アート・LODを使ったウェブサイト構築チュートリアル

##  Open Data Hands-On

### 進め方
1. 環境構築
2. ヨコハマ・アート・LODとは？
3. LODとは？
4. SPARQLとは？
5. ヨコハマ・アート・LODのデータを取得してみよう（ブラウザから）
6. javascriptを使ってイベントデータを取得
7. 必要な属性を取り出してみよう
8. ドロップダウンを設置して月を切り替えできるようにしてみる
9. 見た目を調整してみよう（文字数制限したり、画像サイズ調整したり、センタリングしたり）

### 環境の準備
* javascriptが動作すれば大丈夫です。（ブラウザは最新のものを用意してください）
* ローカル環境で動作するhttpサーバー（Macの場合は、MMAPをインストールするとか、最初から入っているApatchを起動するとか）
* このリポジトリからローカル環境へファイルをダウンロード
* `index.html`内の`./CSS/style.css`および、`./js/event.js`それぞれのパスを確認して、必要に応じて変更します。
* `index.html`を開いてエラーが出ないことを確認

### ヨコハマ・アート・LODとは？
公益財団法人横浜市芸術文化振興財団が扱う横浜市の芸術文化情報のオープンデータ（Linked Open Data）化を進めているプロジェクトです。  
詳しくは[ヨコハマ・アート・LOD](http://yan.yafjp.org/lod)をご覧下さい。

### LOD(Linked Open Data)とは？
オープンデータをウェブに公開し、データとデータを相互にリンクすることで、データのウェブを構築していこうとするムーブメントです。
ウェブの標準技術である、RDF（データモデル）、URI（識別子）、http（プロトコル）で実装します。  
詳しくは[LODI/Linked Open Data連続講義](http://linkedopendata.jp/?cat=17)をご覧下さい。

### SPARQLとは？
RDF専用のクエリ言語です。SQLに似た構文で記述します。グラフデータベースと呼ばれるタイプのデータベースシステムでRDFやSPARQLを扱えるものがあります。  
外部からもクエリを受け付けられるように公開されたAPIをSPARQLエンドポイントと呼びます。

#### SPARQLを書いてみよう
代表的なSPARQLエンドポイントである、DBpediaに問い合わせしてみよう。  
> DBpediaのエンドポイント  
> [http://ja.dbpedia.org/sparql](http://ja.dbpedia.org/sparql)  
>ウェブサイトではクエリ例なども公開しています。
[http://ja.dbpedia.org](http://ja.dbpedia.org)

クエリ例：基本形

    select distinct * where {
      ?s ?p ?o .
    }LIMIT 100

SPARQLの仕様はW3Cのドキュメントを読むと良いです。  
[SPARQL 1.1クエリ言語　W3C勧告 2013年3月21日（日本語訳）](http://www.asahi-net.or.jp/~ax2s-kmtn/internet/rdf/REC-sparql11-query-20130321.html)

### ヨコハマ・アート・LODのデータを取得してみよう

> ヨコハマ・アート・LOD仕様  
> [http://data.yafjp.org/reference.html](http://data.yafjp.org/reference.html)  
> ヨコハマ・アート・LODのSPARQLエンドポイント
> [http://data.yafjp.org/sparql](http://data.yafjp.org/sparql)

データを取得するには、エンドポイントに対してSPARQLクエリをパラメーターとしてGETリクエストします。

    $ curl -H 'Accept: text/turtle'  http://data.yafjp.org/sparql?query=select%20distinct%20%2a%20where%20%7b%0d%0a%3fs%20%3fp%20%3fo%20%2e%0d%0a%7d%20LIMIT%20100

Acceptの値でXMLやJSONも指定できます。

クエリ例：  イベントデータを100件取得

    PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-s
    PREFIX yav: <http://yafjp.org/terms/yav/1.0#>
    SELECT DISTINCT * WHERE {  
      ?s a yav:Event .
      ?s rdfs:label ?label
      FILTER (lang(?label) ="ja" )
    }
    LIMIT 100

クエリ例：日付を指定してイベントデータを取得

    PREFIX yav: <http://yafjp.org/terms/yav/1.0#>  
    PREFIX cal: <http://www.w3.org/2002/12/cal/icaltzd#>  
    PREFIX schema: <http://schema.org/>  

    SELECT distinct *   
    where {  
      ?s a yav:Event ;  
      rdfs:label ?label ;  
      schema:location [ rdfs:label ?location ] ;  
      schema:image ?image ;  
      schema:description ?description ;  
      cal:dtstart ?start ;  
      cal:dtend ?end .  
      FILTER ((?end > '2015-11-01T00:00:00'^^xsd:dateTime) and (?end < '2015-11-07T00:00:00'^^xsd:dateTime))  
      FILTER (lang(?location) ='ja' )  
    }  
    ORDER by ASC(?end)  
    OFFSET 0  
    LIMIT 100

### javascriptからSPARQLを投げてイベントデータを取得する

さて、ここからアプリケーションの作成に入ります。  
javascriptからSPARQLを投げてデータを取得します。
ここでは、jQueryを使っています。

> event.js

SPARQLエンドポイントのパスを指定

    //SPARQLエンドポイント設定
    var endpoint = "http://localhost:4567/sparql";

イベントデータを取得する関数`getEvents()`を作成

    //イベントデータ取得  
    var getEvents = function(){  

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
        "FILTER ((?end > '2015-11-01T00:00:00'^^xsd:dateTime) and (?end < '2015-"11-07T00:00:00'^^xsd:dateTime))",  
        "FILTER (lang(?location) ='ja' )",  
      "}",  
      "ORDER by ASC(?end)",  
      "OFFSET 0",  
      "LIMIT 100"  
     ].join("");  

     //GETリクエスト  
     $.get(endpoint,  
     {  
       query: query,  
       format: "json",  
     },  
     function(data){  
       console.log(data);  
     });  
    };  

`getEvents()`を呼び出せば、イベントデータを取得できます。

    getEvents();  

ブラウザのデバッガーを使うなりして、どんな値が取得できたか確認してみましょう。以下に取得できたデータの一部を示します。

    {  
      "head": {  
        "link": [],  
        "vars": [  
          "s",  
          "label",  
          "address",  
          "description",  
          "start",  
          "end"  
        ]  
      },  
      "results": {  
        "distinct": false,  
        "ordered": true,  
        "bindings": [  
          {  
            "s": {  
              "type": "uri",  
              "value": "http://ycag.yafjp.org/event/29954"  
            },  
            "label": {  
              "type": "literal",  
              "xml:lang": "ja",  
              "value": "安藤華舟 個展"  
            },  
            "address": {  
              "type": "literal",  
              "xml:lang": "ja",  
              "value": "横浜市中区吉田町5-1"  
            },  
            "description": {  
              "type": "literal",  
              "xml:lang": "ja",  
              "value": "水墨・墨彩画　約30点"  
            },  
            "start": {  
              "type": "typed-literal",  
              "datatype": "http://www.w3.org/2001/XMLSchema#dateTime",  
              "value": "2015-10-27T00:00:00Z"  
            },  
            "end": {  
              "type": "typed-literal",  
              "datatype": "http://www.w3.org/2001/XMLSchema#dateTime",  
              "value": "2015-11-01T00:00:00Z"  
            }  
                },  
                {  
            "s": {  
              "type": "uri",  
              "value": "http://ycag.yafjp.org/event/29964"  
            },  
            "label": {  
              "type": "literal",  
              "xml:lang": "ja",  
              "value": "ル ヴァン展"  
            },  
            "address": {  
              "type": "literal",  
              "xml:lang": "ja",  
              "value": "横浜市中区吉田町4-1"  
            },  
            "description": {  
              "type": "literal",  
              "xml:lang": "ja",  
              "value": "油彩・水彩・アクリル・鉛筆画等　講師：香取玲子"  
            },  
            "start": {  
              "type": "typed-literal",  
              "datatype": "http://www.w3.org/2001/XMLSchema#dateTime",  
              "value": "2015-10-26T00:00:00Z"  
            },  
            "end": {  
              "type": "typed-literal",  
              "datatype": "http://www.w3.org/2001/XMLSchema#dateTime",  
              "value": "2015-11-01T00:00:00Z"  
            }  
          }  
        ]  
      }  
    }  

### 必要な属性を取り出す

jsonからデータを取り出します。  
イベントデータはここに入っています。  

    data.results.bindings

取得したイベントデータを展開するために新たに関数`eventTable()`を作成します。
ひとまず、イベントタイトルのみ取得して表示してみます。  
`index.html`内の`<div id="eventTable></div>`の部分に展開します。

> event.js

    //イベントデータを展開
    var eventTable = function(data){
      $.each(data.results.bindings, function(i, val) {
        $("#eventTable").append(
          "<p>" + val.label.value + "</p>
        );
      });
    };

GETリクエストの部分から呼び出すように追記します。

    //GETリクエスト  
    $.get(endpoint,  
    {  
      query: query,  
      format: "json",  
    },  
    function(data){  
      console.log(data);  
      eventTable(data);  
    });  

その他の属性も取得して、HTMLタグとともに書き出すように変更します。

    //イベントデータを展開
    var eventTable = function(data){
      $.each(data.results.bindings, function(i, val) {
        $("#eventTable").append(
          "<img class='thumbnail' src='" + val.image.value + "' height='200px' />" +
          "<h3>" + val.label.value  + "</h3>" +
          "<div class='description'>" +
          "<p>" + val.description.value + "</p>" +
          "</div>" +
          "<dl>" +
          "<dt>開始日時</dt><dd>" + val.start.value + "</dd>" +
          "<dt>終了日時</dt><dd>" + val.end.value + "</dd>" +
          "<dt>開催場所</dt><dd>" + val.location.value + "</dd>" +
          "</dl>"
        );
      });
    };

ここまで理解できれば、SPARQLから自由にデータを取得できるようになります。

### ドロップダウンで表示月を切り替えられるようにする

> event.js

`getEvents()`内のSPARQLクエリで月を表す部分を変数に置き換え、指定できるように変更します。

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

> index.html

`index.html`内の適当な場所にドロップダウンを設置

    <div id="operationBar" class="container">
      <form id="queryForm">
        表示対象を指定：
        <select name="month">
          <option value="12">12月</option>
          <option value="11" selected="1">11月</option>
          <option value="10">10月</option>
        </select>
      </form>
    </div>

ドロップダウンのchangeイベントで値を取得して、`getEvents()`に渡す。

    //ドロップダウンで月を指定
    $("select[name=month]").change(function(){
      var month = $("select[name=month]").val();
      //イベント再表示
      getEvents(month);
    });

一度表示をリセットするように変更。

    //ドロップダウンで月を指定
    $("select[name=month]").change(function(){
      month = $("select[name=month]").val();
      //イベント再表示
      //表示をリセット
      $(".eventItem").remove();
      getEvents(month);
    });

### 見た目を調整しよう

表示月の切り替えでサブタイトルが連動するように

> index.html

サブタイトルを追加。

    <div id="subTitle" class="container">
      <h2>11月のイベント</h2>
    </div>

> event.js

関数getEvents内に次の一文を追記

    //サブタイトル書き換え
    $("#subTitle").html("<h2>" + month + "月のイベント</h2>");

イベント表示をブロック表示にしつつ少し装飾。  
bootstrapのスタイルを利用。

    //イベントデータを展開
    var eventTable = function(data){
      $.each(data.results.bindings, function(i, val) {
        $("#eventTable").append(
          "<div class='col-md-4 eventItem'>" +
          "<img class='thumbnail' src='" + val.image.value + "' height='200px' />" +
          "<h3>" + val.label.value + "</h3>" +
          "<div class='description'>" +
          "<p>" + val.description.value + "</p>" +
          "</div>" +
          "<dl>" +
          "<dt><span class='label label-success'>開始日時</span></dt><dd>" + val.start.value + "</dd>" +
          "<dt><span class='label label-success'>終了日時</span></dt><dd>" + val.end.value + "</dd>" +
          "<dt><span class='label label-primary'>開催場所</span></dt><dd>" + val.location.value + "</dd>" +
          "</dl>" +
          "<p><a class='btn btn-default' href=" + val.s.value + " role='button'>View details »</a></p>" +
          "</div>"
        );
      });
    };

#### 日付のフォーマットを変更

ヨコハマ・アート・LODでは日付データはISO準拠フォーマットで記述されています。  
`例：2015-11-05T00:00:00`これを、`2015年11月5日`のように変更してみます。

> event.js

`eventTable()`内に次の記述を追記します。

    var startDate = new Date(val.start.value).toLocaleDateString();
    var endDate = new Date(val.end.value).toLocaleDateString();

HTMLを合成している部分にはこちらを追記。

    "<dt><span class='label label-success'>開始日時</span></dt><dd>" + startDate + "</dd>" +
    "<dt><span class='label label-success'>終了日時</span></dt><dd>" + endDate + "</dd>" +

#### 文字数を制限

現状、各イベント情報がブロック表示されて並ぶようになっていると思いますが、イベントのタイトルや紹介文が長く、統一感のない表示になっていると思います。  
そこで、表示する最大文字数を制限してみます。

> event.js

`cutDown()`関数を追加します。  
`limitNum`で指定した文字数を超えている場合、`followChar`「...」を加えて新たな文字列を合成した結果を戻します。

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

同じく、`eventTable()`内のHTMLを合成している部分に次を追加  
イベントタイトルは25文字、紹介文は150文字でそれぞれ制限しています。

    "<h3>" + cutDown(val.label.value, 25) + "</h3>" +
    "<div class='description'>" +
    "<p>" + cutDown(val.description.value, 150) + "</p>" +
    "</div>" +

### この後の拡張

今回のチュートリアルはこれで終了ですが、興味を持っていただいた方は、ぜひ、引き続き応用していろいろと作ってみて下さい。  
以下のような応用なら比較的簡単にできるのではないでしょうか。
* イベント個別ページを独自で作成する（SPARQL使わずに作ることができます。詳しくはまたの機会に。。）
* 詳細な検索を可能にする
* イベントマップを作成する
