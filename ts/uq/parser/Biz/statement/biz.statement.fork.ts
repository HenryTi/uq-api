import { Space } from '../../space';
import { BizAct, BizStatementFork, BizFork, ValueExpression } from '../../../il';
import { BizPhraseType } from '../../../il/Biz/BizPhraseType';
import { PBizStatementID } from './biz.statement.ID';
import { Token } from '../../tokens';

export class PBizStatementFork<A extends BizAct, T extends BizStatementFork<A>> extends PBizStatementID<A, BizFork, T> {
    private fork: string;
    protected override _parse(): void {
        if (this.ts.token === Token.VAR) {
            this.fork = this.ts.passVar();
            this.element.inVals = this.parseValueArray();
        }
        else if (this.ts.token === Token.LPARENTHESE) {
            this.ts.readToken();
            this.element.valFork = new ValueExpression();
            this.context.parseElement(this.element.valFork);
            this.ts.passToken(Token.RPARENTHESE);
        }
        if (this.ts.isKeyword('to') === true) {
            this.ts.readToken();
            this.toVar = this.ts.passVar();
        }
        // this.parseIDEntity();
        // this.parseId();
        // this.parseSets();
    }

    protected parseUnique(): [string, ValueExpression[]] {
        if (this.ts.isKeyword('key') === false) return;
        this.ts.readToken();
        let vals = this.parseValueArray();
        return ['key', vals];
    }

    override scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
            return ok;
        }
        if (this.fork !== undefined) {
            let fromEntityArr = space.getBizFromEntityArrFromName(this.fork);
            if (fromEntityArr === undefined) {
                ok = false;
                this.log(`FORK ${this.fork} not defined`);
            }
            else {
                const { bizEntityArr: [entity] } = fromEntityArr;
                if (entity.bizPhraseType !== BizPhraseType.fork) {
                    ok = false;
                    this.log(`${this.fork} is not FORK`);
                }
                else {
                    this.element.fork = entity as BizFork;
                }
            }
        }
        const { inVals, valFork } = this.element;
        if (inVals !== undefined) {
            for (let val of inVals) {
                if (val.pelement.scan(space) === false) {
                    ok = false;
                }
            }
        }
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
