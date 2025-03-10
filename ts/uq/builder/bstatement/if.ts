import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { If, BreakStatement, ReturnStatement, ForEach, ContinueStatement } from '../../il';
import { Statements as SqlStatements, ExpCmp, convertExp, ExpVal } from '../sql';

export class BIfStatement extends BStatement<If> {
    override head(sqls: Sqls) {
        let { then: ifThen, else: ifElse, elseIfs } = this.istatement;
        sqls.head(ifThen.statements);
        if (elseIfs !== undefined) {
            elseIfs.forEach(elseIf => sqls.head(elseIf.statements.statements));
        }
        if (ifElse !== undefined) {
            sqls.head(ifElse.statements);
        }
    }
    override foot(sqls: Sqls) {
        let { then: ifThen, else: ifElse, elseIfs } = this.istatement;
        sqls.foot(ifThen.statements);
        if (elseIfs !== undefined) {
            elseIfs.forEach(elseIf => sqls.foot(elseIf.statements.statements));
        }
        if (ifElse !== undefined) {
            sqls.foot(ifElse.statements);
        }
    }
    override body(sqls: Sqls) {
        let { factory } = this.context;
        let _if = factory.createIf();
        _if.cmp = convertExp(this.context, this.istatement.condition) as ExpCmp;
        let thenSqls = new Sqls(sqls.context, _if.thenStatements);
        let { then: ifThen, else: ifElse, elseIfs } = this.istatement;
        thenSqls.body(ifThen.statements);
        if (elseIfs !== undefined) {
            elseIfs.forEach(elseIf => {
                let { condition, statements } = elseIf;
                let sqlStatments = new SqlStatements();
                let elseIfSqls = new Sqls(sqls.context, sqlStatments.statements);
                elseIfSqls.body(statements.statements);
                _if.elseIf(convertExp(this.context, condition) as ExpCmp, sqlStatments);
            });
        }
        if (ifElse !== undefined) {
            let elseSqls = new Sqls(sqls.context, _if.elseStatements);
            elseSqls.body(ifElse.statements);
            _if.else(...elseSqls.statements);
        }
        sqls.push(_if);
    }
}

export class BBreakStatement extends BStatement<BreakStatement> {
    override body(sqls: Sqls) {
        let factory = this.context.factory;
        let b = factory.createBreak();
        let { loop } = this.istatement;
        if (((loop as ForEach)?.list as any)?.queue) {
            b.forQueueNo = String(loop.no);
        }
        else {
            b.no = loop.no;
        }
        sqls.push(b);
    }
}

export class BContinueStatement extends BStatement<ContinueStatement> {
    override body(sqls: Sqls) {
        let factory = this.context.factory;
        let b = factory.createContinue();
        let { loop } = this.istatement;
        if (((loop as ForEach)?.list as any)?.queue) {
            b.forQueueNo = String(loop.no);
        }
        else {
            b.no = loop.no;
        }
        sqls.push(b);
    }
}

export class BReturnStatement extends BStatement<ReturnStatement> {
    override body(sqls: Sqls) {
        let factory = this.context.factory;
        let b = factory.createReturn();
        b.expVal = convertExp(this.context, this.istatement.exp) as ExpVal;
        sqls.push(b);
    }
}

export class BReturnStartStatement extends BStatement {
    override body(sqls: Sqls) {
        let factory = this.context.factory;
        let b = factory.createReturnBegin();
        sqls.push(b);
    }
}

export class BReturnEndStatement extends BStatement {
    override body(sqls: Sqls) {
        let factory = this.context.factory;
        let b = factory.createReturnEnd();
        sqls.push(b);
    }
}
