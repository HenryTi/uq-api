import {DataType, DateTime} from '../../il';
import {PDataType} from './datatype';
import {PContext} from '../pContext';
import { Token } from '../tokens';

export class PDateTime extends PDataType {
    private dt: DateTime;
    constructor(dt: DateTime, context: PContext) {
        super(dt, context);
        dt.precision = 0;
        this.dt = dt;
    }
    protected _parse() {
        if (this.ts.token !== Token.LPARENTHESE) return;
        this.ts.readToken();
        if (this.ts.token !== Token.NUM as any || !this.ts.isInteger) 
            this.expect('整数');
        this.dt.precision = this.ts.dec;
        this.ts.readToken();
        this.ts.assertToken(Token.RPARENTHESE);
        this.ts.readToken();
    }
}
