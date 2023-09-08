import { OpEntityId, OpEntityName, ValueExpression } from '../../il';
import { PElement } from '../element';
import { Space } from '../space';
import { PContext } from '../pContext';
import { Token } from '../tokens';
import { ExpressionSpace } from './expression';

export class POpEntityId extends PElement {
    private opEntityId: OpEntityId;
    constructor(opEntityId: OpEntityId, context: PContext) {
        super(opEntityId, context);
        this.opEntityId = opEntityId;
    }
    _parse() {
        let val = new ValueExpression();
        val.parser(this.context).parse();
        this.opEntityId.val = val;
        if (this.ts.token as any !== Token.RPARENTHESE) {
            this.ts.expectToken(Token.RPARENTHESE);
        }
        this.ts.readToken();
    }

    scan(space: Space): boolean {
        let { val } = this.opEntityId;
        let { pelement } = val;
        let theSpace = new ExpressionSpace(space);
        let ok = pelement.scan(theSpace);
        return ok;
    }
}

export class POpEntityName extends PElement {
    private opEntityName: OpEntityName;
    constructor(opEntityName: OpEntityName, context: PContext) {
        super(opEntityName, context);
        this.opEntityName = opEntityName;
    }
    _parse() {
        let val = new ValueExpression();
        val.parser(this.context).parse();
        this.opEntityName.val = val;
        if (this.ts.token as any !== Token.RPARENTHESE) {
            this.ts.expectToken(Token.RPARENTHESE);
        }
        this.ts.readToken();
    }

    scan(space: Space): boolean {
        let { val } = this.opEntityName;
        let { pelement } = val;
        let theSpace = new ExpressionSpace(space);
        let ok = pelement.scan(theSpace);
        return ok;
    }
}
