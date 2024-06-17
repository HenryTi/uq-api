import { Space } from '../../space';
import {
    BizStatementPend, BizStatementSub
    , BizStatementTitle, ValueExpression
    , SetEqu, BizBudValue, BizBin, BizStatement, BizStatementBin, BizStatementIn
    , BizAct, BizBinAct, BizInAct, BizStatementBinPend, BizStatementSheet
    , VarPointer, BizStatementID, BizStatementAtom, BizStatementSpec
    , BizAtom, BizSpec, BizStatementOut, BizBudArr, BizOut
    , Uq, CompareExpression, IDUnique, BizBud, BizStatementTie, BizTie,
    BizFromEntity
} from '../../../il';
import { PStatement } from '../../statement/statement';
import { PContext } from '../../pContext';
import { PElement } from '../../element';
import { Token } from '../../tokens';
import { binFieldArr } from '../../../consts';
import { BizPhraseType, BudDataType } from '../../../il/Biz/BizPhraseType';
import { BizPend } from '../../../il/Biz/Pend';

export abstract class PBizStatement<A extends BizAct, T extends BizStatement<A>> extends PStatement {
    bizStatement: T;
    private readonly bizSubs: { [key: string]: new (bizStatement: T) => BizStatementSub<A> } = {
        title: BizStatementTitle,
        book: BizStatementTitle,
        sheet: BizStatementSheet,
    }
    constructor(bizStatement: T, context: PContext) {
        super(bizStatement, context);
        this.bizStatement = bizStatement;
        this.init();
    }

    private init() {
        let ex = this.getBizSubsEx();
        for (let i in ex) {
            this.bizSubs[i] = ex[i];
        }
    }

    protected abstract getBizSubsEx(): { [key: string]: new (bizStatement: T) => BizStatementSub<A> };

    protected _parse() {
        let key = this.ts.passKey();
        let BizSub = this.bizSubs[key];
        if (BizSub === undefined) {
            this.ts.expect(...Object.keys(this.bizSubs));
        }
        let bizSub = new BizSub(this.bizStatement);
        this.context.parseElement(bizSub);
        this.bizStatement.sub = bizSub;
        this.ts.passToken(Token.SEMICOLON);
    }

    scan0(space: Space): boolean {
        let ok = true;
        let { sub } = this.bizStatement;
        if (sub.pelement.scan0(space) == false) ok = false;
        return ok;
    }

    scan(space: Space): boolean {
        let ok = true;
        let { sub } = this.bizStatement;
        if (sub.pelement.scan(space) == false) ok = false;
        return ok;
    }
}

export class PBizStatementBin extends PBizStatement<BizBinAct, BizStatementBin> {
    protected getBizSubsEx() {
        return {
            pend: BizStatementBinPend,
            out: BizStatementOut,
            atom: BizStatementAtom,
            spec: BizStatementSpec,
            fork: BizStatementSpec,
            tie: BizStatementTie,
        };
    }
}

export class PBizStatementIn extends PBizStatement<BizInAct, BizStatementIn> {
    protected getBizSubsEx() {
        return {
            atom: BizStatementAtom,
            spec: BizStatementSpec,
            fork: BizStatementSpec,
            tie: BizStatementTie,
        };
    }
}

abstract class PBizStatementSub<A extends BizAct, T extends BizStatementSub<A>> extends PElement<T> {
}

export abstract class PBizStatementPend<A extends BizAct> extends PBizStatementSub<A, BizStatementPend<A>> {
    protected pend: string;
    private sets: { [v: string]: ValueExpression };

