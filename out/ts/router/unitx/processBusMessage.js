"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processBusMessage = exports.writeDataToBus = void 0;
const tool_1 = require("../../tool");
async function writeDataToBus(runner, face, unit, to, from, fromQueueId, version, body, defer, stamp) {
    let ret = await runner.actionDirect('writebusqueue', unit, undefined, face, defer, to, from, fromQueueId, version, body, stamp);
    if (ret && ret.length > 0) {
        return ret[0]['queueid'];
    }
}
exports.writeDataToBus = writeDataToBus;
async function processBusMessage(unitxRunner, msg) {
    // 处理 bus message，发送到相应的uq服务器
    let { unit, body, defer, to, from, queueId, busOwner, bus, face, version, stamp } = msg;
    let faceUrl = busOwner + '/' + bus + '/' + face;
    let ret = await writeDataToBus(unitxRunner, faceUrl, unit, to, from, queueId, version, body, defer, stamp);
    if (ret < 0) {
        tool_1.logger.error('writeDataToBus message duplicated!', msg, -ret);
    }
}
exports.processBusMessage = processBusMessage;
//# sourceMappingURL=processBusMessage.js.map