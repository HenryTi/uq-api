"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizDetailActSubBud = exports.BizDetailActSubPend = exports.PendValueCalc = exports.PendAct = exports.BizDetailActSubStatement = exports.BizDetailActStatement = void 0;
const parser = require("../../parser");
const statement_1 = require("./statement");
class BizDetailActStatement extends statement_1.Statement {
    get type() { return 'bizstatement'; }
    db(db) { return db.bizDetailActStatement(this); }
    parser(context) { return new parser.PBizDetailActStatement(this, context); }
    setNo(no) {
        this.no = no;
        this.sub.setNo(no);
    }
}
exports.BizDetailActStatement = BizDetailActStatement;
class BizDetailActSubStatement extends statement_1.Statement {
}
exports.BizDetailActSubStatement = BizDetailActSubStatement;
// 可以发送sheet主表，也可以是Detail
var PendAct;
(function (PendAct) {
    PendAct[PendAct["del"] = 1] = "del";
    PendAct[PendAct["set"] = 2] = "set";
    PendAct[PendAct["goto"] = 3] = "goto";
})(PendAct = exports.PendAct || (exports.PendAct = {}));
var PendValueCalc;
(function (PendValueCalc) {
    PendValueCalc[PendValueCalc["equ"] = 1] = "equ";
    PendValueCalc[PendValueCalc["add"] = 2] = "add";
    PendValueCalc[PendValueCalc["sub"] = 3] = "sub";
})(PendValueCalc = exports.PendValueCalc || (exports.PendValueCalc = {}));
class BizDetailActSubPend extends BizDetailActSubStatement {
    constructor(bizStatement) {
        super(bizStatement);
        this.bizStatement = bizStatement;
    }
    get type() { return 'bizpend'; }
    parser(context) {
        return new parser.PBizDetailActSubPend(this, context);
    }
    db(db) { return db.bizDetailActSubPend(this); }
}
exports.BizDetailActSubPend = BizDetailActSubPend;
class BizDetailActSubBud extends BizDetailActSubStatement {
    constructor(bizStatement) {
        super(bizStatement);
        this.bizStatement = bizStatement;
    }
    get type() { return 'bizbud'; }
    parser(context) {
        return new parser.PBizDetailActSubBud(this, context);
    }
    db(db) { return db.bizDetailActSubSubject(this); }
}
exports.BizDetailActSubBud = BizDetailActSubBud;
//# sourceMappingURL=biz.js.map