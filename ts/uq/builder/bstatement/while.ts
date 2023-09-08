import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { While } from '../../il';
import { ExpCmp, convertExp } from '../sql';

export class BWhileStatement extends BStatement {
    protected istatement: While;
    head(sqls: Sqls) {
        sqls.head(this.istatement.statements.statements);
    }
    foot(sqls: Sqls) {
        sqls.foot(this.istatement.statements.statements);
    }
    body(sqls: Sqls) {
        let { factory } = this.context;
        let whileLoop = factory.createWhile();
        whileLoop.no = this.istatement.no;
        whileLoop.cmp = convertExp(this.context, this.istatement.condition) as ExpCmp;
        let loopSqls = new Sqls(sqls.context, whileLoop.statements.statements);
        loopSqls.body(this.istatement.statements.statements);
        sqls.push(whileLoop);
    }
}

