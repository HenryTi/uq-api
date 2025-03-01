import { Space } from '../../space';
import { ValueExpression, BizAct, NamePointer, BizStatementID, CompareExpression, BizID, BizBud } from '../../../il';
import { Token } from '../../tokens';
import { PBizStatementSub } from './biz.statement.sub';
import { BizPhraseType } from '../../../il/Biz/BizPhraseType';

export abstract class PBizStatementID<A extends BizAct, I extends BizID, T extends BizStatementID<I, A>> extends PBizStatementSub<A, T> {
    // protected readonly entityCase: { entityName: string; condition: CompareExpression; uniqueName: string; uniqueVals: ValueExpression[]; }[] = [];
    protected idName: string;
    private sets: { [bud: string]: ValueExpression } = {};
    protected toVar: string;
    protected hasUnique = true; // every entity has its unique
    /*
    protected override _parse(): void {
        this.parseIDEntity();
        this.ts.passKey('in');
        this.ts.passToken(Token.EQU);
        this.parseUnique();
        this.parseTo();
    }
    */

    // protected abstract parseUnique(): [string, ValueExpression[]];

    /*
    protected parseIDEntity() {
        if (this.ts.token === Token.LPARENTHESE) {
            this.ts.readToken();
            for (; ;) {
                this.ts.passKey('when');
                let condition = new CompareExpression();
                this.context.parseElement(condition);
                this.ts.passKey('then');
                this.parseEntityAndUnique(condition);
                if (this.ts.isKeyword('else') === true) {
                    this.ts.readToken();
                    this.parseEntityAndUnique(undefined);
                    break;
                }
            }
            this.ts.passToken(Token.RPARENTHESE);
        }
        else {
            this.parseEntityAndUnique(undefined);
        }
    }
    */

    /*
    protected parseEntityAndUnique(condition: CompareExpression) {
        let entityName = this.ts.passVar();
        let retUnique = this.parseUnique();
        if (retUnique === undefined) {
            this.entityCase.push({ condition, entityName, uniqueName: undefined, uniqueVals: undefined });
        }
        else {
            const [uniqueName, uniqueVals] = retUnique;
            this.entityCase.push({ condition, entityName, uniqueName, uniqueVals });
        }
    }
    */

    protected setField(fieldName: string, val: ValueExpression): boolean {
        return false;
    }

    protected scanBizID(space: Space): boolean {
        let ok = true;
        const bizPhraseType = this.IDType;
        const fromAtom = space.getBizFromEntityArrFromName(this.idName);
        if (fromAtom === undefined) {
            ok = false;
            this.log(`${this.idName} is not ${BizPhraseType[bizPhraseType]}`);
        }
        else {
            const { bizEntityArr: [entity] } = fromAtom;
            if (entity.bizPhraseType !== BizPhraseType.atom) {
                ok = false;
                this.log(`${this.idName} is not ${BizPhraseType[bizPhraseType]}`);
            }
            else {
                this.element.bizID = entity as I;
            }
        }
        return ok;
    }

    protected parseSets() {
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
            if (this.setField(bud, val) === false) {
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

    protected parseId() {
        if (this.ts.isKeyword('id') !== true) return;
        this.ts.readToken();
        if (this.ts.token === Token.EQU) {
            this.ts.readToken();
            this.element.idVal = new ValueExpression;
            this.context.parseElement(this.element.idVal);
        }
        else {
            this.ts.passKey('to');
            this.toVar = this.ts.passVar();
        }
    }

    override scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
        }
        if (this.scanBizID(space) === false) {
            ok = false;
        }
        if (this.toVar !== undefined) {
            this.element.toVar = space.varPointer(this.toVar, false) as NamePointer;
            if (this.element.toVar === undefined) {
                ok = false;
                this.log(`${this.toVar} is not defined`);
            }
        }
        const { uniqueVals, idVal, sets } = this.element;
        if (idVal !== undefined) {
            if (idVal.pelement.scan(space) === false) {
                ok = false;
            }
        }

        if (uniqueVals !== undefined) {
            for (let val of uniqueVals) {
                if (val.pelement.scan(space) === false) {
                    ok = false;
                }
            }
        }

        /*
        for (let { entityName, condition, uniqueName, uniqueVals } of this.entityCase) {
            let bizID = this.scanEntity(space, entityName);
            if (bizID === undefined) {
                ok = false;
            }
            if (condition !== undefined) {
                if (condition.pelement.scan(space) === false) ok = false;
            }
            if (uniqueName === uniqueName) this.hasUnique = false;
            if (this.scanUnique(space, bizID, uniqueName, uniqueVals) === false) ok = false;
            entityCase.push({ bizID, condition, uniqueName, uniqueVals });
        }
        */

        const { bizID } = this.element;
        function getBud(budName: string): BizBud {
            let bud = bizID.getBud(budName);
            if (bud !== undefined) return bud;
        }

        for (let i in this.sets) {
            let val = this.sets[i];
            if (val.pelement.scan(space) === false) {
                ok = false;
            }
            if (bizID === undefined) {
                ok = false;
                this.log(`no ID defined`);
            }
            else {
                let bud = getBud(i);
                if (bud === undefined) {
                    ok = false;
                    this.log(`ATOM has no PROP ${i}`);
                }
                sets.set(bud, val);
            }
        }

        if (this.keyDefined() === false) {
            ok = false;
            this.log('KEY must be defined');
        }

        return ok;
    }

    protected keyDefined(): boolean {
        if (this.element.idVal !== undefined) return true;
        if (this.hasUnique === true) return true;
        return false;
    }

    protected abstract get IDType(): BizPhraseType;
    protected scanEntity(space: Space, entityName: string): I {
        let fromEntityArr = space.getBizFromEntityArrFromName(entityName);
        if (fromEntityArr === undefined) {
            this.log(`${entityName} is not defined`);
            return undefined;
        }
        let { bizEntityArr: [entity] } = fromEntityArr;
        if (entity.bizPhraseType !== this.IDType) {
            return undefined;
        }
        return entity as I;
    }

    protected abstract scanUnique(space: Space, bizID: I, un: string, vals: ValueExpression[]): boolean;
}

