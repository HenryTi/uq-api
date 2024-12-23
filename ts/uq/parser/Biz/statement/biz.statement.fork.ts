import { Space } from '../../space';
import { BizAct, BizStatementFork, BizFork, ValueExpression } from '../../../il';
import { BizPhraseType } from '../../../il/Biz/BizPhraseType';
import { PBizStatementID } from './biz.statement.ID';
import { Token } from '../../tokens';

export class PBizStatementFork<A extends BizAct, T extends BizStatementFork<A>> extends PBizStatementID<A, T> {
    private entityName: string;

    protected override _parse(): void {
        if (this.ts.token === Token.LPARENTHESE) {
            this.ts.readToken();
            let valFork = this.element.valFork = new ValueExpression();
            this.context.parseElement(valFork);
            this.ts.passToken(Token.RPARENTHESE);
        }
        else {
            this.entityName = this.ts.passVar();
            this.ts.passKey('in');
            this.ts.passToken(Token.EQU);
            this.parseUnique();
        }
        this.parseTo();
    }

    override scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
            return ok;
        }
        if (this.entityName !== undefined) {
            let { bizEntityArr: [entity] } = space.getBizFromEntityArrFromName(this.entityName);
            if (entity.bizPhraseType !== BizPhraseType.fork) {
                ok = false;
                this.log(`${this.entityName} is not SPEC`);
            }
            else {
                this.element.fork = entity as BizFork;
                let length = this.element.fork.keys.length + 1;
                if (length !== this.inVals.length) {
                    ok = false;
                    this.log(`IN ${this.inVals.length} variables, must have ${length} variables`);
                }
            }
        }
        else {
            if (this.element.valFork.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}