    protected _parse(): void {
        let setEqu: SetEqu;
        if (this.ts.token === Token.VAR) {
            this.pend = this.ts.passVar();
            if (this.ts.token === Token.EQU as any) {
                this.ts.readToken();
                this.element.val = this.context.parse(ValueExpression);
            }
            if (this.ts.isKeyword('set') === true) {
                this.sets = {};
                this.ts.passKey('set');
                for (; ;) {
                    let v = this.ts.passVar();
                    this.ts.passToken(Token.EQU);
                    let exp = this.context.parse(ValueExpression);
                    this.sets[v] = exp;
                    let { token } = this.ts;
                    if (token === Token.COMMA as any) {
                        this.ts.readToken();
                        continue;
                    }
                    if (token === Token.SEMICOLON as any) {
                        break;
                    }
                    this.ts.expectToken(Token.COMMA, Token.SEMICOLON);
                }
            }
        }
        else {
            switch (this.ts.token) {
                default:
                    this.ts.expectToken(Token.EQU, Token.ADDEQU, Token.SUBEQU);
                    break;
                case Token.EQU: setEqu = SetEqu.equ; break;
                case Token.ADDEQU: setEqu = SetEqu.add; break;
                case Token.SUBEQU: setEqu = SetEqu.sub; break;
            }
            this.ts.readToken();
            this.element.setEqu = setEqu;
            this.element.val = this.context.parse(ValueExpression);
        }
    }

    private getPend(space: Space, pendName: string): BizPend {
        let pend = space.uq.biz.bizEntities.get(pendName);
        if (pend === undefined) {
            this.log(`'${this.pend}' is not defined`);
            return undefined;
        }
        if (pend.type !== 'pend') {
            this.log(`'${this.pend}' is not a PEND`);
            return undefined;
        }
        return pend as BizPend;
    }

    scan0(space: Space): boolean {
        let ok = true;
        let { bizEntityArr: [bizBin] } = space.getBizFromEntityArrFromAlias(undefined) as BizFromEntity<BizBin>;
        if (this.pend !== undefined) {
            let pend = this.getPend(space, this.pend);
            if (pend !== undefined) {
                pend.bizBins.push(bizBin);
            }
        }
        return ok;
    }

    scan(space: Space): boolean {
        let ok = true;
        if (this.pend !== undefined) {
            let pend = this.getPend(space, this.pend);
            if (pend === undefined) {
                ok = false;
            }
            else {
                this.element.pend = pend;
                if (this.sets !== undefined) {
                    let { sets } = this.element;
                    for (let i in this.sets) {
                        let bud = pend.getBud(i);
                        if (bud === undefined) {
                            ok = false;
                            this.log(`There is no ${i.toUpperCase()} in Pend ${pend.jName}`);
                        }
                        else {
                            let exp = this.sets[i];
                            if (exp.pelement.scan(space) === false) {
                                ok = false;
                            }
                            else {
                                sets.push([bud, exp]);
                            }
                        }
                    }
                }
            }
        }
        let { val } = this.element;
        if (val !== undefined) {
            if (val.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}

export class PBizStatementBinPend extends PBizStatementPend<BizBinAct> {
    scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
        }
        let { val, bizStatement: { bizAct } } = this.element;
        if (this.pend === undefined) {
            const { bizBin } = bizAct;
            if (bizBin.pend === undefined) {
                this.log(`Biz Pend = can not be used here when ${bizBin.getJName()} has no PEND`);
                ok = false;
            }
            if (val !== undefined) {
                if (val.pelement.scan(space) === false) ok = false;
            }
        }
        return ok;
    }
}

export class PBizStatementInPend extends PBizStatementPend<BizInAct> {
}

export class PBizStatementTitle extends PBizStatementSub<BizAct, BizStatementTitle> {
    private buds: string[];

    protected _parse(): void {
        this.buds = [];
        for (; ;) {
            this.buds.push(this.ts.passVar());
            if (this.ts.token !== Token.DOT) break;
            this.ts.readToken();
        }
        this.ts.passKey('of');
        this.element.of = this.context.parse(ValueExpression);
        switch (this.ts.token) {
            default: this.ts.expectToken(Token.ADDEQU, Token.SUBEQU); break;
            case Token.EQU: this.element.setEqu = SetEqu.equ; break;
            case Token.ADDEQU: this.element.setEqu = SetEqu.add; break;
            case Token.SUBEQU: this.element.setEqu = SetEqu.sub; break;
        }
        this.ts.readToken();
        this.element.val = this.context.parse(ValueExpression);
    }

