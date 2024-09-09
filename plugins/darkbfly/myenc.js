/**作者
 * @author darkbfly
 * 插件名
 * @name myenc
 * 组织名  预留字段，未来发布插件会用到
 * @team darkbfly
 * 版本号
 * @version 1.0.5
 * 说明
 * @description myenc
 * 触发正则   在bncr 所有的rule都被视为正则
 * @rule ^(mydec|myenc)\s+([^ \n]+)$
 * // 是否管理员才能触发命令
 * @admin true
 * // 是否发布插件，预留字段，可忽略
 * @public false
 * // 插件优先级，越大优先级越高  如果两个插件正则一样，则优先级高的先被匹配
 * @priority 9999
 * // 是否禁用插件
 * @disable false
 * // 是否服务模块，true不会作为插件加载，会在系统启动时执行该插件内容
 * @service false
 * @classification ["自用"]
 */

function encData(strData) {
    let array = [];
    for (let i = 0; i < strData.length; i++) {
        array.push(256 - (strData.charCodeAt(i) % 256));
    }
    return btoa(String.fromCharCode(...array));
}
function decData(strData) {
    let array = atob(strData).split('').map(c => 256 - (c.charCodeAt(0) % 256));
    let gbkDecodedStr;

    // 使用GBK解码
    try {
        return new TextDecoder('utf-8').decode(new Uint8Array(array));
    } catch (err) {
        console.error("GBK decoding failed.");
        return "GBK Decoding failed!";
    }
}

function isValidJSON(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

module.exports = async s => {
    console.log(s.param(1));
    console.log(s.param(2));
    if (s.param(1) == "myenc") {
        await s.reply("加密字符串为[" + encData(s.param(2)) + "]");
    } else if (s.param(1) == "mydec") {
        var data = decData(s.param(2))
        if (isValidJSON(data)) {
            await s.reply("解密字符串为JSON\n" + JSON.stringify(JSON.parse(data), null, 2));
        } else { await s.reply("解密字符串为[" + data + "]"); }
    }
};