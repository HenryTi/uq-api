"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonValInArr = exports.JsonValInMain = exports.JsonVal = void 0;
const il_1 = require("../../../il");
const sql_1 = require("../../sql");
const select_1 = require("../../sql/select");
const statementWithFrom_1 = require("../../sql/statementWithFrom");
const a = 'a', b = 'b';
class JsonVal {
    constructor(jsonContext, ioPeers) {
        this.jsonContext = jsonContext;
        this.ioPeers = ioPeers;
    }
    build(bud) {
        let peerName;
        let val;
        const { name, dataType } = bud;
        let peer;
        if (this.ioPeers !== undefined) {
            peer = this.ioPeers.peers[name];
        }
        if (peer !== undefined) {
            const { to, name: pName } = peer;
            peerName = to !== null && to !== void 0 ? to : pName;
        }
        else {
            peerName = name;
        }
        if (dataType === il_1.BudDataType.arr) {
            val = this.buildArr(bud, peer);
        }
        else {
            let expVal = this.buildVal(bud);
            switch (dataType) {
                default:
                    if (peer !== undefined) {
                        switch (peer.peerType) {
                            default:
                                val = expVal;
                                break;
                            case il_1.PeerType.peerOptions:
                                val = this.transOptions(peer, expVal);
                                break;
                        }
                    }
                    else {
                        val = expVal;
                    }
                    break;
                case il_1.BudDataType.ID:
                    val = this.transID(peer, expVal);
                    break;
                case il_1.BudDataType.date:
                    val = new sql_1.ExpFunc('DATEDIFF', expVal, new sql_1.ExpStr('1970-01-01'));
                    break;
            }
        }
        return { peerName, val };
    }
    buildArr(bud, peer) {
        const { name: arrName } = bud;
        const { props } = bud;
        const { factory, expJson } = this.jsonContext;
        let select = factory.createSelect();
        select.lock = select_1.LockType.none;
        const columns = [];
        for (let [name, bud] of props) {
            let field;
            switch (bud.dataType) {
                default:
                    debugger;
                    break;
                case il_1.BudDataType.int:
                    field = (0, il_1.bigIntField)(name);
                    break;
                case il_1.BudDataType.dec:
                    field = (0, il_1.decField)(name, 24, 6);
                    break;
                case il_1.BudDataType.arr:
                    field = (0, il_1.jsonField)(name);
                    break;
                case il_1.BudDataType.ID:
                case il_1.BudDataType.date:
                case il_1.BudDataType.char:
                case il_1.BudDataType.str:
                    field = (0, il_1.charField)(name, 400);
                    break;
            }
            let ret = {
                field,
                path: `$."${name}"`,
            };
            columns.push(ret);
        }
        ;
        let arrObj = this.buildArrObj(bud, peer);
        select.column(new sql_1.ExpFunc('JSON_ARRAYAGG', arrObj));
        select.from(new statementWithFrom_1.FromJsonTable(JsonVal.jsonTable, expJson, `$."${arrName}"[*]`, columns));
        return new sql_1.ExpSelect(select);
    }
    buildArrObj(bud, peer) {
        const { peers } = peer;
        const { props } = bud;
        let objParams = [];
        let jsonVal = new JsonValInArr(this.jsonContext, peers, this);
        for (let [, bud] of props) {
            let { peerName, val } = jsonVal.build(bud);
            objParams.push(new sql_1.ExpStr(peerName), val);
        }
        return new sql_1.ExpFunc('JSON_OBJECT', ...objParams);
    }
    transID(peer, val) {
        const { context, transFuncName } = this.jsonContext;
        const { id: ioAppID } = peer;
        if (ioAppID === undefined) {
            return val;
        }
        const { unique, id } = ioAppID;
        const { site } = context;
        if (unique === undefined) {
            return new sql_1.ExpFuncDb('$site', `${site}.${transFuncName}`, new sql_1.ExpFuncInUq('duo$id', [
                sql_1.ExpNum.num0, sql_1.ExpNum.num0, sql_1.ExpNum.num1, sql_1.ExpNull.null,
                new sql_1.ExpVar(JsonVal.siteAtomApp), new sql_1.ExpNum(ioAppID.id),
            ], true), val);
        }
        else {
            let keyVal = this.buildKeyVal(peer);
            return new sql_1.ExpFuncDb('$site', `${site}.${id}.${transFuncName}`, keyVal, val);
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
    transOptions(peer, val) {
        const { factory } = this.jsonContext;
        const { options } = peer;
        const select = factory.createSelect();
        select.column(new sql_1.ExpField('id', a));
        select.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizPhrase, false, a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizPhrase, false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField('base', a)));
        select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('base', a), new sql_1.ExpNum(options.id)), new sql_1.ExpEQ(new sql_1.ExpField('name', a), new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpField('name', b), new sql_1.ExpStr('.'), val))));
        return new sql_1.ExpSelect(select);
    }
}
exports.JsonVal = JsonVal;
JsonVal.jsonTable = 't';
JsonVal.siteAtomApp = '$siteAtomApp';
JsonVal.otherSite = '$otherSite';
JsonVal.vJson = '$json';
class JsonValInMain extends JsonVal {
    buildValFromKey(key) {
        let { bud } = key;
        let { val } = this.build(bud);
        return val;
    }
    buildVal(bud) {
        let suffix;
        switch (bud.dataType) {
            default:
                debugger;
                throw new Error('unknown data type ' + bud.dataType);
            case il_1.BudDataType.ID:
            case il_1.BudDataType.char:
            case il_1.BudDataType.str:
                suffix = undefined;
                break;
            case il_1.BudDataType.date:
                // return this.buildDateVal(bud);
                suffix = undefined;
                break;
            case il_1.BudDataType.int:
                suffix = 'RETURNING SIGNED';
                break;
            case il_1.BudDataType.dec:
                suffix = 'RETURNING DECIMAL';
                break;
        }
        return new sql_1.ExpFunc('JSON_VALUE', this.jsonContext.expJson, new sql_1.ExpComplex(new sql_1.ExpStr(`$."${bud.name}"`), undefined, suffix));
    }
}
exports.JsonValInMain = JsonValInMain;
class JsonValInArr extends JsonVal {
    constructor(jsonContext, ioPeers, jsonValMain) {
        super(jsonContext, ioPeers);
        this.jsonValMain = jsonValMain;
    }
    buildValFromKey(key) {
        let { bud, sameLevel } = key;
        if (sameLevel === false) {
            let { val } = this.jsonValMain.build(bud);
            return val;
        }
        else {
            let { val } = this.build(bud);
            return val;
        }
    }
    buildArr(bud, peer) {
        throw new Error('should not be here');
    }
    buildVal(bud) {
        return new sql_1.ExpField(bud.name, JsonVal.jsonTable);
    }
}
exports.JsonValInArr = JsonValInArr;
//# sourceMappingURL=JsonVal.js.map