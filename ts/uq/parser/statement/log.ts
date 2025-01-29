import { Space } from '../space';
import { LogStatement, ValueExpression } from '../../il';
import { PStatement } from '../PStatement';
import { PContext } from '../pContext';

export class PLogStatement extends PStatement {
    private logStatement: LogStatement;
    constructor(logStatement: LogStatement, context: PContext) {
        super(logStatement, context);
        this.logStatement = logStatement;
    }

    protected _parse() {
        // LOG xxx subject xxx; 前面是content
        if (this.ts.isKeyword('error') === true) {
            this.ts.readToken();
            this.logStatement.isError = true;
        }
        let val = new ValueExpression();
        val.parser(this.context).parse();
        this.logStatement.content = val;
        if (this.ts.isKeyword('subject') === true) {
            this.ts.readToken();
            let val = new ValueExpression();
            val.parser(this.context).parse();
            this.logStatement.subject = val;
        }
    }

    scan(space: Space): boolean {
        let ok = true;
        let { subject, content } = this.logStatement;
        if (subject) {
            if (subject.pelement.scan(space) === false) ok = false;
        }
        if (content) {
            if (content.pelement.scan(space) === false) ok = false;
        }
        return ok;
    }
}
