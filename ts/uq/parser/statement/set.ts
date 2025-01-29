import { SetStatement, Select } from '../../il';
import { Space } from '../space';
import { Token } from '../tokens';
import { PContext } from '../pContext';
import { PStatement } from '../PStatement';

export class PSetStatement extends PStatement {
    set: SetStatement;
    constructor(set: SetStatement, context: PContext) {
        super(set, context);
        this.set = set;
    }

    protected _parse() {
        if (this.ts.isKeyword('out') === true) {
            this.ts.readToken();
            this.set.out = true;
        }
        let select = this.set.select = new Select();
        select.toVar = true;
        let parser = select.parser(this.context);
        parser.parse();
        if (this.ts.token === Token.SEMICOLON) this.ts.readToken();
    }

    scan(space: Space): boolean {
        let ok = true;
        let { select } = this.set;
        if (select.pelement.scan(space) === false) ok = false;
        return ok;
    }
}

