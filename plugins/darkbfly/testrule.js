/**作者
 * @author darkbfly
 * 插件名
 * @name testrule
 * 组织名  预留字段，未来发布插件会用到
 * @team darkbfly
 * 版本号
 * @version 1.0.5
 * 说明
 * @description testrule
 * 触发正则   在bncr 所有的rule都被视为正则
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
module.exports = async s => {
    str = s.getMsg()
    const imageRegex = /\[CQ:image,.*?\]/g;
    let match;
    // 找到所有的 CQ:image 结构
    while ((match = imageRegex.exec(str)) !== null) {
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
            }
        }
    }
};
