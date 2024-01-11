"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizTitleStatement = exports.BizInPendStatement = exports.BizBinPendStatement = exports.BizPendStatement = exports.BizActSubStatement = exports.BizInActStatement = exports.BizBinActStatement = exports.BizActStatement = void 0;
const parser = require("../../parser");
const Statement_1 = require("./Statement");
class BizActStatement extends Statement_1.Statement {
    constructor(parent, bizAct) {
        super(parent);
        this.bizAct = bizAct;
    }
}
exports.BizActStatement = BizActStatement;
class BizBinActStatement extends BizActStatement {
    get type() { return 'bizstatement'; }
    db(db) { return db.bizBinActStatement(this); }
    parser(context) { return new parser.PBizBinActStatement(this, context); }
    setNo(no) {
        this.no = no;
        this.sub.setNo(no);
    }
}
exports.BizBinActStatement = BizBinActStatement;
class BizInActStatement extends BizActStatement {
    get type() { return 'bizstatement'; }
    db(db) { return db.bizInActStatement(this); }
    parser(context) { return new parser.PBizInActStatement(this, context); }
    setNo(no) {
        this.no = no;
        this.sub.setNo(no);
    }
}
exports.BizInActStatement = BizInActStatement;
class BizActSubStatement extends Statement_1.Statement {
}
exports.BizActSubStatement = BizActSubStatement;
class BizPendStatement extends BizActSubStatement {
    constructor(bizStatement) {
        super(bizStatement);
        this.sets = [];
        this.bizStatement = bizStatement;
    }
    get type() { return 'bizpend'; }
}
exports.BizPendStatement = BizPendStatement;
class BizBinPendStatement extends BizPendStatement {
    parser(context) {
        return new parser.PBizBinPendStatement(this, context);
    }
    db(db) { return db.bizBinActSubPend(this); }
}
exports.BizBinPendStatement = BizBinPendStatement;
class BizInPendStatement extends BizPendStatement {
    parser(context) {
        return new parser.PBizInPendStatement(this, context);
    }
    db(db) { return db.bizInActSubPend(this); }
}
exports.BizInPendStatement = BizInPendStatement;
class BizTitleStatement extends BizActSubStatement {
    constructor(bizStatement) {
        super(bizStatement);
        this.bizStatement = bizStatement;
    }
    get type() { return 'biztitle'; }
    parser(context) {
        return new parser.PBizTitleStatement(this, context);
    }
    db(db) { return db.bizActSubTitle(this); }
}
exports.BizTitleStatement = BizTitleStatement;
//# sourceMappingURL=biz.js.map