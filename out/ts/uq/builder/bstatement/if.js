"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BReturnEndStatement = exports.BReturnStartStatement = exports.BReturnStatement = exports.BContinueStatement = exports.BBreakStatement = exports.BIfStatement = void 0;
const bstatement_1 = require("./bstatement");
const sqls_1 = require("./sqls");
const sql_1 = require("../sql");
class BIfStatement extends bstatement_1.BStatement {
    head(sqls) {
        let { then: ifThen, else: ifElse, elseIfs } = this.istatement;
        sqls.head(ifThen.statements);
        if (elseIfs !== undefined) {
            elseIfs.forEach(elseIf => sqls.head(elseIf.statements.statements));
        }
        if (ifElse !== undefined) {
            sqls.head(ifElse.statements);
        }
    }
    foot(sqls) {
        let { then: ifThen, else: ifElse, elseIfs } = this.istatement;
        sqls.foot(ifThen.statements);
        if (elseIfs !== undefined) {
            elseIfs.forEach(elseIf => sqls.foot(elseIf.statements.statements));
        }
        if (ifElse !== undefined) {
            sqls.foot(ifElse.statements);
        }
    }
    body(sqls) {
        let { factory } = this.context;
        let _if = factory.createIf();
        _if.cmp = (0, sql_1.convertExp)(this.context, this.istatement.condition);
        let thenSqls = new sqls_1.Sqls(sqls.context, _if.thenStatements);
        let { then: ifThen, else: ifElse, elseIfs } = this.istatement;
        thenSqls.body(ifThen.statements);
        if (elseIfs !== undefined) {
            elseIfs.forEach(elseIf => {
                let { condition, statements } = elseIf;
                let sqlStatments = new sql_1.Statements();
                let elseIfSqls = new sqls_1.Sqls(sqls.context, sqlStatments.statements);
                elseIfSqls.body(statements.statements);
                _if.elseIf((0, sql_1.convertExp)(this.context, condition), sqlStatments);
            });
        }
        if (ifElse !== undefined) {
            let elseSqls = new sqls_1.Sqls(sqls.context, _if.elseStatements);
            elseSqls.body(ifElse.statements);
            _if.else(...elseSqls.statements);
        }
        sqls.push(_if);
    }
}
exports.BIfStatement = BIfStatement;
class BBreakStatement extends bstatement_1.BStatement {
    body(sqls) {
        var _a;
        let factory = this.context.factory;
        let b = factory.createBreak();
        let { loop } = this.istatement;
        if ((_a = loop === null || loop === void 0 ? void 0 : loop.list) === null || _a === void 0 ? void 0 : _a.queue) {
            b.forQueueNo = String(loop.no);
        }
        else {
            b.no = loop.no;
        }
        sqls.push(b);
    }
}
exports.BBreakStatement = BBreakStatement;
class BContinueStatement extends bstatement_1.BStatement {
    body(sqls) {
        var _a;
        let factory = this.context.factory;
        let b = factory.createContinue();
        let { loop } = this.istatement;
        if ((_a = loop === null || loop === void 0 ? void 0 : loop.list) === null || _a === void 0 ? void 0 : _a.queue) {
            b.forQueueNo = String(loop.no);
        }
        else {
            b.no = loop.no;
        }
        sqls.push(b);
    }
}
exports.BContinueStatement = BContinueStatement;
class BReturnStatement extends bstatement_1.BStatement {
    body(sqls) {
        let factory = this.context.factory;
        let b = factory.createReturn();
        b.expVal = (0, sql_1.convertExp)(this.context, this.istatement.exp);
        sqls.push(b);
    }
}
exports.BReturnStatement = BReturnStatement;
class BReturnStartStatement extends bstatement_1.BStatement {
    body(sqls) {
        let factory = this.context.factory;
        let b = factory.createReturnBegin();
        sqls.push(b);
    }
}
exports.BReturnStartStatement = BReturnStartStatement;
class BReturnEndStatement extends bstatement_1.BStatement {
    body(sqls) {
        let factory = this.context.factory;
        let b = factory.createReturnEnd();
        sqls.push(b);
    }
}
exports.BReturnEndStatement = BReturnEndStatement;
//# sourceMappingURL=if.js.map