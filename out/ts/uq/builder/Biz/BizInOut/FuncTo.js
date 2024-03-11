"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuncAtomToNo = exports.FuncNoToAtom = exports.FuncUniqueToNo = exports.FuncUniqueFromNo = void 0;
const il_1 = require("../../../il");
const sql_1 = require("../../sql");
const select_1 = require("../../sql/select");
const statementWithFrom_1 = require("../../sql/statementWithFrom");
const IOStatementBuilder_1 = require("./IOStatementBuilder");
const a = 'a', b = 'b', c = 'c';
class FuncUniqueTo {
    constructor(factory, func, ioAppID) {
        this.param = 'param';
        this.factory = factory;
        this.func = func;
        this.ioAppID = ioAppID;
    }
    build() {
        const { unique } = this.ioAppID;
        const { parameters, statements } = this.func;
        parameters.push((0, il_1.bigIntField)(FuncUniqueTo.keyId), this.fromField());
        let declare = this.factory.createDeclare();
        statements.push(declare);
        declare.vars(this.toField());
        let ifParamNotNull = this.factory.createIf();
        statements.push(ifParamNotNull);
        ifParamNotNull.cmp = new sql_1.ExpIsNotNull(new sql_1.ExpVar(this.param));
        let select = this.factory.createSelect();
        ifParamNotNull.then(select);
        select.toVar = true;
        select.lock = select_1.LockType.none;
        select.col(this.toName, this.toName, a);
        if (unique.keys !== undefined) {
            select.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atomUnique, false, a))
                .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, b))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField('i', a)));
            select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('base', b), new sql_1.ExpNum(unique.id)), new sql_1.ExpEQ(new sql_1.ExpField('ext', b), new sql_1.ExpVar(FuncUniqueTo.keyId)), new sql_1.ExpEQ(new sql_1.ExpField(this.fromName, a), new sql_1.ExpVar(this.param))));
        }
        else {
            select.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atomUnique, false, a));
            select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', a), new sql_1.ExpVar(FuncUniqueTo.keyId)), new sql_1.ExpEQ(new sql_1.ExpField(this.fromName, a), new sql_1.ExpVar(this.param))));
        }
        let iff = this.factory.createIf();
        ifParamNotNull.then(iff);
        iff.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar(this.toName));
        let ioStatementBuilder = new IOStatementBuilder_1.IOStatementBuilder(this.factory);
        const appendErr = ioStatementBuilder.transErrorAppend(new sql_1.ExpNum(this.ioAppID.id), this.fromErrName, this.param);
        iff.then(appendErr);
        let ret = this.factory.createReturn();
        statements.push(ret);
        ret.returnVar = this.toName;
    }
}
FuncUniqueTo.keyId = '$key'; // In Out other site ID
FuncUniqueTo.atomPhraseId = '$atomPhraseId';
class FuncUniqueFromNo extends FuncUniqueTo {
    constructor() {
        super(...arguments);
        this.fromName = 'x';
        this.fromErrName = 'no';
        this.toName = 'atom';
    }
    fromField() { return (0, il_1.charField)(this.param, 100); }
    toField() { return (0, il_1.bigIntField)(this.toName); }
}
exports.FuncUniqueFromNo = FuncUniqueFromNo;
class FuncUniqueToNo extends FuncUniqueTo {
    constructor() {
        super(...arguments);
        this.fromName = 'atom';
        this.fromErrName = 'atom';
        this.toName = 'x';
    }
    fromField() { return (0, il_1.bigIntField)(this.param); }
    toField() { return (0, il_1.charField)(this.toName, 100); }
}
exports.FuncUniqueToNo = FuncUniqueToNo;
class FuncTo {
    constructor(factory, func) {
        this.param = 'param';
        this.factory = factory;
        this.func = func;
    }
    build() {
        const { parameters, statements } = this.func;
        parameters.push((0, il_1.bigIntField)(FuncTo.appID), // IOApp.ID
        this.fromField());
        let declare = this.factory.createDeclare();
        statements.push(declare);
        declare.vars(this.toField());
        let ifParamNotNull = this.factory.createIf();
        statements.push(ifParamNotNull);
        ifParamNotNull.cmp = new sql_1.ExpIsNotNull(new sql_1.ExpVar(this.param));
        let select = this.factory.createSelect();
        ifParamNotNull.then(select);
        select.toVar = true;
        select.lock = select_1.LockType.none;
        select.col(this.toName, this.toName);
        select.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.IOAppAtom, false));
        select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('appID'), new sql_1.ExpVar(FuncTo.appID)), new sql_1.ExpEQ(new sql_1.ExpField(this.fromName), new sql_1.ExpVar(this.param))));
        let iff = this.factory.createIf();
        ifParamNotNull.then(iff);
        iff.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar(this.toName));
        let ioStatementBuilder = new IOStatementBuilder_1.IOStatementBuilder(this.factory);
        const insertErr = ioStatementBuilder.transErrorInsert(new sql_1.ExpVar('appID'), this.fromName, this.param);
        iff.then(insertErr);
        let ret = this.factory.createReturn();
        statements.push(ret);
        ret.returnVar = this.toName;
    }
}
FuncTo.appID = 'appID';
class FuncNoToAtom extends FuncTo {
    constructor() {
        super(...arguments);
        this.fromName = 'no';
        this.toName = 'atom';
    }
    fromField() { return (0, il_1.charField)(this.param, 100); }
    toField() { return (0, il_1.bigIntField)(this.toName); }
}
exports.FuncNoToAtom = FuncNoToAtom;
class FuncAtomToNo extends FuncTo {
    constructor() {
        super(...arguments);
        this.fromName = 'atom';
        this.toName = 'no';
    }
    fromField() { return (0, il_1.bigIntField)(this.param); }
    toField() { return (0, il_1.charField)(this.toName, 100); }
}
exports.FuncAtomToNo = FuncAtomToNo;
//# sourceMappingURL=FuncTo.js.map