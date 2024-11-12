'use strict';

// 各種パッケージのインポート
const fs = require("fs");
const https = require("https");
const express = require("express");
require("dotenv").config(); // 環境変数取得
const paypaySDK = require("@paypayopa/paypayopa-sdk-node");
const { v4: uuidv4 } = require("uuid");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const app = express();
const port = 3000;  // ポート番号

// SSL証明書読み込み
const sslCert = {
    key: fs.readFileSync("certs/server.key"),
    cert: fs.readFileSync("certs/server.crt")
};

// PAYPAY SDK定義
paypaySDK.Configure({
    clientId: process.env.PAYPAY_API_KEY,
    clientSecret: process.env.PAYPAY_API_SECRET,
    merchantId: process.env.MARCHANT_ID,
    productionMode: false
});

app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));
app.use(express.json());

// ejs使う際のおまじない
app.set("view engine", "ejs");

// 書籍一覧への画面遷移
app.get("/", (req, res) => {
    // createQR();
    // res.send('HTTPS 接続Test成功！');
    res.render('index.ejs');
});

// 書籍詳細画面への画面遷移
app.get("/detail", (req, res) => {
    // console.log('detail get 通過！')
    const isbn = req.params.isbn;
    res.render('detail.ejs');
});

// paypay決済API、決済画面へリダイレクト
app.post("/paypay", async(req, res) => {
    let priceStr = req.body.price;
    // console.log(priceStr);
    const price = parseInt(priceStr.replace(/[,円]/g, ""), 10);
    const response = await createQR(price);
    res.json({url: response.data.url});
});

// クレジットカード決済処理
app.post("/creditcard", async(req, res) => {
    let priceStr = req.body.price;
    const title = req.body.title;
    // console.log(priceStr);
    // console.log(title);
    const price = parseInt(priceStr.replace(/[,円]/g, ""), 10);
    // console.log('creditcard通過！');
    try {
        const session = await stripe.checkout.sessions.create({
            line_items: [{
                price_data: {
                    currency: "JPY",
                    product_data: {
                        name: title
                    },
                    unit_amount: price
                },
                quantity: 1
            }],
            mode: "payment",
            success_url: 'https://localhost:3000/success',
            cancel_url: 'https://localhost:3000/cancel'
        });
        // console.log(session.url);
        res.json({url: session.url});

    } catch(error) {
        res.status(500).send({error: error.message});
    }
});

// カート一覧画面遷移
app.get("/cart", (req, res) => {
    // console.log("カート画面へ遷移！");
    res.render("cart.ejs");
});

// クレカ決済成功画面遷移
app.get('/success', (req, res) => {
    res.render("success.ejs");
});

// クレカ決済キャンセル画面遷移
app.get('/cancel', (req, res) => {
    res.render('cancel.ejs')
});

// HTTPS接続
https.createServer(sslCert, app).listen(port, async() => {
    console.log("HTTPS起動成功！")
});

// paypayQRコード決済API呼出
async function createQR(price) {
    const uniquePaymentId = uuidv4();   // 取引IDはユニークの必要があるので、UUIDにてユニークIDを生成
    let resQR;
    try {
        let payload = {
            merchantPaymentId: uniquePaymentId,
            amount: {
              amount: price,
              currency: "JPY"
            },
            codeType: "ORDER_QR",
            orderDescription: "MIRRORMAN BOOKSTORE",
            isAuthorization: false,
            redirectUrl: "https://localhost:3000/",
            redirectType: "WEB_LINK",
            userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75 Mobile/14E5239e Safari/602.1"
          };
        // Calling the method to create a qr code
        resQR = await paypaySDK.QRCodeCreate(payload, (response) => {
            
        });
        // console.log('resQR：' + resQR.BODY);
        return resQR.BODY;
    } catch(error) {
        console.error('QRコード生成エラー：', error);
    }
};
 