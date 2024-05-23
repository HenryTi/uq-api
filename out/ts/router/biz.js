"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildBizSheetActRouter = exports.buildBizRouter = void 0;
const tool_1 = require("../tool");
const bizType = 'biz';
function buildBizRouter(router, rb) {
    rb.entityPost(router, bizType, '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        try {
            let { id, act } = body;
            let ret = yield runner.unitUserCall('$biz.sheet', unit, user, id, act);
            // 如果真正的biz sheet act重新编译了，则返回proc的名字。
            // 下面的调用，会重新生成proc存储过程。
            if (ret) {
                if (ret.length > 0) {
                    let { proc } = ret[0];
                    yield runner.unitUserCall(proc, unit, user, id);
                }
            }
        }
        catch (err) {
            tool_1.logger.error('POST /biz &db=', db, err);
            debugger;
        }
    }));
}
exports.buildBizRouter = buildBizRouter;
const bizSheetActType = 'biz-sheet-act';
function buildBizSheetActRouter(router, rb) {
    rb.entityPost(router, bizSheetActType, '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        try {
            let { id, detail, act } = body;
            yield runner.confirmProc(`${detail}.${act}`);
            let ret = yield runner.unitUserCall('$biz.sheet.act', unit, user, id, detail, act);
            /*
            // 如果真正的biz sheet act重新编译了，则返回proc的名字。
            // 下面的调用，会重新生成proc存储过程。
            if (ret) {
                if (ret.length > 0) {
                    let { proc } = ret[0];
                    await runner.unitUserCall(proc, unit, user, id, detail, act)
                }
            }
            */
            return ret;
        }
        catch (err) {
            tool_1.logger.error('POST /biz-sheet-act &db=', db, err);
            debugger;
        }
    }));
}
exports.buildBizSheetActRouter = buildBizSheetActRouter;
//# sourceMappingURL=biz.js.map