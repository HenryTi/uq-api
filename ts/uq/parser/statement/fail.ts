import { Space } from '../space';
import { FailStatement } from '../../il';
import { PStatement } from '../PStatement';
import { PContext } from '../pContext';

export class PFail extends PStatement {
    fail: FailStatement;
    constructor(fail: FailStatement, context: PContext) {
        super(fail, context);
        this.fail = fail;
    }

    protected _parse() {
    }

    scan(space: Space): boolean {
        return true;
    }
}

