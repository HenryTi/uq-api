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
exports.processBusMessage = exports.writeDataToBus = void 0;
const tool_1 = require("../../tool");
function writeDataToBus(runner, face, unit, to, from, fromQueueId, version, body, defer, stamp) {
    return __awaiter(this, void 0, void 0, function* () {
        let ret = yield runner.actionDirect('writebusqueue', unit, undefined, face, defer, to, from, fromQueueId, version, body, stamp);
        if (ret && ret.length > 0) {
            return ret[0]['queueid'];
        }
    });
}
exports.writeDataToBus = writeDataToBus;
function processBusMessage(unitxRunner, msg) {
    return __awaiter(this, void 0, void 0, function* () {
        // 处理 bus message，发送到相应的uq服务器
        let { unit, body, defer, to, from, queueId, busOwner, bus, face, version, stamp } = msg;
        let faceUrl = busOwner + '/' + bus + '/' + face;
        let ret = yield writeDataToBus(unitxRunner, faceUrl, unit, to, from, queueId, version, body, defer, stamp);
        if (ret < 0) {
            tool_1.logger.error('writeDataToBus message duplicated!', msg, -ret);
        }
    });
}
exports.processBusMessage = processBusMessage;
//# sourceMappingURL=processBusMessage.js.map