import { PElement } from '../element';
import { Space } from '../space';
import { PContext } from '../pContext';
import { OpUqDefinedFunction } from '../../il';

export class POpUqDefinedFunction extends PElement {
    protected readonly opFunc: OpUqDefinedFunction;
    constructor(opFunc: OpUqDefinedFunction, context: PContext) {
        super(opFunc, context);
        this.opFunc = opFunc;
    }

    _parse() {
    }

    scan(space: Space): boolean {
        let ok = true;
        let { func, paramCount } = this.opFunc;
        let f = space.uq.funcs[func];
        if (f === undefined) {
            this.log(`function '${func}' is not defined`);
            ok = false;
        }
        else {
            let len = f.fields.length;
            if (len !== paramCount) {
                this.log(`function '${func}' parameters number is ${len}`);
                ok = false;
            }
        }
        return ok;
    }
}
