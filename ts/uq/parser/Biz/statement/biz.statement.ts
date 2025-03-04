import { Space } from '../../space';
import {
    BizStatementPend, BizStatementSub,
    BizStatementBook, ValueExpression,
    SetEqu, BizBudValue, BizBin, BizStatement, BizStatementBin, BizStatementIn,
    BizAct, BizBinAct, BizInAct, BizStatementBinPend, BizStatementSheet, BizStatementAtom,
    BizStatementFork, BizStatementOut, BizBudArr, BizOut, BizStatementTie, BizTie,
    BizFromEntity, BizStatementError,
    BinStateAct,
    BizStatementBinState,
    BizStatementState,
    BizStatementBinAct
} from '../../../il';
import { PStatement } from '../../PStatement';
import { PContext } from '../../pContext';
import { Token } from '../../tokens';
import { binFieldArr } from '../../../consts';
import { BizPhraseType, BudDataType } from '../../../il/Biz/BizPhraseType';
import { BizPend } from '../../../il/Biz/Pend';
import { PBizStatementSub } from './biz.statement.sub';

export abstract class PBizStatement<A extends BizAct, T extends BizStatement<A>> extends PStatement {
    bizStatement: T;
    private readonly bizSubs: { [key: string]: new (bizStatement: T) => BizStatementSub<A> } = {
        title: BizStatementBook,
        book: BizStatementBook,
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
            spec: BizStatementFork,
            fork: BizStatementFork,
            tie: BizStatementTie,
            error: BizStatementError,
        };
    }
}

export class PBizStatementBinState extends PBizStatement<BinStateAct, BizStatementBinState> {
    protected getBizSubsEx() {
        return {
            state: BizStatementState,
            bizBin: BizStatementBinAct,
        };
    }
}

export class PBizStatementIn extends PBizStatement<BizInAct, BizStatementIn> {
    protected getBizSubsEx() {
        return {
            atom: BizStatementAtom,
            spec: BizStatementFork,
            fork: BizStatementFork,
            tie: BizStatementTie,
        };
    }
}

export abstract class PBizStatementPend<A extends BizAct> extends PBizStatementSub<A, BizStatementPend<A>> {
    protected pend: string;
    private sets: { [v: string]: ValueExpression };
    private keys: Map<string, ValueExpression>;

    protected _parse(): void {
        let setEqu: SetEqu;
        if (this.ts.token === Token.VAR) {
            this.pend = this.ts.passVar();
            switch (this.ts.token as Token) {
                default: break;
                case Token.EQU: setEqu = SetEqu.equ; break;
                case Token.ADDEQU: setEqu = SetEqu.add; break;
                case Token.SUBEQU: setEqu = SetEqu.sub; break;
            }
            if (setEqu !== undefined) {
                this.ts.readToken();
                this.element.setEqu = setEqu;
                this.element.val = this.context.parse(ValueExpression);
            }

            if (this.ts.isKeyword('key') === true) {
                this.ts.readToken();
                this.keys = new Map();
                // const { keys } = this.element;
                this.ts.passToken(Token.LPARENTHESE);
                for (; ;) {
                    let key = this.ts.passVar();
                    if (this.keys.has(key) === true) {
                        this.ts.error(`duplicate ${key}`);
                    }
                    this.ts.passToken(Token.EQU);
                    let val = new ValueExpression();
                    this.context.parseElement(val);
                    this.keys.set(key, val);
                    if (this.ts.token === Token.COMMA as any) {
                        this.ts.readToken();
                        if (this.ts.token === Token.RPARENTHESE as any) {
                            this.ts.readToken();
                            break;
                        }
                    }
                    else if (this.ts.token === Token.RPARENTHESE as any) {
                        this.ts.readToken();
                        break;
                    }
                }
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
                            continue;
                        }
                        let exp = this.sets[i];
                        if (exp.pelement.scan(space) === false) {
                            ok = false;
                            continue;
                        }
                        switch (bud.name) {
                            default:
                                sets.push([bud, exp]);
                                break;
                            case 'value':
                                ok = false;
                                this.log(`VALUE= is no allowed here`);
                                break;
                            case 'i':
                                this.element.setI = exp;
                                break;
                            case 'x':
                                this.element.setX = exp;
                                break;
                        }
                    }
                }
                if (this.keys !== undefined) {
                    let { keys: keyBuds } = pend;
                    if (keyBuds === undefined) {
                        ok = false;
                        this.log(`no keys defined in ${pend.getJName()}`);
                    }
                    else if (this.keys.size !== keyBuds.length) {
                        ok = false;
                        this.log(`keys count here is ${this.keys.size}, PEND ${pend.getJName()} keys count is ${keyBuds.length}. must be equal`);
                    }
                    else {
                        let i = 0;
                        this.element.keys = new Map();
                        const { keys } = this.element;
                        for (let [name, val] of this.keys) {
                            let bud = keyBuds[i];
                            if (bud.name !== name) {
                                ok = false;
                                this.log(`${name} is not align with PEND keys define`);
                            }
                            else {
                                if (val.pelement.scan(space) === false) {
                                    ok = false;
                                }
                                else {
                                    keys.set(bud, val);
                                }
                            }
                            i++;
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

export class PBizStatementBook extends PBizStatementSub<BizAct, BizStatementBook> {
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

export class PBizStatementBinAct extends PBizStatementSub<BinStateAct, BizStatementBinAct> {
    protected _parse(): void {
    }
}

export class PBizStatementError<A extends BizAct, T extends BizStatementError<A>> extends PBizStatementSub<A, T> {
    protected override _parse(): void {
        let key = this.ts.passKey();
        switch (key) {
            default:
                this.ts.expect('PEND', 'BIN');
                break;
            case 'pend':
                let pendOver = new ValueExpression();
                this.context.parseElement(pendOver);
                this.element.pendOver = pendOver;
                break;
            case 'bin':
                let message = new ValueExpression();
                this.context.parseElement(message);
                this.element.message = message;
                break;
        }
    }

    override scan(space: Space): boolean {
        let ok = true;
        const { pendOver, message } = this.element;
        if (pendOver !== undefined) {
            if (pendOver.pelement.scan(space) === false) {
                ok = false;
            }
        }
        if (message !== undefined) {
            if (message.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}
