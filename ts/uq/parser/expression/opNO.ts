import { ID, OpNO, ValueExpression } from '../../il';
import { PElement } from '../element';
import { Space } from '../space';
import { PContext } from '../pContext';
import { Token } from '../tokens';

export class POpNO extends PElement {
    private entity: string;
    private opNO: OpNO;
    constructor(opNO: OpNO, context: PContext) {
        super(opNO, context);
        this.opNO = opNO;
    }
    _parse() {
		if (this.ts.token !== Token.RPARENTHESE) {
			if (this.ts.token !== Token.VAR) {
				this.ts.expect('ID名字');
			}
			this.entity = this.ts.lowerVar;
			this.ts.readToken();
			if (this.ts.isKeyword('stamp') === true
				|| this.ts.token === Token.COMMA) 
			{
				this.ts.readToken();
				let val = new ValueExpression();
				val.parser(this.context).parse();
				this.opNO.stamp = val;
			}
			if (this.ts.token as any !== Token.RPARENTHESE) {
				this.ts.expectToken(Token.RPARENTHESE);
			}
		}
		this.ts.readToken();
    }
    
    scan(space:Space):boolean {
		let ok = true;
		if (this.entity !== undefined) {
			let entity = space.getEntityTable(this.entity);
			if (entity === undefined || entity.type !== 'id') {
				this.log('['+this.entity + ']必须是ID');
				return false;
			}
			this.opNO.id = entity as ID;
		}
		let {stamp} = this.opNO;
		if (stamp) {
			if (stamp.pelement.scan(space) === false) {
				ok = false;
			}
		}
        return ok;
    }
}
