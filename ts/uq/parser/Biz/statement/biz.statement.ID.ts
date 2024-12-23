import { Space } from '../../space';
import { ValueExpression, BizAct, VarPointer, BizStatementID, CompareExpression } from '../../../il';
import { Token } from '../../tokens';
import { PBizStatementSub } from './biz.statement.sub';

export abstract class PBizStatementID<A extends BizAct, T extends BizStatementID<A>> extends PBizStatementSub<A, T> {
    protected readonly entityCase: { entityName: string; condition: CompareExpression; }[] = [];
    protected toVar: string;
    protected inVals: ValueExpression[] = [];
    protected override _parse(): void {
        this.parseIDEntity();
        this.ts.passKey('in');
        this.ts.passToken(Token.EQU);
        this.parseUnique();
        this.parseTo();
    }

    protected parseIDEntity() {
        if (this.ts.token === Token.LPARENTHESE) {
            this.ts.readToken();
            for (; ;) {
                this.ts.passKey('when');
                let condition = new CompareExpression();
                this.context.parseElement(condition);
                this.ts.passKey('then');
                let entityName = this.ts.passVar();
                this.entityCase.push({ condition, entityName });
                if (this.ts.isKeyword('else') === true) {
                    this.ts.readToken();
                    entityName = this.ts.passVar();
                    this.entityCase.push({ entityName, condition: undefined });
                    break;
                }
            }
            this.ts.passToken(Token.RPARENTHESE);
        }
        else {
            this.entityCase.push({ entityName: this.ts.passVar(), condition: undefined });
        }
    }

    protected parseUnique() {
        if (this.ts.token === Token.LPARENTHESE) {
            this.ts.readToken();
            for (; ;) {
                let val = new ValueExpression();
                this.context.parseElement(val);
                this.inVals.push(val);
                const { token } = this.ts;
                if (token === Token.COMMA as any) {
                    this.ts.readToken();
                    continue;
                }
                if (token === Token.RPARENTHESE as any) {
                    this.ts.readToken();
                    break;
                }
                this.ts.expectToken(Token.COMMA, Token.RPARENTHESE);
            }
        }
        else {
            let val = new ValueExpression();
            this.context.parseElement(val);
            this.inVals.push(val);
        }
    }

    protected parseTo() {
        this.ts.passKey('to');
        this.toVar = this.ts.passVar();
    }

    override scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
        }
        this.element.toVar = space.varPointer(this.toVar, false) as VarPointer;
        if (this.element.toVar === undefined) {
            ok = false;
            this.log(`${this.toVar} is not defined`);
        }
        for (let inVal of this.inVals) {
            if (inVal.pelement.scan(space) === false) {
                ok = false;
            }
        }
        this.element.inVals = this.inVals;
        return ok;
    }
}

