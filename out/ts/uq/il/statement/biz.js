"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizBinTitleStatement = exports.BizBinPendStatement = exports.BizBinSubStatement = exports.BizBinActStatement = void 0;
const parser = require("../../parser");
const Statement_1 = require("./Statement");
class BizBinActStatement extends Statement_1.Statement {
    constructor(parent, bizDetailAct) {
        super(parent);
        this.bizDetailAct = bizDetailAct;
    }
    get type() { return 'bizstatement'; }
    db(db) { return db.bizDetailActStatement(this); }
    parser(context) { return new parser.PBizBinStatement(this, context); }
    setNo(no) {
        this.no = no;
        this.sub.setNo(no);
    }
}
exports.BizBinActStatement = BizBinActStatement;
class BizBinSubStatement extends Statement_1.Statement {
}
exports.BizBinSubStatement = BizBinSubStatement;
class BizBinPendStatement extends BizBinSubStatement {
    constructor(bizStatement) {
        super(bizStatement);
        this.bizStatement = bizStatement;
    }
    get type() { return 'bizpend'; }
    parser(context) {
        return new parser.PBizBinPendStatement(this, context);
    }
    db(db) { return db.bizDetailActSubPend(this); }
}
exports.BizBinPendStatement = BizBinPendStatement;
class BizBinTitleStatement extends BizBinSubStatement {
    constructor(bizStatement) {
        super(bizStatement);
        this.bizStatement = bizStatement;
    }
    get type() { return 'biztitle'; }
    parser(context) {
        return new parser.PBizBinTitleStatement(this, context);
    }
    db(db) { return db.bizDetailActSubSubject(this); }
}
exports.BizBinTitleStatement = BizBinTitleStatement;
//# sourceMappingURL=biz.js.map