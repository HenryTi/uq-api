"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizStatementOut = exports.BizStatementSpec = exports.BizStatementAtom = exports.BizStatementID = exports.BizStatementDetail = exports.BizStatementSheet = exports.BizStatementSheetBase = exports.BizStatementTitle = exports.BizStatementInPend = exports.BizStatementBinPend = exports.BizStatementPend = exports.BizStatementSub = exports.BizStatementIn = exports.BizStatementBin = exports.BizStatement = void 0;
const builder_1 = require("../../builder");
const parser = require("../../parser");
const Statement_1 = require("./Statement");
// import { UseOut } from './use';
class BizStatement extends Statement_1.Statement {
    get type() { return 'bizstatement'; }
    constructor(parent, bizAct) {
        super(parent);
        this.bizAct = bizAct;
    }
    setNo(no) {
        this.no = no;
        this.sub.setNo(no);
    }
    db(db) { return this.sub.db(db); /* db.bizActStatement(this); */ }
}
exports.BizStatement = BizStatement;
class BizStatementBin extends BizStatement {
    parser(context) { return new parser.PBizStatementBin(this, context); }
}
exports.BizStatementBin = BizStatementBin;
class BizStatementIn extends BizStatement {
    parser(context) { return new parser.PBizStatementIn(this, context); }
}
exports.BizStatementIn = BizStatementIn;
class BizStatementSub extends Statement_1.Statement {
    constructor(bizStatement) {
        super(bizStatement);
        this.bizStatement = bizStatement;
    }
}
exports.BizStatementSub = BizStatementSub;
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
    db(db) { return new builder_1.BBizStatementBinPend(db, this); /* return db.bizBinActSubPend(this);*/ }
}
exports.BizStatementBinPend = BizStatementBinPend;
class BizStatementInPend extends BizStatementPend {
    parser(context) {
        return new parser.PBizStatementInPend(this, context);
    }
    db(db) { return new builder_1.BBizStatementInPend(db, this); /* db.bizInActSubPend(this); */ }
}
exports.BizStatementInPend = BizStatementInPend;
class BizStatementTitle extends BizStatementSub {
    parser(context) {
        return new parser.PBizStatementTitle(this, context);
    }
    db(db) { return new builder_1.BBizStatementTitle(db, this); }
}
exports.BizStatementTitle = BizStatementTitle;
class BizStatementSheetBase extends BizStatementSub {
    constructor() {
        super(...arguments);
        this.fields = {};
        this.buds = {};
    }
}
exports.BizStatementSheetBase = BizStatementSheetBase;
class BizStatementSheet extends BizStatementSheetBase {
    parser(context) {
        return new parser.PBizStatementSheet(this, context);
    }
    db(db) { return new builder_1.BBizStatementSheet(db, this); }
}
exports.BizStatementSheet = BizStatementSheet;
class BizStatementDetail extends BizStatementSheetBase {
    parser(context) {
        return new parser.PBizStatementDetail(this, context);
    }
    db(db) { return new builder_1.BBizStatementDetail(db, this); }
}
exports.BizStatementDetail = BizStatementDetail;
class BizStatementID extends BizStatementSub {
}
exports.BizStatementID = BizStatementID;
class BizStatementAtom extends BizStatementID {
    parser(context) {
        return new parser.PBizStatementAtom(this, context);
    }
    db(db) { return new builder_1.BBizStatementAtom(db, this); }
}
exports.BizStatementAtom = BizStatementAtom;
class BizStatementSpec extends BizStatementID {
    parser(context) {
        return new parser.PBizStatementSpec(this, context);
    }
    db(db) { return new builder_1.BBizStatementSpec(db, this); }
}
exports.BizStatementSpec = BizStatementSpec;
class BizStatementOut extends BizStatementSub {
    constructor() {
        super(...arguments);
        this.sets = {};
    }
    parser(context) {
        return new parser.PBizStatementOut(this, context);
    }
    db(db) { return new builder_1.BBizStatementOut(db, this); }
}
exports.BizStatementOut = BizStatementOut;
//# sourceMappingURL=biz.js.map