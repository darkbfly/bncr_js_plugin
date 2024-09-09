/**作者
 * @author darkbfly
 * 插件名
 * @name downloadAIO
 * 组织名  预留字段，未来发布插件会用到
 * @team darkbfly
 * 版本号
 * @version 1.0.5
 * 说明
 * @description demo
 * 触发正则   在bncr 所有的rule都被视为正则
 * @rule (https://v.douyin.com[.a-zA-Z0-9/]*)
 * @rule (https://v.kuaishou.com[.a-zA-Z0-9/]*)
 * @rule (https://b23.tv[.a-zA-Z0-9/]*)
 * @rule (https://weibo.com[.a-zA-Z0-9/]*)
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
 * @classification ["抖音", "快手"]
 */

const axios = require('axios');
/* HideStart */
async function downloadAIO(s, url) {
    const options = {
        method: 'POST',
        url: 'https://auto-download-all-in-one.p.rapidapi.com/v1/social/autolink',
        headers: {
            'x-rapidapi-key': 'd921658e41msh5bd3d82480436e7p164560jsn2e1d11f7c6d9',
            'x-rapidapi-host': 'auto-download-all-in-one.p.rapidapi.com',
            'Content-Type': 'application/json'
        },
        data: {
            url: url
        }
    };

    try {
        var videoUrl = null;
        const response = await axios.request(options);
        await s.reply(response.data.title);
        var videoPriority = ["hd_no_watermark", "no_watermark", "watermark", "720p", "480p", "360p"]
        for (const element1 of videoPriority) {
            if (videoUrl) break;
            for (const element of response.data.medias) {
                if (element.quality == element1) {
                    videoUrl = element.url;
                    break;
                }
            }
        }
        if (videoUrl) {
            await s.reply({
                type: "video",
                path: videoUrl
            });
        } else {
            await s.reply("下载地址未找到");
        }
    } catch (error) {
        await s.reply("解析异常！");
        console.error(error);
    }
}
/* HideEnd */
module.exports = async s => {
    console.log(s.param(0));
    await s.reply("解析中...");
    downloadAIO(s, s.param(0))
};