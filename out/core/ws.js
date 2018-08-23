"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const wss = {};
function wsOnConnected(ws, req) {
    _1.authCheck(req, undefined, () => {
        let user = req.user;
        if (user === undefined) {
            user = {
                id: _1.debugUser,
                unit: _1.debugUnit,
                db: req.params.db,
            };
        }
        ws.user = user;
        let { db, unit, id } = user;
        let unitWss = wss[db];
        if (unitWss === undefined)
            unitWss = wss[db] = {};
        let userWss = unitWss[unit];
        if (userWss === undefined)
            userWss = unitWss[unit] = {};
        let wsGroup = userWss[id];
        if (wsGroup === undefined)
            userWss[id] = ws;
        else if (Array.isArray(wsGroup)) {
            wsGroup.push(ws);
        }
        else {
            userWss[id] = [wsGroup, ws];
        }
        console.log('webSocket tv connected id=%s', id);
        ws.db = db;
        ws.on('message', wsOnMessage);
        ws.on('close', (a, b) => wsOnClose(ws, a, b));
    });
}
exports.wsOnConnected = wsOnConnected;
function wsOnClose(ws, a, b) {
    let user = ws.user;
    if (user === undefined)
        return;
    let { db, id, unit } = user;
    let unitWss = wss[db];
    if (unitWss === undefined)
        return;
    let userWss = unitWss[unit];
    if (userWss === undefined)
        return;
    let wsGroup = userWss[id];
    if (Array.isArray(wsGroup)) {
        let wsArr = wsGroup;
        switch (wsArr.length) {
            case 0:
            case 1:
                delete userWss[id];
                break;
            case 2:
                if (ws === wsArr[0]) {
                    userWss[id] = wsArr[1];
                    break;
                }
                if (ws === wsArr[1]) {
                    userWss[id] = wsArr[0];
                    break;
                }
                break;
            default:
                let index = wsArr.findIndex(v => v === ws);
                if (index >= 0)
                    wsArr.splice(index, 1);
                break;
        }
    }
    else {
        delete userWss[id];
    }
    ws.close();
    console.log('webSocket close id=%s', id);
}
function wsOnMessage(msg) {
    console.log(new Date(), " ws receive: ", msg);
}
const wsLogs = [];
function logws(log) {
    wsLogs.push(log);
}
function wsSendMessage(db, msg) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield _1.centerApi.pushTo(msg);
            let s = null;
            console.log('message push to center:', msg);
        }
        catch (e) {
            console.error('ws send message to center:', e);
        }
    });
}
exports.wsSendMessage = wsSendMessage;
//# sourceMappingURL=ws.js.map