"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processSheetMessage = void 0;
const core_1 = require("../../core");
const pushToClient_1 = require("./pushToClient");
const actionProcess_1 = require("../actionProcess");
async function processSheetMessage(unitxRunner, sheetMsg) {
    let { $unitx, sheetMessage } = core_1.consts;
    let { unit, body, to } = sheetMsg;
    let { id, discription, no, state, app, uq, sheet } = body;
    //let unitxRunner = await getRunner($unitx);
    let content = {
        app: app,
        id: id,
        uq: uq,
        sheet: sheet
    };
    let msgBody = {
        subject: discription,
        discription: no + ' - ' + state,
        content: JSON.stringify(content),
        uq: uq,
        sheet: id,
        state: state,
        tos: to.map(v => { return { to: v }; }),
    };
    let schema = unitxRunner.getSchema(sheetMessage);
    let call = schema.call;
    let run = schema.run;
    let user = 0;
    // 保存单据消息
    // 保存之后，发送desk消息到home
    await (0, actionProcess_1.actionProcess)(unit, user, sheetMessage, $unitx, undefined, unitxRunner, msgBody, call, run);
    // 单据处理的消息发送到前台
    await (0, pushToClient_1.pushToClient)(unitxRunner, sheetMsg);
}
exports.processSheetMessage = processSheetMessage;
//# sourceMappingURL=processSheetMessage.js.map