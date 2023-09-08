import { OpTypeof, ValueExpression } from '../../il';
import { PElement } from '../element';
import { Space } from '../space';
import { PContext } from '../pContext';
import { Token } from '../tokens';
import { ExpressionSpace } from './expression';

export class POpTypeof extends PElement {
    private entity: string;
    private opTypeof: OpTypeof;
    constructor(opTypeof: OpTypeof, context: PContext) {
        super(opTypeof, context);
        this.opTypeof = opTypeof;
    }
    _parse() {
        if (this.ts.token === Token.LPARENTHESE) {
            this.ts.readToken();
            let val = new ValueExpression();
            val.parser(this.context).parse();
            this.opTypeof.val = val;
            if (this.ts.token as any !== Token.RPARENTHESE) {
                this.ts.expectToken(Token.RPARENTHESE);
            }
            this.ts.readToken();
            return;
        }
        if (this.ts.token !== Token.VAR) {
            this.ts.expect('entity名字');
        }
        this.entity = this.ts.lowerVar;
        this.ts.readToken();
    }

    scan(space: Space): boolean {
        if (this.entity) {
            let entity = space.getEntity(this.entity);
            if (entity === undefined) {
                this.log('[' + this.entity + ']必须是Entity');
                return false;
            }
            this.opTypeof.entity = entity;
            return true;
        }
        let { val } = this.opTypeof;
        let { pelement } = val;
        let theSpace = new ExpressionSpace(space);
        return pelement.scan(theSpace);
    }
}
