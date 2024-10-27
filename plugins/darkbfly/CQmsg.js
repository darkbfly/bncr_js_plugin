/**作者
 * @author darkbfly
 * 插件名
 * @name CQmsg
 * 组织名  预留字段，未来发布插件会用到
 * @team darkbfly
 * 版本号
 * @version 1.0.5
 * 说明
 * @description CQmsg
 * 触发正则   在bncr 所有的rule都被视为正则
 * @rule ^\[CQ:([a-zA-Z]+),id=([0-9]+)
 * // 是否管理员才能触发命令
 * @admin true
 * // 是否发布插件，预留字段，可忽略
 * @public true
 * // 插件优先级，越大优先级越高  如果两个插件正则一样，则优先级高的先被匹配
 * @priority 9999
 * // 是否禁用插件
 * @disable false
 * // 是否服务模块，true不会作为插件加载，会在系统启动时执行该插件内容
 * @service false
 * @classification ["自用"]
 */
const fs = require('fs');
const path = require('path');
const log = require('console');
const request = require('request');
const axios = require('axios');
const savePath = path.join(__dirname, 'save'); // mod 文件夹路径

async function saveImageToFolder(imageUrl, fileName, msg) {
    const folderPath  = path.join(savePath, msg.toString()); // 文件完整路径
    const filePath = path.join(folderPath, fileName); // 文件完整路径
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
    // 下载并保存图片
    const writer = fs.createWriteStream(filePath);
    const response = await axios({
        url: imageUrl,
        method: 'GET',
        responseType: 'stream',
        headers
    });

    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

async function get_forward_msg(msg) {
    // [CQ:forward,id=7430251825488090848]
    var options = {
        'method': 'POST',
        'url': 'http://192.168.1.100:3000/get_forward_msg',
        'headers': {
            'User-Agent': 'Apifox/1.0.0 (https://apifox.com)',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "message_id": msg
        })

    };
    request(options, function (error, response) {
        if (error) throw new Error(error);
        console.log(response.body);
        obj = JSON.parse(response.body);
        errCount = 0;
        if (obj.retcode == 0) {
            var messages = obj.data.messages;
            console.log(messages);
            messages.forEach(async element => {
                switch (element.content[0].type) {
                    case "image":
                        try {
                            await saveImageToFolder(element.content[0].data.url, element.content[0].data.file, msg)
                        } catch (error) {
                            errCount++;
                        }
                        break;
                    default:
                        break;
                }
            });
            if (errCount > 0){
                return "有" + errCount + "个图片下载失败"
            } else {
                return "全部图片下载成功"
            }
        } else {
            return obj.status;
        }
    });
}

module.exports = async s => {
    console.log(s.param(1));
    console.log(s.param(2));
    if (s.param(1) == "forward") {
        var data = await get_forward_msg(s.param(2))
        s.reply(data);
    }
};
