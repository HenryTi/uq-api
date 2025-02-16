import { BizExpOperand, OpSearch, ValueExpression } from '../../il';
import { PElement } from '../element';
import { Space } from '../space';
import { PContext } from '../pContext';
import { Token } from '../tokens';

export class POpSearch extends PElement<OpSearch> {
    constructor(opSearch: OpSearch, context: PContext) {
        super(opSearch, context);
    }
    _parse() {
        let values = this.element.values = [];
        for (; ;) {
            let value = new ValueExpression();
            value.parser(this.context).parse();
            values.push(value);
            if (this.ts.token !== Token.COMMA) break;
            this.ts.readToken();
        }
        const likes = ['on', 'like'];
        if (this.ts.isKeywords(...likes) === false) {
            this.ts.expect(...likes);
        }
        this.ts.readToken();
        let key = this.element.key = new ValueExpression();
        key.parser(this.context).parse();
        if (this.ts.token != Token.RPARENTHESE) {
            this.expectToken(Token.RPARENTHESE);
        }
        this.ts.readToken();
    }
    scan(space: Space): boolean {
        let ok = true;
        let { key, values } = this.element;
        if (key.pelement.scan(space) === false) ok = false;
        for (let value of values) {
            if (value.pelement.scan(space) === false) {
                ok = false;
            }
            else {
                let atoms = value.getAtoms();
                if (atoms.length === 1) {
                    let atom0 = atoms[0];
                    if (atom0.type === 'bizexp') {
                        let bizExpOperand = atom0 as BizExpOperand;
                        bizExpOperand.bizExp.inSearch = true;
                    }
                }
            }
        }
        return ok;
    }
}
