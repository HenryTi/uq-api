import {Dec} from '../../il';
import { Token } from '../tokens';
import {PDataType} from './datatype';
import {PContext} from '../pContext';

export class PDec extends PDataType {
    private dt: Dec;
    constructor(dt: Dec, context: PContext) {
        super(dt, context);
        dt.precision = 10;
        dt.scale = 2;
        this.dt = dt;
    }
    private sizeError(size:string, ...more:string[]) {
        this.error('decimal size error: ' + size, ...more);
    }
    protected _parse() {
        if (this.ts.token !== Token.LPARENTHESE) return;
        this.ts.readToken();
        if (this.ts.token !== Token.NUM as any || !this.ts.isInteger) 
            this.expect('整数');
        this.dt.precision = this.ts.dec;
        this.ts.readToken();
        if (this.ts.token === Token.RPARENTHESE as any) {
            this.ts.readToken();
            return;
        }
        if (this.ts.token !== Token.COMMA as any)
            this.expectToken(Token.COMMA);
        this.ts.readToken()
        if (this.ts.token !== Token.NUM as any || !this.ts.isInteger)
            this.expect('整数');

        this.dt.scale = this.ts.dec;
        this.ts.readToken();
        if (this.ts.token !== Token.RPARENTHESE as any)
            this.expectToken(Token.RPARENTHESE);

        this.ts.readToken();
    }
}
