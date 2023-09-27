"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizDetailActSubTab = exports.BizDetailActSubPend = exports.BizDetailActSubStatement = exports.BizDetailActStatement = void 0;
const parser = require("../../parser");
const statement_1 = require("./statement");
class BizDetailActStatement extends statement_1.Statement {
    constructor(parent, bizDetailAct) {
        super(parent);
        this.bizDetailAct = bizDetailAct;
    }
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
class BizDetailActSubTab extends BizDetailActSubStatement {
    constructor(bizStatement) {
        super(bizStatement);
        this.bizStatement = bizStatement;
    }
    get type() { return 'bizbud'; }
    parser(context) {
        return new parser.PBizDetailActSubTab(this, context);
    }
    db(db) { return db.bizDetailActSubSubject(this); }
}
exports.BizDetailActSubTab = BizDetailActSubTab;
//# sourceMappingURL=biz.js.map