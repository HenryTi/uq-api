import { Space } from '../../space';
import { BizAct, BizStatementFork, BizFork, ValueExpression } from '../../../il';
import { BizPhraseType } from '../../../il/Biz/BizPhraseType';
import { PBizStatementID } from './biz.statement.ID';
import { Token } from '../../tokens';

export class PBizStatementFork<A extends BizAct, T extends BizStatementFork<A>> extends PBizStatementID<A, BizFork, T> {
    protected override _parse(): void {
        if (this.ts.token === Token.VAR) {
            this.idName = this.ts.passVar();
            this.element.uniqueVals = this.parseValueArray();
            if (this.ts.isKeyword('to') === true) {
                this.ts.readToken();
                this.toVar = this.ts.passVar();
            }
            this.parseSets();
        }
        else if (this.ts.token === Token.LPARENTHESE) {
            this.ts.readToken();
            this.element.valFork = new ValueExpression();
            this.context.parseElement(this.element.valFork);
            this.ts.passToken(Token.RPARENTHESE);
            if (this.ts.isKeyword('to') === true) {
                this.ts.readToken();
                this.toVar = this.ts.passVar();
            }
        }
        // this.parseIDEntity();
        // this.parseId();
    }

    /*
    protected parseUnique(): [string, ValueExpression[]] {
        if (this.ts.isKeyword('key') === false) return;
        this.ts.readToken();
        let vals = this.parseValueArray();
        return ['key', vals];
    }
    */

    protected override scanBizID(space: Space): boolean {
        if (this.idName === undefined) {
            return true;
        }
        return super.scanBizID(space);
    }

    override scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
            return ok;
        }
        const { valFork } = this.element;
        if (valFork !== undefined) {
            if (valFork.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }

    protected IDType = BizPhraseType.fork;

    protected scanUnique(space: Space, bizID: BizFork, un: string, vals: ValueExpression[]): boolean {
        let ok = true;
        const { keys } = bizID;
        if (vals.length !== keys.length) {
            ok = false;
            this.log(`UNIQUE ${un} has ${keys.length} fields`);
        }
        return ok;
    }
}
