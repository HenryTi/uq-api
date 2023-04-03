"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildBizRouter = void 0;
const tool_1 = require("../tool");
const bizType = 'biz';
function buildBizRouter(router, rb) {
    rb.entityPost(router, bizType, '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        try {
            let { id, act } = body;
            let ret = await runner.unitUserCall('$biz.sheet', unit, user, id, act);
            // 如果真正的biz sheet act重新编译了，则发挥proc的名字。
            // 下面的调用，会重新生成proc存储过程。
            if (ret) {
                if (ret.length > 0) {
                    let { proc } = ret[0];
                    await runner.unitUserCall(proc, unit, user, id);
                }
            }
        }
        catch (err) {
            tool_1.logger.error('POST /biz &db=', db, err);
            debugger;
        }
    });
}
exports.buildBizRouter = buildBizRouter;
//# sourceMappingURL=biz.js.map