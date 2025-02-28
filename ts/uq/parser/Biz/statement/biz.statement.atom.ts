import { Space } from '../../space';
import { ValueExpression, BizAct, BizStatementAtom, BizAtom, Uq, IDUnique, BizBud } from '../../../il';
import { Token } from '../../tokens';
import { BizPhraseType } from '../../../il/Biz/BizPhraseType';
import { PBizStatementID } from './biz.statement.ID';

export class PBizStatementAtom<A extends BizAct, T extends BizStatementAtom<A>> extends PBizStatementID<A, BizAtom, T> {
    protected override _parse(): void {
        this.parseIDEntity();
        this.parseId();
        this.parseNo();
        this.parseSets();
    }

    protected parseUnique(): [string, ValueExpression[]] {
        if (this.ts.isKeyword('unique') === false) return;
        this.ts.readToken();
        let un = this.ts.passVar();
        let vals = this.parseValueArray();
        return [un, vals];
    }

    private parseNo() {
        if (this.ts.isKeyword('no') === true) {
            this.ts.readToken();
            if (this.ts.token === Token.EQU) {
                this.ts.readToken();
                this.element.noVal = new ValueExpression();
                this.context.parseElement(this.element.noVal);
            }
            else if (this.ts.isKeyword('auto') === true) {
                this.ts.readToken();
                this.element.noVal = null;
            }
            else {
                this.element.noVal = new ValueExpression();
                this.context.parseElement(this.element.noVal);
            }
        }
    }

    protected setField(fieldName: string, val: ValueExpression): boolean {
        if (fieldName === 'ex') {
            this.element.ex = val;
            return true;
        }
        return false;
    }

    override scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
            return ok;
        }

        const { noVal, ex } = this.element;
        if (ex !== undefined) {
            if (ex.pelement.scan(space) === false) {
                ok = false;
            }
        }
        else {
            ok = false;
            this.log('EX must set value');
        }
        if (noVal !== undefined && noVal !== null) {
            if (noVal.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }

    protected keyDefined(): boolean {
        if (super.keyDefined() === true) return true;
        if (this.element.noVal !== undefined) return true;
        return false;
    }

    protected IDType = BizPhraseType.atom;

    protected scanUnique(space: Space, bizID: BizAtom, un: string, vals: ValueExpression[]): boolean {
        let ok = true;
        if (bizID !== undefined) {
            const { uniques } = bizID;
            if (uniques === undefined) {
                if (un !== undefined) {
                    ok = false;
                    this.log(`${bizID.getJName()} does not have UNIQUE`);
                }
            }
            else {
                let ret = uniques.find(v => v.name === un);
                if (ret === undefined) {
                    ok = false;
                    this.log(`UNQIUE ${un} not defined in ${bizID.jName}`);
                }
                else {
                    const { keys } = ret;
                    if (vals.length !== keys.length) {
                        ok = false;
                        this.log(`UNIQUE ${un} has ${keys.length} fields`);
                    }
                }
            }
        }
        return ok;
    }
}

