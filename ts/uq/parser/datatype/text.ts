import { Token } from '../tokens';
import {Text} from '../../il';
import {PDataType} from './datatype';
import {PContext} from '../pContext';

const textTypes = ['tiny','small','medium','big', 'long'];
export class PText extends PDataType {
    private dt: Text;
    constructor(dt: Text, context: PContext) {
        super(dt, context);
        this.dt = dt;
    }
    protected _parse() {
        if (this.ts.token !== Token.LPARENTHESE) {
            this.dt.size = '';
            return true;
        }
        this.ts.readToken();
        if (textTypes.indexOf(this.ts.lowerVar) < 0) {
            this.expect(...textTypes);
            return false;
        }
		let v = this.ts._var;
		switch (v) {
			case 'long': v = 'big'; break;
			case 'small': v = ''; break;
		}
        this.dt.size = v as any; // === 'small'? '':v;
        this.ts.readToken();
        if (this.ts.token !== Token.RPARENTHESE as any) {
            this.expectToken(Token.RPARENTHESE);
        }
        this.ts.readToken();
    }
}
