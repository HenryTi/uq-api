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
exports.processSheetMessage = void 0;
const core_1 = require("../../core");
const pushToClient_1 = require("./pushToClient");
const actionProcess_1 = require("../actionProcess");
function processSheetMessage(unitxRunner, sheetMsg) {
    return __awaiter(this, void 0, void 0, function* () {
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
        yield (0, actionProcess_1.actionProcess)(unit, user, sheetMessage, $unitx, undefined, unitxRunner, msgBody, call, run);
        // 单据处理的消息发送到前台
        yield (0, pushToClient_1.pushToClient)(unitxRunner, sheetMsg);
    });
}
exports.processSheetMessage = processSheetMessage;
//# sourceMappingURL=processSheetMessage.js.map