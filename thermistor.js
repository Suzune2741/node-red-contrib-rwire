module.exports = function(RED) {
    function ThermistorNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        // 設定画面から値を取得（文字として来る場合があるのでNumberで数値化）
        node.bConst = Number(config.bConst) || 3435.0;
        node.toTemp = Number(config.toTemp) || 25.0;
        node.vcc    = Number(config.vcc)    || 3300.0;
        node.rRef   = Number(config.rRef)   || 10.0;

        node.on('input', function(msg, send, done) {
            // ADCからの入力値(V)を数値として受け取る
            let adcVal = Number(msg.payload);
            
            if (isNaN(adcVal)) {
                node.error("入力された値が数値ではありません", msg);
                if (done) done();
                return;
            }

            // V -> mV への変換
            let voltage = adcVal * 1000.0; 

            // 対数(log)の計算エラーを防ぐため、電圧が0以下や電源電圧以上の場合はエラーとする
            if (voltage <= 0 || voltage >= node.vcc) {
                node.error("電圧値が範囲外です（0V ～ 電源電圧の範囲である必要があります）", msg);
                if (done) done();
                return;
            }

            let temp = 1.0 / ( 1.0 / node.bConst * Math.log( (node.vcc - voltage) / (voltage / node.rRef) / node.rRef ) + 1.0 / (node.toTemp + 273.0) ) - 273.0;

            // 温度を payload にセット
            msg.payload = temp;
            
            msg.voltage_mV = voltage;

            // 次のノードにデータを送る
            send(msg);

            if (done) {
                done();
            }
        });
    }
    
    RED.nodes.registerType("thermistor", ThermistorNode);
}
