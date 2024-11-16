// WebSocket接続管理用JSファイル
'use strict';

const connectWS = (onMsgCallback) => {
    const ws = new WebSocket('wss://localhost:3000');    // WebSocketサーバへの接続定義;
    // WebSocketサーバへの接続開始
    ws.addEventListener("open", () => {
        console.log("クライアント側からWebSocketサーバへの接続開始します！");
        ws.send("クライアントからWebSocketサーバへの接続開始");
    });

    // サーバからのメッセージ受信
    ws.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);
        // console.log(`WebSocketサーバからのメッセージ受信しました。：${JSON.stringify(data)}`);
        // コールバック関数のリスナー登録
        if(onMsgCallback) {
            onMsgCallback(data);
        }
    });

    // WebSocketサーバ切断
    ws.addEventListener("close", () => {
        console.log("WebSocketサーバーから切断されました。");
    });

    ws.addEventListener("error", () => {
        console.error(`クライアントWebSocket接続エラー：`, error.message || "エラー情報なし");
    });
};

// 画面側で利用してもらうためにWebSocket接続関数をエクスポート
export { connectWS };