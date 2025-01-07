import { EnumFuncBetweenCompare, EnumFuncBetweenType, FuncBetween, ValueExpression } from '../../il';
import { PElement } from '../element';
import { Space } from '../space';
import { PContext } from '../pContext';
import { Token } from '../tokens';

export class PFuncBetween extends PElement<FuncBetween> {
    constructor(funcBetween: FuncBetween, context: PContext) {
        super(funcBetween, context);
    }
    _parse() {
        let type = this.ts.passKey();
        this.element.betweenType = EnumFuncBetweenType[type as keyof typeof EnumFuncBetweenType];
        this.context.parseElement(this.element.value = new ValueExpression());
        if (this.ts.token !== Token.COMMA) {
            this.ts.expectToken(Token.COMMA);
        }
        this.ts.readToken();
        if (this.ts.token !== Token.COMMA) {
            let compare: EnumFuncBetweenCompare;
            switch (this.ts.token) {
                default:
                    compare = EnumFuncBetweenCompare.inclusive;
                    break;
                case Token.Exclamation:
                    compare = EnumFuncBetweenCompare.exclusive;
                    this.ts.readToken();
                    break;
                case Token.SHARP:
                    compare = EnumFuncBetweenCompare.inclusive;
                    this.ts.readToken();
                    break;
            }
            this.element.leftCompare = compare;
            this.context.parseElement(this.element.left = new ValueExpression());
        }
        if (this.ts.token === Token.COMMA) {
            this.ts.readToken();
            let compare: EnumFuncBetweenCompare;
            switch (this.ts.token as any) {
                default:
                    compare = EnumFuncBetweenCompare.exclusive;
                    break;
                case Token.Exclamation:
                    compare = EnumFuncBetweenCompare.exclusive;
                    this.ts.readToken();
                    break;
                case Token.SHARP:
                    compare = EnumFuncBetweenCompare.inclusive;
                    this.ts.readToken();
                    break;
            }
            this.element.rightCompare = compare;
            this.context.parseElement(this.element.right = new ValueExpression());
        }
        if (this.ts.token != Token.RPARENTHESE) {
            this.expectToken(Token.RPARENTHESE);
        }
        this.ts.readToken();
    }
    scan(space: Space): boolean {
        let ok = true;
        let { value, left, right } = this.element;
        if (value.pelement.scan(space) === false) ok = false;
        if (left !== undefined) {
            if (left.pelement.scan(space) === false) ok = false;
        }
        if (right !== undefined) {
            if (right.pelement.scan(space) === false) ok = false;
        }
        return ok;
    }
}
