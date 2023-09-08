import { OpSearch, OpSpecId, OpSpecValue, ValueExpression } from '../../il';
import { PElement } from '../element';
import { Space } from '../space';
import { PContext } from '../pContext';
import { Token } from '../tokens';

export class POpSpecId extends PElement<OpSpecId> {
    constructor(opSpecId: OpSpecId, context: PContext) {
        super(opSpecId, context);
    }
    _parse() {
        let expSpec = this.context.parse(ValueExpression);
        this.ts.passToken(Token.COMMA);
        let expAtom = this.context.parse(ValueExpression);
        this.ts.passToken(Token.COMMA);
        let expValues = this.context.parse(ValueExpression);
        this.ts.passToken(Token.RPARENTHESE);
        this.element.spec = expSpec;
        this.element.atom = expAtom;
        this.element.values = expValues;
    }
    scan(space: Space): boolean {
        let ok = true;
        let { atom, spec, values } = this.element;
        if (atom.pelement.scan(space) === false) ok = false;
        if (spec.pelement.scan(space) === false) ok = false;
        if (values.pelement.scan(space) === false) ok = false;
        return ok;
    }
}

export class POpSpecValue extends PElement<OpSpecValue> {
    constructor(opSpecValue: OpSpecValue, context: PContext) {
        super(opSpecValue, context);
    }

    _parse() {
        let expId = this.context.parse(ValueExpression);
        this.element.id = expId;
        this.ts.passToken(Token.RPARENTHESE);
    }

    scan(space: Space): boolean {
        let ok = true;
        let { id } = this.element;
        if (id.pelement.scan(space) === false) ok = false;
        return ok;
    }
}
