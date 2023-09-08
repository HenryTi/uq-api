import { OpUMinute, ValueExpression } from '../../il';
import { PElement } from '../element';
import { Space } from '../space';
import { PContext } from '../pContext';
import { Token } from '../tokens';

export class POpUMinute extends PElement<OpUMinute> {
    private stamp: ValueExpression;
    constructor(opUMinute: OpUMinute, context: PContext) {
        super(opUMinute, context);
    }
    _parse() {
        if (this.ts.token === Token.RPARENTHESE) {
            this.ts.readToken();
            return;
        }
        this.stamp = new ValueExpression();
        this.stamp.parser(this.context).parse();
        if (this.ts.token !== Token.RPARENTHESE as any) {
            this.ts.expectToken(Token.RPARENTHESE);
        }
        this.ts.readToken();
    }
    scan(space: Space): boolean {
        let ok = true;
        if (this.stamp && this.stamp.pelement) {
            if (this.stamp.pelement.scan(space) === true) {
                this.element.stamp = this.stamp;
            }
            else {
                ok = false;
            }
        }
        return ok;
    }
}
