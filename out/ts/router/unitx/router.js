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
exports.buildUnitxRouter = void 0;
const express_1 = require("express");
const tool_1 = require("../../tool");
const core_1 = require("../../core");
const messageProcesser_1 = require("./messageProcesser");
const processBusMessage_1 = require("./processBusMessage");
function buildUnitxRouter(rb) {
    let router = (0, express_1.Router)();
    router.get('/hello', function (req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            res.json({
                text: 'hello',
            });
        });
    });
    const pathIndex = '/';
    router.post(pathIndex, function (req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let msg = req.body;
                let tos = undefined;
                let { type } = msg;
                let unitxRunner = yield rb.getUnitxRunner(req);
                if (type === 'sheet') {
                    let sheetMessage = msg;
                    let { from } = sheetMessage;
                    tos = yield getSheetTos(unitxRunner, sheetMessage);
                    if (tos === undefined || tos.length === 0)
                        tos = [from];
                    sheetMessage.to = tos;
                }
                if (type === 'bus') {
                    tool_1.logger.error(msg);
                }
                let mp = (0, messageProcesser_1.messageProcesser)(msg);
                yield mp(unitxRunner, msg);
                res.json({
                    ok: true,
                    res: tos,
                });
            }
            catch (e) {
                let err = JSON.stringify(e);
                tool_1.logger.error('unitx-error: ', err);
                res.json({
                    ok: false,
                    error: err,
                });
            }
        });
    });
    const pathFetchBus = '/fetch-bus';
    rb.post(router, pathFetchBus, function (runner, body) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { unit, msgStart, defer, faces } = body;
                if (unit === undefined || faces === undefined) {
                    throw new Error('unknown parameters');
                }
                let ret = yield runner.unitUserTablesFromProc('GetBusMessages', unit, undefined, msgStart, defer !== null && defer !== void 0 ? defer : 0, faces);
                return ret;
            }
            catch (err) {
                console.error(pathFetchBus, err);
                throw err;
            }
        });
    });
    const pathJoinReadBus = '/joint-read-bus';
    rb.post(router, pathJoinReadBus, function (runner, body) {
        return __awaiter(this, void 0, void 0, function* () {
            let { unit, face, queue, defer } = body;
            if (queue === undefined)
                queue = (0, core_1.busQueueSeed)();
            let ret = yield runner.unitUserCall('BusMessageFromQueue', unit, undefined, face, defer !== null && defer !== void 0 ? defer : 0, queue);
            if (ret.length === 0)
                return;
            return ret[0];
        });
    });
    let pathJointWriteBus = '/joint-write-bus';
    rb.post(router, pathJointWriteBus, function (runner, body) {
        return __awaiter(this, void 0, void 0, function* () {
            let { unit, face, defer, to, from, fromQueueId, version, body: message, stamp } = body;
            let ret = yield (0, processBusMessage_1.writeDataToBus)(runner, face, unit, to, from, fromQueueId, version, message, defer !== null && defer !== void 0 ? defer : 0, stamp);
            if (ret < 0) {
                tool_1.logger.error('writeDataToBus message duplicated!', body, -ret);
            }
            return ret;
        });
    });
    return router;
}
exports.buildUnitxRouter = buildUnitxRouter;
// 之前用 getSheetTo 查询，现在改名为 getEntityAccess
const uqGetSheetTo = 'getEntityAccess';
function getSheetTos(unitxRunner, sheetMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        let { unit, body } = sheetMessage;
        let { state, user, name, no, discription, uq } = body;
        // 新单只能发给做单人
        if (state === '$')
            return;
        // 上句中的to removed，由下面调用unitx来计算
        let sheetName = name;
        let stateName = state;
        let paramsGetSheetTo = [uq, sheetName, stateName];
        let tos = yield unitxRunner.query(uqGetSheetTo, unit, user, paramsGetSheetTo);
        return tos.map(v => v.to);
    });
}
//# sourceMappingURL=router.js.map