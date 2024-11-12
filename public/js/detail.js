'use strict';

// GoogleBooksAPIをISBN番号で呼び出し
const baseUrl = 'https://www.googleapis.com/books/v1/volumes?q=isbn:';
let isbn;
const lsKey = "cartList";   // カート情報のlocalstrage
const loading = document.querySelector("#loading");

// Google Embedded Viewer API 呼び出し前の初期設定
google.books.load();
google.books.setOnLoadCallback(initialize);

// PayPayボタン押下時
$("#paypay").on('click', () => {
    const price = $("#price").text();
    // console.log(price);
    // location.href = `/paypayqr?price=${price}`;
    // 決済機能はPOST推奨なのでPOSTメソッドに変更。
    fetch("/paypay", {
        method: "POST",
        headers:  {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            price: price
        })
    })
    .then(response => response.json())
    .then(data => {
        // console.log(data);
        location.href = data.url;
    })
    .error(error => console.error('PayPay決済処理でエラー発生しました。', error));
});

// クレカ決済ボタン押下時
$("#creditcard").on("click", () => {
    const price = $("#price").text();
    // console.log(price);
    fetch("/creditcard", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title: "MIRRORMAN BOOKSTORE",
            price: price
        })
    })
    .then(response => response.json())
    .then(data => {
        location.href = data.url;
    })
    .catch((error) => {
        console.error('クレカ決済のPOST送信でエラー発生しました。', error);
    });
});

// カート追加ボタン押下時
$("#cart").on("click", () => {
    // console.log("カート追加クリック！");
    let cartInfoList = [];
    const priceStr = $("#price").text();
    // 金額をサイト表示のフォーマットから数値型に変換（正規表現で,と円を削除して数値化）
    const price = parseInt(priceStr.replace(/[,円]/g, ""), 10);
    // LocalStorageへのデータをオブジェクト型で保存
    const cartInfo = {
        image: $("#bookimg").attr("src"),
        title: $("#title").text(),
        price: price
    };
    if (localStorage.getItem(lsKey) !== null) {
        cartInfoList = JSON.parse(localStorage.getItem(lsKey));
    }
    cartInfoList.push(cartInfo);
    localStorage.setItem(lsKey, JSON.stringify(cartInfoList));
    location.href = `/cart`;
});

function initialize(){
    // console.log('aaaaa');
    // URLSearchParamsでクエリパラメータ以降の文字列を取得して、getでisbnの値を取得
    const urlQuery = new URLSearchParams(location.search);
    isbn = urlQuery.get('isbn');
    const url = baseUrl + isbn;
    // console.log(url);
    getBookdata(url);   // GoogleBooksAPI呼出（ISBN番号指定）

};

function getBookdata(url) {
    $.ajax({
        url: url,
        type: "get",
        cache: false,
        dataType: "json"
    }).done(function(data){
        if(data.totalItems == 0) {
            alert('ISBN番号で検索したらヒットしませんでした。');
            return;
        }
        console.log(data);
        $("#bookimg").attr('src', data.items[0].volumeInfo?.imageLinks.thumbnail);
        $("#title").html(data.items[0].volumeInfo.title);
        $("#publisher").html(data.items[0].volumeInfo.publisher);
        const date = data.items[0].volumeInfo.publishedDate;
        $("#author").html(data.items[0].volumeInfo.authors[0]);
        $("#date").html(date.replace(/-/g, '/'));
        $("#page").html(data.items[0].volumeInfo.pageCount + 'ページ');
        if(!data.items[0].saleInfo.retailPrice?.amount  && !data.items[0].saleInfo.listPrice?.amount) {
            $("#price").html('NOT FOR SALE');
        } else if(!data.items[0].saleInfo.retailPrice?.amount  && data.items[0].saleInfo.listPrice?.amount) {
            const price = data.items[0].saleInfo.listPrice.amount;
            $("#price").html(price.toLocaleString() + '円');
        } else if(data.items[0].saleInfo.retailPrice?.amount) {
            const price = data.items[0].saleInfo.retailPrice.amount;
            $("#price").html(price.toLocaleString() + '円');
        }
        $("#description").html(data.items[0].volumeInfo.description);
        loadBookViewer(isbn);
        loading.classList.add("loaded");
    });
};

// Google Embedded Viewer API 呼出
function loadBookViewer(isbn){
    const viewer = new google.books.DefaultViewer(document.getElementById('viewer'));
    viewer.load('ISBN:' + isbn);
};
