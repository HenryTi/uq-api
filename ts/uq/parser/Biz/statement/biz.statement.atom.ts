import { Space } from '../../space';
import { ValueExpression, BizAct, BizStatementAtom, BizAtom, Uq, IDUnique, BizBud } from '../../../il';
import { Token } from '../../tokens';
import { BizPhraseType } from '../../../il/Biz/BizPhraseType';
import { PBizStatementID } from './biz.statement.ID';

export class PBizStatementAtom<A extends BizAct, T extends BizStatementAtom<A>> extends PBizStatementID<A, T> {
    private unique: string;
    private sets: { [bud: string]: ValueExpression } = {};
    protected override _parse(): void {
        this.parseIDEntity();
        let key = this.ts.passKey();
        switch (key) {
            case 'no': break;
            case 'unique': this.unique = this.ts.passVar(); break;
            default: this.ts.expect('no', 'unique');
        }
        this.parseUnique();
        this.parseTo();
        this.parseSets();
    }

    private parseSets() {
        if (this.ts.token !== Token.VAR) return;
        if (this.ts.varBrace === true || this.ts.lowerVar !== 'set') {
            this.ts.expect('set');
        }
        this.ts.readToken();
        for (; ;) {
            let bud = this.ts.passVar();
            this.ts.passToken(Token.EQU);
            let val = new ValueExpression();
            this.context.parseElement(val);
            if (bud === 'ex') {
                this.element.ex = val;
            }
            else {
                this.sets[bud] = val;
            }
            const { token } = this.ts;
            if (token === Token.SEMICOLON as any) {
                // this.ts.readToken();
                break;
            }
            if (token === Token.COMMA as any) {
                this.ts.readToken();
                continue;
            }
            this.ts.expectToken(Token.COMMA, Token.SEMICOLON);
        }
    }

    override scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
            return ok;
        }

        for (let { entityName, condition } of this.entityCase) {
            if (condition !== undefined) {
                if (condition.pelement.scan(space) === false) {
                    ok = false;
                }
            }
            let { bizEntityArr: [entity] } = space.getBizFromEntityArrFromName(entityName);
            if (entity === undefined) {
                ok = false;
                this.log(`${entityName} is not defined`);
            }
            else if (entity.bizPhraseType !== BizPhraseType.atom) {
                ok = false;
                this.log(`${entityName} is not ATOM`);
            }
            else {
                this.element.atomCase.push({ bizID: entity as BizAtom, condition });
            }
        }
        const { atomCase, sets, ex } = this.element;
        let { length } = this.inVals;
        if (this.unique === undefined) {
            if (length !== 1) {
                ok = false;
                this.log(`NO ${length} variables, can only have 1 variable`);
            }
        }
        else {
            let unique: IDUnique;
            for (let { bizID } of atomCase) {
                let unq = bizID.getUnique(this.unique);
                if (unq === undefined) {
                    ok = false;
                    this.log(`ATOM ${bizID.getJName()} has no UNIQUE ${this.unique}`);
                }
                else if (unique === undefined) {
                    unique = unq;
                }
                else if (unq !== unique) {
                    ok = false;
                    this.log(`${this.unique} is different across ATOMS`);
                }
            }
            this.element.unique = unique;
        }
        if (ex !== undefined) {
            if (ex.pelement.scan(space) === false) {
                ok = false;
            }
        }
        else {
            ok = false;
            this.log('EX must set value');
        }
        function getBud(budName: string): BizBud {
            for (let { bizID } of atomCase) {
                let bud = bizID.getBud(budName);
                if (bud !== undefined) return bud;
            }
        }
        for (let i in this.sets) {
            let val = this.sets[i];
            if (val.pelement.scan(space) === false) {
                ok = false;
            }
            let bud = getBud(i);
            if (bud === undefined) {
                ok = false;
                this.log(`ATOM has no PROP ${i}`);
            }
            sets.set(bud, val);
        }
        return ok;
    }

    scan2(uq: Uq): boolean {
        let ok = true;
        const { unique } = this.element;
        if (unique.keys.length + 1 !== this.inVals.length) {
            ok = false;
            this.log(`ATOM UNIQUE ${this.unique} keys count mismatch`);
        }
        return ok;
    }
}

