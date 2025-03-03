"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizStatementError = exports.BizStatementOut = exports.BizStatementTie = exports.BizStatementFork = exports.BizStatementAtom = exports.BizStatementID = exports.BizStatementSheet = exports.BizStatementBook = exports.BizStatementInPend = exports.BizStatementBinPend = exports.BizStatementPend = exports.BizStatementState = exports.EnumStateTo = exports.BizStatementSub = exports.BizStatementIn = exports.BizStatementBinState = exports.BizStatementBin = exports.BizStatement = void 0;
const builder_1 = require("../../../builder");
const parser = require("../../../parser");
const statement_1 = require("../../statement");
class BizStatement extends statement_1.Statement {
    get type() { return 'bizstatement'; }
    constructor(parent, bizAct) {
        super(parent);
        this.bizAct = bizAct;
    }
    setNo(no) {
        this.no = no;
        this.sub.setNo(no);
    }
    db(db) { return this.sub.db(db); }
}
exports.BizStatement = BizStatement;
class BizStatementBin extends BizStatement {
    parser(context) { return new parser.PBizStatementBin(this, context); }
}
exports.BizStatementBin = BizStatementBin;
class BizStatementBinState extends BizStatement {
    parser(context) { return new parser.PBizStatementBinState(this, context); }
}
exports.BizStatementBinState = BizStatementBinState;
class BizStatementIn extends BizStatement {
    parser(context) { return new parser.PBizStatementIn(this, context); }
}
exports.BizStatementIn = BizStatementIn;
class BizStatementSub extends statement_1.Statement {
    constructor(bizStatement) {
        super(bizStatement);
        this.bizStatement = bizStatement;
    }
}
exports.BizStatementSub = BizStatementSub;
var EnumStateTo;
(function (EnumStateTo) {
    EnumStateTo[EnumStateTo["start"] = 0] = "start";
    EnumStateTo[EnumStateTo["end"] = 1] = "end";
    EnumStateTo[EnumStateTo["back"] = 2] = "back";
})(EnumStateTo || (exports.EnumStateTo = EnumStateTo = {}));
class BizStatementState extends BizStatementSub {
    parser(context) {
        return new parser.PBizStatementState(this, context);
    }
    db(db) {
        return new builder_1.BBizStatementState(db, this);
    }
}
exports.BizStatementState = BizStatementState;
class BizStatementPend extends BizStatementSub {
    constructor() {
        super(...arguments);
        this.sets = [];
    }
    get type() { return 'bizpend'; }
}
exports.BizStatementPend = BizStatementPend;
class BizStatementBinPend extends BizStatementPend {
    parser(context) {
        return new parser.PBizStatementBinPend(this, context);
    }
    db(db) { return new builder_1.BBizStatementBinPend(db, this); }
}
exports.BizStatementBinPend = BizStatementBinPend;
class BizStatementInPend extends BizStatementPend {
    parser(context) {
        return new parser.PBizStatementInPend(this, context);
    }
    db(db) { return new builder_1.BBizStatementInPend(db, this); /* db.bizInActSubPend(this); */ }
}
exports.BizStatementInPend = BizStatementInPend;
class BizStatementBook extends BizStatementSub {
    parser(context) {
        return new parser.PBizStatementBook(this, context);
    }
    db(db) { return new builder_1.BBizStatementBook(db, this); }
}
exports.BizStatementBook = BizStatementBook;
class BizStatementSheet extends BizStatementSub {
    constructor() {
        super(...arguments);
        this.fields = {};
        this.buds = {};
    }
    parser(context) {
        return new parser.PBizStatementSheet(this, context);
    }
    db(db) { return new builder_1.BBizStatementSheet(db, this); }
}
exports.BizStatementSheet = BizStatementSheet;
class BizStatementID extends BizStatementSub {
    constructor() {
        super(...arguments);
        this.sets = new Map();
    }
}
exports.BizStatementID = BizStatementID;
class BizStatementAtom extends BizStatementID {
    parser(context) {
        return new parser.PBizStatementAtom(this, context);
    }
    db(db) { return new builder_1.BBizStatementAtom(db, this); }
}
exports.BizStatementAtom = BizStatementAtom;
class BizStatementFork extends BizStatementID {
    parser(context) {
        return new parser.PBizStatementFork(this, context);
    }
    db(db) { return new builder_1.BBizStatementFork(db, this); }
}
exports.BizStatementFork = BizStatementFork;
class BizStatementTie extends BizStatementSub {
    parser(context) {
        return new parser.PBizStatementTie(this, context);
    }
    db(db) { return new builder_1.BBizStatementTie(db, this); }
}
exports.BizStatementTie = BizStatementTie;
class BizStatementOut extends BizStatementSub {
    constructor() {
        super(...arguments);
        this.tos = [];
        this.sets = {};
    }
    parser(context) {
        return new parser.PBizStatementOut(this, context);
    }
    db(db) { return new builder_1.BBizStatementOut(db, this); }
}
exports.BizStatementOut = BizStatementOut;
class BizStatementError extends BizStatementSub {
    parser(context) {
        return new parser.PBizStatementError(this, context);
    }
    db(db) { return new builder_1.BBizStatementError(db, this); }
}
exports.BizStatementError = BizStatementError;
//# sourceMappingURL=biz.statement.js.map