    scan(space: Space): boolean {
        let ok = true;
        let { val, of, setEqu } = this.element;
        let len = this.buds.length;
        let buds0 = this.buds[0];
        let entity = space.uq.biz.bizEntities.get(buds0);
        if (entity === undefined) {
            this.log(`'${buds0}' is not a Biz Entity`);
            ok = false;
            return ok;
        }
        if (len !== 2) {
            this.log(`'There must be a bud of ${buds0}`);
            ok = false;
            return ok;
        }
        let buds1 = this.buds[1];
        let bud = entity.getBud(buds1);
        if (bud === undefined) {
            this.log(`'${buds0}.${buds1}' not defined`);
            ok = false;
            return ok;
        }
        this.element.entity = entity;
        this.element.bud = bud as BizBudValue;
        let { dataType } = bud;
        if (setEqu === SetEqu.add || setEqu === SetEqu.sub) {
            if (dataType !== BudDataType.int && dataType !== BudDataType.dec) {
                this.log('only int or dec support += or -=');
                ok = false;
            }
        }
        if (val !== undefined) {
            if (val.pelement.scan(space) === false) ok = false;
        }
        if (of !== undefined) {
            if (of.pelement.scan(space) === false) ok = false;
        }
        return ok;
    }
}

export class PBizStatementSheet extends PBizStatementSub<BizAct, BizStatementSheet> {
    private useSheet: string;
    private detail: string;
    protected _parse(): void {
        this.useSheet = this.ts.passVar();
        if (this.ts.isKeyword('detail') === true) {
            this.ts.readToken();
            this.detail = this.ts.passVar();
        }
        this.parseSet();
    }

    override scan(space: Space): boolean {
        let ok = true;
        let useSheet = space.getUse(this.useSheet);
        if (useSheet === undefined || useSheet.obj.type !== 'sheet') {
            ok = false;
            this.log(`${this.useSheet} is not a USE SHEET`);
        }
        else {
            this.element.useSheet = useSheet.obj;
            let { sheet } = this.element.useSheet;
            if (sheet === undefined) {
                ok = false;
            }
            else {
                const detail = sheet.details.find(v => v.bin.name === this.detail);
                if (detail !== undefined) {
                    this.element.bin = this.element.detail = detail.bin;
                }
                else {
                    this.element.bin = sheet.main;
                }
                if (this.scanSets(space) === false) ok = false;
            }
        }
        return ok;
    }

    private readonly sets: { [name: string]: ValueExpression } = {};
    protected parseSet() {
        this.ts.passKey('set');
        for (; ;) {
            let name = this.ts.passVar();
            this.ts.passToken(Token.EQU);
            let val = new ValueExpression();
            this.context.parseElement(val);
            this.sets[name] = val;
            if (this.ts.token === Token.SEMICOLON) break;
            if (this.ts.token === Token.COMMA) {
                this.ts.readToken();
                continue;
            }
            this.ts.expectToken(Token.COMMA, Token.SEMICOLON);
        }
    }

    protected scanSets(space: Space): boolean {
        let ok = true;
        const { bin, fields, buds } = this.element;
        const { props } = bin;
        for (let i in this.sets) {
            let val = this.sets[i];
            if (val.pelement.scan(space) === false) {
                ok = false;
            }
            if (binFieldArr.findIndex(v => v === i) >= 0) {
                fields[i] = val;
                continue;
            }
            if (props.has(i) === true) {
                buds[i] = val;
                continue;
            }
            ok = false;
            this.log(`${i} is not defined in ${bin.getJName()}`);
        }
        return ok;
    }
}

abstract class PBizStatementID<A extends BizAct, T extends BizStatementID<A>> extends PBizStatementSub<A, T> {
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

export class PBizStatementSpec<A extends BizAct, T extends BizStatementSpec<A>> extends PBizStatementID<A, T> {
    private entityName: string;
    protected parseIDEntity() {
        this.entityName = this.ts.passVar();
    }
    override scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
            return ok;
        }
        let { bizEntityArr: [entity] } = space.getBizFromEntityArrFromName(this.entityName);
        if (entity.bizPhraseType !== BizPhraseType.fork) {
            ok = false;
            this.log(`${this.entityName} is not SPEC`);
        }
        else {
            this.element.spec = entity as BizSpec;
            let length = this.element.spec.keys.length + 1;
            if (length !== this.inVals.length) {
                ok = false;
                this.log(`IN ${this.inVals.length} variables, must have ${length} variables`);
            }
        }
        return ok;
    }
}

