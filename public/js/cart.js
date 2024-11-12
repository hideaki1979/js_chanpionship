'use strict';

const lsKey = "cartList";   // カート情報のlocalstrage

$(() => {
    cartListDisp()
});

$("#cartlist").on("click", "#cartdelete", function() {
    let cartInfoList = localStorage.getItem(lsKey);
    cartInfoList = JSON.parse(cartInfoList);
    const deleteIdx =parseInt($(this).closest("td").data("value"));
    console.log(deleteIdx);
    cartInfoList.splice(deleteIdx, 1);
    localStorage.setItem(lsKey, JSON.stringify(cartInfoList));
    cartListDisp();
});

$("#paypay").on('click', () => {
    const price = $("#totalprice").text();
    // console.log(price);
    location.href = `/paypayqr?price=${price}`;
});

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
