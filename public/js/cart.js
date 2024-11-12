'use strict';

const lsKey = "cartList";   // カート情報のlocalstrageKey

// $(document).ready(function(){})の省略形
$(() => {
    cartListDisp(); // カート一覧表示
});

// カート一覧の削除ボタン押下時
$("#cartlist").on("click", "#cartdelete", function() {
    let cartInfoList = localStorage.getItem(lsKey);
    cartInfoList = JSON.parse(cartInfoList);
    const deleteIdx =parseInt($(this).closest("td").data("value"));
    console.log(deleteIdx);
    cartInfoList.splice(deleteIdx, 1);
    localStorage.setItem(lsKey, JSON.stringify(cartInfoList));
    cartListDisp();
});

// PayPayボタン押下時
$("#paypay").on('click', () => {
    const price = $("#totalprice").text();
    // console.log(price);
    // location.href = `/paypayqr?price=${price}`;

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
    const price = $("#totalprice").text();
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

// カート一覧表示処理
function cartListDisp() {
    let cartInfoList = localStorage.getItem(lsKey);
    cartInfoList = JSON.parse(cartInfoList);
    let html = "";
    let totalPrice = 0;
    html = '<tr><th class="image">表紙</th><th class="title">タイトル</th><th class="price">値段</th><th class="deletebtn">カート削除</th></tr>';
    for (let i = 0; i < cartInfoList.length; i++) {
        // console.log(cartInfoList[i].image);
        // console.log(cartInfoList[i].title);
        // console.log(cartInfoList[i].price);
        const price = cartInfoList[i].price;
        totalPrice += price;
        html += `<tr>`;
        html += `<td class="image"><img class="bookimg" src="${cartInfoList[i].image}"></td>`;
        html += `<td class="title">${cartInfoList[i].title}</td>`;
        html += `<td class="price">${price.toLocaleString()}円</td>`;
        html += `<td class="deletebtn" data-value="${i}"><button id="cartdelete"><i class="fa-solid fa-delete-left"></i>削除</button>`;
        html += `</tr>`;
    }
    $("#cartlist").empty().hide().append(html).fadeIn(500);
    $("#totalprice").html(totalPrice.toLocaleString());
};
