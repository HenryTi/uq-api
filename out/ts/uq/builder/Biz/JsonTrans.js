"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonValInArr = exports.JsonValInMain = void 0;
const il_1 = require("../../il");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const a = 'a', b = 'b';
class JsonVal {
    transID(peer, val) {
        const { id: ioAppID } = peer;
        if (ioAppID === undefined) {
            return val;
        }
        const { unique, id } = ioAppID;
        const { site } = this.context;
        if (unique === undefined) {
            return new sql_1.ExpFuncDb('$site', `${site}.${this.transFuncName}`, new sql_1.ExpFuncInUq('duo$id', [
                sql_1.ExpNum.num0, sql_1.ExpNum.num0, sql_1.ExpNum.num1, sql_1.ExpNull.null,
                new sql_1.ExpVar(JsonVal.siteAtomApp), new sql_1.ExpNum(ioAppID.id),
            ], true), val);
        }
        else {
            let keyVal = this.buildKeyVal(peer);
            return new sql_1.ExpFuncDb('$site', `${site}.${id}.${this.transFuncName}`, keyVal, val);
        }
    }
    buildKeyVal(peer) {
        let { keys } = peer;
        if (keys === undefined || keys.length === 0) {
            return new sql_1.ExpVar(JsonVal.otherSite);
        }
        let len = keys.length;
        let valKey = this.buildValFromKey(keys[0]);
        for (let i = 1; i < len; i++) {
            let valKeyi = this.buildValFromKey(keys[i]);
            valKey = new sql_1.ExpFuncInUq('duo$id', [
                sql_1.ExpNum.num0, sql_1.ExpNum.num0, sql_1.ExpNum.num1, sql_1.ExpNull.null,
                valKey, valKeyi,
            ], true);
        }
        return valKey;
    }
    /*
    protected buildValFromBud(bud: BizBud, peer: IOPeer): { toName: string; val: ExpVal; } {
        let val: ExpVal;
        const { name, dataType } = bud;
        if (peer === undefined) {
            if (dataType === BudDataType.arr) {
                val = this.buildJsonArr(name, bud as BizBudArr, undefined);
            }
            else {
                val = this.buildVal(bud);
            }
        }
        else {
            switch (peer.peerType) {
                default:
                    val = this.buildVal(bud);
                    break;
                case PeerType.peerArr:
                    val = this.buildJsonArr(name, bud as BizBudArr, peer as IOPeerArr);
                    break;
                case PeerType.peerId:
                    val = this.transID(peer as IOPeerID, this.buildVal(bud));
                    break;
                case PeerType.peerOptions:
                    val = this.transOptions(peer as IOPeerOptions, this.buildVal(bud));
                    break;
            }
        }

        let toName: string;
        if (peer === undefined) {
            toName = name;
        }
        else {
            const { to, name: peerName } = peer;
            toName = to ?? peerName;
        }
        return { toName: toName, val };
    }
    */
    transOptions(peer, val) {
        const { options } = peer;
        const select = this.factory.createSelect();
        select.column(new sql_1.ExpField('id', a));
        select.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizPhrase, false, a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizPhrase, false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField('base', a)));
        select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('base', a), new sql_1.ExpNum(options.id)), new sql_1.ExpEQ(new sql_1.ExpField('name', a), new sql_1.ExpFunc(this.factory.func_concat, new sql_1.ExpField('name', b), new sql_1.ExpStr('.'), val))));
        return new sql_1.ExpSelect(select);
    }
}
JsonVal.jsonTable = 't';
JsonVal.siteAtomApp = '$siteAtomApp';
JsonVal.otherSite = '$otherSite';
class JsonValInMain extends JsonVal {
    build(bud) {
        const { name, dataType } = bud;
        let exp = new sql_1.ExpField(name, JsonVal.jsonTable);
        let peer;
        if (this.ioPeers !== undefined)
            peer = this.ioPeers[name];
        if (peer !== undefined && peer.type === il_1.PeerType.peerId) {
            return this.transID(peer, exp);
        }
        switch (dataType) {
            default:
                return exp;
            case il_1.BudDataType.date:
                return new sql_1.ExpFunc('DATEDIFF', exp, new sql_1.ExpStr('1970-01-01'));
        }
    }
    buildValFromKey(key) {
        let { bud } = key;
        let val = this.build(bud);
        return val;
    }
}
exports.JsonValInMain = JsonValInMain;
class JsonValInArr extends JsonVal {
    build(bud) {
        const { name, dataType } = bud;
        let exp = new sql_1.ExpField(name, JsonVal.jsonTable);
        let peer;
        if (this.ioPeers !== undefined)
            peer = this.ioPeers[name];
        if (peer !== undefined && peer.type === il_1.PeerType.peerId) {
            return this.transID(peer, exp);
        }
        switch (dataType) {
            default:
                return exp;
            case il_1.BudDataType.date:
                return new sql_1.ExpFunc('DATEDIFF', exp, new sql_1.ExpStr('1970-01-01'));
        }
    }
    buildValFromKey(key) {
        let { bud } = key;
        let val = this.build(bud);
        return val;
    }
}
exports.JsonValInArr = JsonValInArr;
//# sourceMappingURL=JsonTrans.js.map