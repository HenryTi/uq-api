import { Token } from '../tokens';
import {Char} from '../../il';
import {PDataType} from './datatype';
import {PContext} from '../pContext';

export class PChar extends PDataType {
    private dt: Char;
    constructor(dt: Char, context: PContext) {
        super(dt, context);
        this.dt = dt;
    }
    protected _parse() {
        if (this.ts.token !== Token.LPARENTHESE) return;
        this.ts.readToken();
        if (this.ts.token !== Token.NUM as any) this.expect('整数');
        if (!this.ts.isInteger) this.expect('整数');
        this.dt.size = this.ts.dec;
        this.ts.readToken();
        if (this.ts.token !== Token.RPARENTHESE as any) this.expectToken(Token.RPARENTHESE);
        this.ts.readToken();
    }
}
