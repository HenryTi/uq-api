import {Of} from '../../il';
import { Token } from '../tokens';
import {PDataType} from './datatype';
import {PContext} from '../pContext';

export class POf extends PDataType {
    private of: Of;
    constructor(of: Of, context: PContext) {
        super(of, context);
        this.of = of;
    }

    protected _parse() {
        this.ts.assertToken(Token.VAR);
        this.of.owner = this.ts.lowerVar;
        this.ts.readToken();
        this.ts.assertToken(Token.DOT);
        this.ts.readToken();
        this.ts.assertToken(Token.VAR);
        this.of.arr = this.ts.lowerVar;
        this.ts.readToken();
    }
}
