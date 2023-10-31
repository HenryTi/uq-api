import { VarOperand, OpMatch, ValueExpression } from '../../il/Exp';
import { PElement } from '../element';
import { Space } from '../space';
import { Token } from '../tokens';
import { PContext } from '../pContext';

export class PMatchOperand extends PElement {
    opMatch: OpMatch;
    constructor(opMatch: OpMatch, context: PContext) {
        super(opMatch, context);
        this.opMatch = opMatch;
    }

    _parse() {
        this.ts.assertToken(Token.LPARENTHESE);
        this.ts.readToken();
        let varOperands: VarOperand[] = [];
        while (true) {
            if (this.ts.token !== Token.VAR) {
                this.ts.expectToken(Token.VAR);
                break;
            }
            let varOperand = new VarOperand();
            varOperand._var.push(this.ts.lowerVar);
            this.ts.readToken();
            let parser = varOperand.parser(this.context);
            parser.parse();
            varOperands.push(varOperand);
            if (this.ts.token as any === Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            if (this.ts.token as any !== Token.COMMA) {
                this.ts.expectToken(Token.COMMA, Token.RPARENTHESE);
                break;
            }
            this.ts.readToken();
        }
        this.ts.assertKey('against');
        this.ts.readToken();
        this.ts.assertToken(Token.LPARENTHESE);
        this.ts.readToken();
        let expValue = new ValueExpression();
        let parser = expValue.parser(this.context);
        parser.parse();
        let isBoolean = false;
        if (this.ts.lowerVar === 'in') {
            this.ts.readToken();
            this.ts.assertKey('boolean');
            this.ts.readToken();
            this.ts.assertKey('mode');
            this.ts.readToken();
            isBoolean = true;
        }
        this.ts.assertToken(Token.RPARENTHESE);
        this.ts.readToken();
        this.opMatch.varOperands = varOperands;
        this.opMatch.isBoolean = isBoolean;
        this.opMatch.against = expValue;
    }

    scan(space: Space): boolean {
        let ok = true;
        let { varOperands, against } = this.opMatch;
        for (let varOperand of varOperands) {
            if (varOperand.pelement.scan(space) === false) {
                ok = false;
            }
        }
        if (against.pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
}
