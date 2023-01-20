"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushToClient = void 0;
const tool_1 = require("../../tool");
const core_1 = require("../../core");
// 现在简单的把client message推送给center，由center来分发给client
// 以后需要做client消息分发服务器
async function pushToClient(unitxRunner, msg) {
    try {
        await core_1.centerApi.pushTo(msg);
    }
    catch (err) {
        tool_1.logger.error(err);
    }
}
exports.pushToClient = pushToClient;
//# sourceMappingURL=pushToClient.js.map