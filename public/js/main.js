'use strict';

import { googleApiKey } from "./config.js";

// Google Books APIのベースURL
const baseUrl = 'https://www.googleapis.com/books/v1/volumes?';
let html = "";

// 検索ボタン押下（書籍一覧出力）javascriptkime
$("#searchbtn").on("click", async () => {
    if(!$("#bookname").val()) {
        alert('書籍名を入力してください');
        return;
    }
        let url = `${baseUrl}q=${$("#bookname").val()}`;
    // urlのクエリパラメータ設定処理
    url = setUrl(url);
    console.log(url);
    try {
        await getData(url); // AjaxでAPI呼び出し
        dispPage(1);    // ページング表示
    } catch(error) {
        console.error('Error：' + error);
    }
});

// ページ番号ボタン押下時
$('#pagenation').on('click', 'a', async function() {
    if($(this).text() === '<' || $(this).text() === '>'){return;}
    // console.log('aaa');
    // console.log($(this).text());
    const startIndex = Math.floor((($(this).text() - 1) * 10));
    // console.log(startIndex);
    let url = `${baseUrl}q=${$("#bookname").val()}&startIndex=${startIndex}`;
    url += `&key=${googleApiKey}`;
    // url = setUrl(url);
    console.log(url);
    const targetPage = parseInt($(this).text());
    console.log(targetPage);
    try {
        await getData(url);
        dispPage(targetPage);
    } catch(error) {
        console.error('Error：' + error);
    }
});

// 前ページボタン押下時
$('#pagenation').on('click', '.prev', async function(){
    const targetPage = parseInt($(".current").text()) - 1;
    // console.log(targetPage);
    if(targetPage == '0'){
        return;
    }
    const startIndex = Math.floor(((targetPage - 1) * 10));
    let url = `${baseUrl}q=${$("#bookname").val()}&startIndex=${startIndex}`;
    url = setUrl(url);
    try {
        await getData(url);
        dispPage(targetPage);
    } catch(error) {
        console.error('Error：' + error);
    }
});

// 次ページボタン押下時
$('#pagenation').on('click', '.next', async function(){
    // console.log('ccc');
    const targetPage = parseInt($(".current").text()) + 1;
    const startIndex = Math.floor(((targetPage - 1) * 10));
    let url = `${baseUrl}q=${$("#bookname").val()}&startIndex=${startIndex}`;
    url = setUrl(url);
    
    console.log(url);
    try {
        await getData(url);
        dispPage(targetPage);
    } catch(error) {
        console.error('Error：' + error);
    }
});

$("#booklist").on("click", "tr", function() {
    const isbn = $(this).find('td.bookdata').data('value');
    console.log(isbn);
    if(!isbn){alert('ISBN番号が存在しないため詳細画面に遷移できません。');return;}
    location.href = `/detail?isbn=${isbn}`;
})

// GoogleBooksAPIのクエリパラメータ設定処理
function setUrl(url){
    ($("#langcheck").prop("checked")) && (url += `&langRestrict=ja`);
    ($("#orderbycheck").prop("checked")) && (url += `&orderBy=newest`);
    // console.log($("#printselect").val());
    switch ($("#printselect").val()) {
        case "books":
            url += `&printType=books`;
            break;
        case "magazines":
            url += `&printType=magazines`;
            break;
    }
    url = url + `&key=${googleApiKey}`;
    return url;
};

// GoogleBooksAPI呼出、一覧のHTML編集表示
function getData(url) {
    return new Promise((resolve, reject) =>{
        $.ajax({
            url: url,
            type: "get",
            cache: false,
            dataType: "json"
        }).done(function(data){
            console.log(data);
            if(data.totalItems === 0) {
                // console.log('検索結果0件！');
                $("#totalcnt").html(data.totalItems);
                html = `<h1 class="nodataerr">検索対象のデータがありません！</h1>`;
                $("#booklist").empty().hide().append(html).fadeIn(200);
                $("#pagenation").empty();
                return reject('データ0件');
            }
            // totalItemsは結果がコロコロ変わる仕様なので、初回検索時以外は件数そのままにしました。
            (!$("#totalcnt").text() || ($("#totalcnt").text() == "0")) && $("#totalcnt").html(data.totalItems);
            html = '<tr><th class="bookcover">表紙</th><th class="booktitle">タイトル</th><th class="releasedate">発売日</th><th class="bookauthor">著者</th><th class="bookdesc">概要</th></tr>';
            for (let i = 0; i < data.items.length; i++){
                html += "<tr>";
                (!data.items[i].volumeInfo.imageLinks?.smallThumbnail)?(html += `<td class="bookcover">画像無し</td>`):(html += `<td class="bookcover"><img class="bookimg" src="${data.items[i].volumeInfo.imageLinks.smallThumbnail}"></td>`);
                html += `<td class="booktitle">${data.items[i].volumeInfo.title}</td>`;
                // console.log(data.items[i].volumeInfo.authors?.[0]);
                // 発売日のフォーマットを「yyyy/dd/dd」形式で表示。
                const date = data.items[i].volumeInfo.publishedDate;
                (!data.items[i].volumeInfo.publishedDate)?(html += `<td class="releasedate">発売日不明</td>`):(html += `<td class="releasedate">${date.replace(/-/g, '/')}</td>`);
                (!data.items[i].volumeInfo.authors?.[0])?(html += `<td class="bookauthor">著者不明</td>`):(html += `<td class="bookauthor">${data.items[i].volumeInfo.authors[0]}</td>`);
                let isbnFlg = false;
                if(data.items[i].volumeInfo.industryIdentifiers?.length){
                    for(let j = 0; j < data.items[i].volumeInfo.industryIdentifiers.length; j++) {
                        if(data.items[i].volumeInfo.industryIdentifiers[j].type === 'ISBN_13') {
                            isbnFlg = true;
                            html += `<td class="bookdata" data-value=${data.items[i].volumeInfo.industryIdentifiers[j].identifier} hidden></td>`;
                        }
                    }
                }
                (!isbnFlg) && (html += `<td class="bookdata" data-value="" hidden></td>`);
                // console.log(data.items[i].volumeInfo.industryIdentifiers[0].identifier);
                (!data.items[i].volumeInfo.description)?(html += `<td class="bookdesc">概要無し</td>`):(html += `<td class="bookdesc">${data.items[i].volumeInfo.description}</td>`);
                html += "</tr>"
            }
            $("#booklist").empty().hide().append(html).fadeIn(500);
            resolve();
        });
    });
};

// ページング表示処理
function dispPage(targetPage) {
    // const totalCnt = parseInt($("#totalcnt").text());
    // const maxPage = Math.ceil(totalCnt / 10);
    // let pageNation;
    // if(maxPage <= 5) {
    //     pageNation = maxPage;
    // } else if(maxPage === targetPage) {

    // }

    let pageHtml = "";
        pageHtml += `<li class="prev"><a href="#">&lt;</a></li>`;
        pageHtml += `<li class="current"><a href="#">${targetPage}</a></li>`;
        for(let i = (targetPage+1); i < (targetPage + 5); i++){
            pageHtml += `<li><a href="#">${i}</a></li>`;
        }
        pageHtml += `<li class="next"><a href="#">&gt;</a></li>`;
    // console.log(pageHtml);
    $("#pagenation").empty().hide().append(pageHtml).fadeIn(500);
};