export class PBizStatementTie<A extends BizAct> extends PBizStatementSub<A, BizStatementTie<A>> {
    private tieName: string;
    protected _parse(): void {
        this.tieName = this.ts.passVar();
        this.ts.passKey('i');
        this.ts.passToken(Token.EQU);
        let ival = new ValueExpression();
        this.context.parseElement(ival);
        this.ts.passKey('x');
        this.ts.passToken(Token.EQU);
        let xval = new ValueExpression();
        this.context.parseElement(xval);
        this.element.i = ival;
        this.element.x = xval;
    }
    override scan(space: Space) {
        let ok = true;
        let { bizEntityArr: [tie] } = space.getBizFromEntityArrFromName(this.tieName) as BizFromEntity<BizTie>;
        if (tie === undefined || tie.bizPhraseType !== BizPhraseType.tie) {
            ok = false;
            this.log(`${this.tieName} is not TIE`);
        }
        else {
            this.element.tie = tie;
        }

        const { i, x } = this.element;
        if (i.pelement.scan(space) === false) {
            ok = false;
        }
        if (x.pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
}

export class PBizStatementOut<A extends BizAct, T extends BizStatementOut<A>> extends PBizStatementSub<A, T> {
    private outName: string;
    protected override _parse(): void {
        this.outName = this.ts.passVar();
        if (this.ts.isKeyword('to') === true) {
            this.ts.readToken();
            if (this.ts.token === Token.LPARENTHESE) {
                this.ts.readToken();
                for (; ;) {
                    let to = new ValueExpression();
                    this.element.tos.push(to);
                    this.context.parseElement(to);
                    if (this.ts.token === Token.COMMA as any) {
                        this.ts.readToken();
                    }
                    if (this.ts.token === Token.RPARENTHESE as any) {
                        this.ts.readToken();
                        break;
                    }
                }
            }
            else {
                let to = new ValueExpression();
                this.element.tos.push(to);
                this.context.parseElement(to);
            }
        }
        else if (this.ts.isKeyword('add') === true) {
            this.ts.readToken();
            this.element.detail = this.ts.passVar();
        }
        else {
            this.ts.expect('to', 'add');
        }
        this.ts.passKey('set');
        for (; ;) {
            let name = this.ts.passVar();
            this.ts.passToken(Token.EQU);
            let val = new ValueExpression();
            this.context.parseElement(val);
            this.element.sets[name] = val;
            if (this.ts.token === Token.COMMA) {
                this.ts.readToken();
                continue;
            }
            if (this.ts.token === Token.SEMICOLON) {
                break;
            }
            this.ts.expectToken(Token.COMMA, Token.SEMICOLON);
        }
    }
    override scan(space: Space): boolean {
        let ok = true;
        let { tos, detail, sets } = this.element;
        let { bizEntityArr: [bizOut] } = space.getBizFromEntityArrFromName(this.outName) as BizFromEntity<BizOut>;
        if (bizOut === undefined || bizOut.bizPhraseType !== BizPhraseType.out) {
            ok = false;
            this.log(`${this.outName} is not OUT`);
        }
        else {
            let hasTo: boolean;
            for (let to of tos) {
                if (to !== undefined) {
                    if (to.pelement.scan(space) === false) {
                        ok = false;
                    }
                    hasTo = true;
                }
                else {
                    hasTo = false;
                }
            }
            this.element.useOut = space.regUseBizOut(bizOut, hasTo);
            let { props } = bizOut;

            if (detail !== undefined) {
                let arr = bizOut.props.get(detail) as BizBudArr;
                if (arr === undefined || arr.dataType !== BudDataType.arr) {
                    ok = false;
                    this.log(`${detail} is not a ARR of ${bizOut.getJName()}`);
                }
                else {
                    props = arr.props;
                }
            }
            if (props !== undefined) {
                for (let i in sets) {
                    if (props.has(i) === false) {
                        ok = false;
                        this.log(`${i} is not defined`);
                    }
                    else if (sets[i].pelement.scan(space) === false) {
                        ok = false;
                    }
                }
            }
        }
        return ok;
    }
}
