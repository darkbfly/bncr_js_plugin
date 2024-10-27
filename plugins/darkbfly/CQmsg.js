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
 * @rule (?<=\[CQ:image,.*?url=)([^,]+)
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
const request = require('request');
const axios = require('axios');
const { url } = require('inspector');
const axiosRetry = require('axios-retry').default;
const savePath = path.join(__dirname, 'save'); // mod 文件夹路径

const jsonSchema = BncrCreateSchema.object({
    aria2RpcUrl: BncrCreateSchema.string()
        .setTitle('aria2页面')
        .setDescription('aria2页面')
        .setDefault('http://192.168.1.100:6800/jsonrpc'),
    aria2RpcToken: BncrCreateSchema.string()
        .setTitle('aria2 token')
        .setDescription('aria2 token')
        .setDefault(''),
});

const ConfigDB = new BncrPluginConfig(jsonSchema);

// 发送 JSON-RPC 请求的函数
function sendJsonRpcRequest(method, params, callback) {
    const data = {
        jsonrpc: '2.0',
        method: method,
        id: 'qwer',
        params: params
    };

    const options = {
        url: ConfigDB.userConfig.aria2RpcUrl,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };

    request(options, (error, response, body) => {
        if (error) {
            return callback(error);
        }

        if (response.statusCode !== 200) {
            return callback(new Error(`HTTP error: ${response.statusCode}`));
        }

        try {
            const result = JSON.parse(body);
            if (result.error) {
                return callback(result.error);
            }
            callback(null, result.result);
        } catch (parseError) {
            callback(parseError);
        }
    });
}

// 添加一个新的下载任务
function addDownload(url, options, callback) {
    const params = [[url], options];
    sendJsonRpcRequest('aria2.addUri', params, (error, gid) => {
        if (error) {
            console.error(`Error adding download: ${error.message}`);
            return callback(error);
        }
        console.log(`Download added with GID: ${gid}`);
        callback(null, gid);
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function saveImageToFolder(imageUrl, fileName, msg) {
    const folderPath = path.join(savePath, msg.toString()); // 文件完整路径
    const filePath = path.join(folderPath, fileName); // 文件完整路径
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
    await sleep(300);
    return new Promise((resolve, reject) => {
        // 下载并保存图片
        axios({
            url: imageUrl,
            method: 'GET',
            responseType: 'stream'
        })
            .then(response => {
                response.data.pipe(fs.createWriteStream(filePath))
                    .on('finish', () => {

                        console.log(`Downloaded: ${filePath}`);
                        resolve(filePath); // 下载完成，返回文件路径
                    })
                    .on('error', (err) => {
                        console.error(`Error downloading file: ${err.message}`);
                        reject(err);
                    });
            })
            .catch(error => {
                console.error(`Request error: ${error.message}`);
                reject(error);
            });
    });
}

async function get_forward_msg(msg, s) {
    errCount = 0;

    var config = {
        method: 'post',
        url: 'http://192.168.1.100:3000/get_forward_msg',
        headers: {
            'User-Agent': 'Apifox/1.0.0 (https://apifox.com)',
            'Content-Type': 'application/json'
        },
        data: JSON.stringify({
            "message_id": msg.toString()
        })
    };

    try {
        const response = await axios(config);
        let errCount = 0;
        console.log(response.data);
        if (response.data.retcode === 0) {
            const messages = response.data.data.messages;

            messages.forEach(async element => {
                try {
                    element.content.forEach(async element1 => {
                        switch (element1.type) {
                            case "image":
                                try {
                                    await saveImageToFolder(element1.data.url, element1.data.file, msg);
                                } catch (error) {
                                    console.error(error);
                                    errCount++;
                                }
                                break;
                            case "forward":
                                await get_forward_msg(element1.data.id, s);
                            default:
                                break;
                        }
                    });
                } catch (error) {
                    console.error(error);
                    errCount++;
                }
            });

            if (errCount > 0) {
                s.reply(`有${errCount}个图片下载失败`);
            } else {
                s.reply("下载完成");
            }
        } else {
            // return response.data.status || '请求失败';
            s.reply("get_forward_msg 返回" + response.data.status || '请求失败');
        }
    } catch (error) {
        throw new Error(error.response ? error.response.data : error.message);
    }
}

module.exports = async s => {
    // 配置 axios-retry
    axiosRetry(axios, {
        retries: 3, // 重试次数
        retryDelay: (retryCount) => {
            console.log(`重试次数: ${retryCount}`);
            return retryCount * 1000; // 每次重试之间的延迟（毫秒）
        },
        retryCondition: (error) => {
            // 仅在网络错误或 5xx 响应时重试
            return axiosRetry.isNetworkError(error) ||
                (error.response && error.response.status >= 500);
        },
    });
    await ConfigDB.get();
    if (!Object.keys(ConfigDB.userConfig).length) {
        await s.reply('请先前往前端web"插件配置"来完成插件首次配置');
        return;
    }

    console.log(s.param(1));
    console.log(s.param(2));
    if (s.param(1) == "forward") {
        await get_forward_msg(s.param(2), s)
    } else {
        const imageRegex = /\[CQ:image,.*?\]/g;
        let match;
        // 找到所有的 CQ:image 结构
        while ((match = imageRegex.exec(s.getMsg())) !== null) {
            const imageStr = match[0];

            // 确认这是 CQ:image
            if (imageStr.startsWith('[CQ:image')) {
                const urlRegex = /url=([^,]+)/; // 提取 URL 的正则表达式
                const fileRegex = /file=([^,]+)/;
                const fileMatch = fileRegex.exec(imageStr);
                const urlMatch = urlRegex.exec(imageStr);
                if (urlMatch && fileMatch) {
                    console.log(fileMatch[1]);
                    console.log(urlMatch[1]);
                    try {
                        await saveImageToFolder(urlMatch[1], fileMatch[1], sysMethod.getTime('yyyy-MM-dd'));
                    } catch (error) {
                        s.reply("下载失败" + urlMatch[1]);
                    }
                }
            }
        }
    }
};
