'use strict';

// 各種パッケージのインポート
const fs = require("fs");
const https = require("https");
const express = require("express");
require("dotenv").config(); // 環境変数取得
const paypaySDK = require("@paypayopa/paypayopa-sdk-node");
const { v4: uuidv4 } = require("uuid");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const webSocket = require("ws");
const ngrok = require("ngrok");
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

app.use(express.static('public'));  // cssや独自jsファイルのルートディレクトリ指定
app.use(express.urlencoded({extended: true}));  // true指定だとネストされたオブジェクトもjsonとして解析
app.use(express.json());

// ejs使う際のおまじない（これを指定するとejsファイルでJSPみたいに動的な実装が可能となる）
app.set("view engine", "ejs");

// HTTPS接続
const expServer = https.createServer(sslCert, app);
// WebSocketサーバーを起動する。
const wsServer = new webSocket.Server({ server: expServer });

let pendingMessages = [];   // PayPayの通知情報一時保管用
wsServer.on("connection", (client) => {
    // クライアント接続
    if (pendingMessages.length > 0) {
        pendingMessages.forEach(message => {
            console.log(`WebSocketクライアントへメッセージ送信！`);
            console.log(message);
            client.send(JSON.stringify(message));
        });
        // 送信済みならキューをクリア
        pendingMessages = [];
    }
    console.log(`WebSocketクライアントからサーバへの接続完了！`);
    // クライアント切断
    client.on("close", () => {
        console.log(`WebSocketクライアント切断終了！`);
    });

    client.on("error", (error) => {
        console.error(`WebSocketサーバエラー：${error}`);
    });
});

wsServer.on("close", () => {
    console.log(`WebSocketクライアント切断終了！`);
});

wsServer.on("error", (error) => {
    console.error(`WebSocketサーバエラー：${error}`);
});

// 書籍一覧への画面遷移
app.get("/", (req, res) => {
    // createQR();
    // res.send('HTTPS 接続Test成功！');
    res.render('index.ejs');
});

// 書籍詳細画面への画面遷移
app.get("/detail", (req, res) => {
    // console.log('detail get 通過！')
    const isbn = req.query.isbn;
    // console.log(req);
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

// paypay決済APIのwebhook通知
app.post("/paypay-webhook", (req, res) => {
    console.log(req.headers);
    console.log(req.body);
    console.log("paypayからwebhookを受け取りました！");
    console.log(`WebSocketサーバのクライアントサイズ：${wsServer.clients.size}`);
    // paypayからの通知を一時保管
    pendingMessages.push({ status: req.body.state })
    console.log(pendingMessages);
    res.status(200).send("SUCCESS");
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

expServer.listen(port, async() => {
    console.log("HTTPS起動成功！");

    // ngrokを起動して、webhook用のURL取得
    const url = await ngrok.connect({
        addr: "https://localhost:3000/",
        proto: "http"
    });
    console.log(`ngrokのURL：${url}`);
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
 