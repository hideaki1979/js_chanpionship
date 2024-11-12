'use strict';

const baseUrl = 'https://www.googleapis.com/books/v1/volumes?q=isbn:';
let isbn;
const lsKey = "cartList";   // カート情報のlocalstrage

google.books.load();
google.books.setOnLoadCallback(initialize);

$("#paypay").on('click', () => {
    const price = $("#price").text();
    // console.log(price);
    location.href = `/paypayqr?price=${price}`;
});

$("#creditcard").on("click", () => {
    const price = $("#price").text();
    console.log(price);
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

$("#cart").on("click", () => {
    console.log("カート追加クリック！");
    let cartInfoList = [];
    const priceStr = $("#price").text();
    const price = parseInt(priceStr.replace(/[,円]/g, ""), 10);
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
    const urlQuery = new URLSearchParams(location.search);
    isbn = urlQuery.get('isbn');
    const url = baseUrl + isbn;
    console.log(url);
    getBookdata(url);
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
    });
};

function loadBookViewer(isbn){
    const viewer = new google.books.DefaultViewer(document.getElementById('viewer'));
    viewer.load('ISBN:' + isbn);
};
