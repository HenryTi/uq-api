import { Space } from '../space';
import { ExecSqlStatement, ValueExpression, NamePointer } from '../../il';
import { PStatement } from './statement';
import { PContext } from '../pContext';

export class PExecSqlStatement extends PStatement {
    private execSqlStatement: ExecSqlStatement;
    private toVar: string;
    constructor(execSqlStatement: ExecSqlStatement, context: PContext) {
        super(execSqlStatement, context);
        this.execSqlStatement = execSqlStatement;
    }

    protected _parse() {
        let val = new ValueExpression();
        val.parser(this.context).parse();
        this.execSqlStatement.sql = val;
        if (this.ts.isKeyword('to') === true) {
            this.ts.readToken();
            this.toVar = this.ts.passVar();
        }
    }

    scan(space: Space): boolean {
        let ok = true;
        let { sql } = this.execSqlStatement;
        if (sql.pelement.scan(space) === false) ok = false;
        if (this.toVar) {
            this.execSqlStatement.toVar = this.toVar;
            this.execSqlStatement.toVarPointer = space.varPointer(this.toVar, false) as NamePointer;
        }
        return ok;
    }
}
