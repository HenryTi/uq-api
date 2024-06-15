import { binFieldArr } from "../consts";
import {
    ValueExpression, BizExp, BizAtom
    , BizSpec, BizBin, BizTitle, BizExpParam, BizExpParamType, BizTie, BizDuo
    , BizCheckBudOperand, BizBudCheck, BizOptions
    , BizExpOperand,
    Uq,
    BizFieldOperand,
    BizBud,
    BizCombo,
} from "../il";
import { BizPhraseType, BudDataType } from "../il/Biz/BizPhraseType";
import { PElement } from "./element";
import { Space } from "./space";
import { Token } from "./tokens";

export class PBizExpOperand extends PElement<BizExpOperand> {
    protected _parse(): void {
        this.element.bizExp = new BizExp();
        const { bizExp } = this.element;
        this.context.parseElement(bizExp);
    }

    scan(space: Space): boolean {
        let ok = true;
        const { bizExp } = this.element;
        if (bizExp.pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
}

// (#Entity.Bud(id).^|Prop IN timeSpan +- delta)
export class PBizExp extends PElement<BizExp> {
    private bizEntity: string;
    private bud: string;
    protected _parse(): void {
        this.bizEntity = this.ts.passVar();
        if (this.ts.token === Token.DOT) {
            this.ts.readToken();
            this.bud = this.ts.passVar();
        }
        this.ts.passToken(Token.LPARENTHESE);
        this.element.param = new BizExpParam(); // new ValueExpression();
        let { param } = this.element;
        this.context.parseElement(param);
        this.ts.passToken(Token.RPARENTHESE);
        if (this.ts.token === Token.DOT) {
            this.ts.readToken();
            if (this.ts.token === Token.XOR as any) {
                this.element.isParent = true;
                this.ts.readToken();
            }
            this.element.prop = this.ts.passVar();
        }
        if (this.ts.isKeyword('in') === true) {
            this.ts.readToken();
            let timeSpan = this.ts.passVar();
            let op: '+' | '-';
            let val: ValueExpression;
            switch (this.ts.token) {
                case Token.SUB: op = '-'; break;
                case Token.ADD: op = '+'; break;
            }
            if (op !== undefined) {
                this.ts.readToken();
                val = new ValueExpression();
                this.context.parseElement(val);
            }
            this.element.in = {
                varTimeSpan: timeSpan,
                op,
                val,
                statementNo: undefined,
                spanPeiod: undefined,
            };
        }
    }

    scan(space: Space): boolean {
        let ok = true;
        let { bizEntityArr: [be] } = space.getBizFromEntityArrFromName(this.bizEntity);
        this.element.bizEntity = be;
        this.element.isReadonly = space.isReadonly;
        const { bizEntity, in: varIn, param } = this.element;
        if (param.pelement.scan(space) === false) {
            ok = false;
        }
        if (bizEntity === undefined) {
            this.log(`${this.bizEntity} is not a Biz Entity`);
            ok = false;
        }
        else {
            let ret: boolean;
            switch (bizEntity.bizPhraseType) {
                default:
                    ok = false;
                    this.log(`${bizEntity.getJName()} must be either Atom, Spec, Bin or Title`);
                    break;
                case BizPhraseType.atom: ret = this.scanAtom(space); break;
                case BizPhraseType.spec: ret = this.scanSpec(space); break;
                case BizPhraseType.bin: ret = this.scanBin(space); break;
                case BizPhraseType.title: ret = this.scanTitle(space); break;
                case BizPhraseType.tie: ret = this.scanTie(space); break;
                case BizPhraseType.duo: ret = this.scanDuo(space); break;
                case BizPhraseType.combo: ret = this.scanCombo(space); break;
            }
            if (ret === false) {
                ok = false;
            }
        }
        if (varIn !== undefined) {
            // scan BizExp.in
            const { varTimeSpan: timeSpan, val } = varIn;
            let { statementNo, obj: spanPeiod } = space.getUse(timeSpan);
            if (statementNo === undefined) {
                this.log(`${timeSpan} is not used`);
                ok = false;
            }
            varIn.spanPeiod = spanPeiod;
            varIn.statementNo = statementNo;
            if (val !== undefined) {
                if (val.pelement.scan(space) === false) {
                    ok = false;
                }
            }
        }
        return ok;
    }

    private checkScalar(): boolean {
        const { bizEntity, param } = this.element;
        if (param.paramType !== BizExpParamType.scalar) {
            this.log(`${bizEntity.type.toUpperCase()} ${bizEntity.getJName()} does not support TABLE param.`);
            return false;
        }
        return true;
    }

    private scanAtom(space: Space): boolean {
        let ok = true;
        const { bizEntity, prop } = this.element;
        if (this.checkScalar() === false) ok = false;
        let bizAtom = bizEntity as BizAtom;
        if (this.bud !== undefined) {
            this.log(`ATOM ${bizEntity.getJName()} should not .`);
            ok = false;
        }
        if (prop === undefined) {
            this.element.prop = 'id';
        }
        else {
            let bud = bizAtom.getBud(prop);
            if (bud === undefined) {
                this.log(`${bizAtom.getJName()} does not have prop ${prop}`);
                ok = false;
            }
            else {
                this.element.budProp = bud;
            }
        }
        return ok;
    }

    private scanSpec(space: Space): boolean {
        let ok = true;
        const { bizEntity, prop } = this.element;
        if (this.checkScalar() === false) ok = false;
        let bizSpec = bizEntity as BizSpec;
        if (this.bud !== undefined) {
            this.log(`SPEC ${bizEntity.getJName()} should not .`);
            ok = false;
        }
        if (prop === undefined) {
            this.element.prop = 'id';
        }
        else {
            let bud = bizSpec.getBud(prop);
            if (bud === undefined) {
                this.log(`${bizSpec.getJName()} does not have prop ${prop}`);
                ok = false;
            }
            else {
                this.element.budProp = bud;
            }
        }
        return ok;
    }

    private scanBin(space: Space): boolean {
        let ok = true;
        const { bizEntity, prop, isParent } = this.element;
        if (this.checkScalar() === false) ok = false;
        let bizBin = bizEntity as BizBin;
        if (this.bud !== undefined) {
            this.log(`BIN ${bizEntity.getJName()} should not .`);
            ok = false;
        }
        if (prop === undefined) {
            this.element.prop = 'id';
        }
        else {
            const arr = binFieldArr;
            if (arr.includes(prop) === false) {
                let bud: BizBud;
                if (isParent === true) {
                    bud = bizBin.getSheetBud(prop);
                    if (bud === undefined) {
                        let { main } = bizBin;
                        if (main === undefined) {
                            this.log(`${bizBin.getJName()} must define MAIN if %sheet props used`);
                        }
                        else {
                            this.log(`${main.getJName()} does not have prop ${prop}`);
                        }
                        ok = false;
                    }
                }
                else {
                    bud = bizBin.getBud(prop);
                    if (bud === undefined) {
                        this.log(`${bizBin.getJName()} does not have prop ${prop}`);
                        ok = false;
                    }
                }
                if (bud !== undefined) {
                    this.element.budProp = bud;
                }
            }
        }
        return ok;
    }

    private scanTitle(space: Space): boolean {
        let ok = true;
        const { bizEntity, prop } = this.element;
        let title = bizEntity as BizTitle;
        if (this.bud === undefined) {
            this.log(`TITLE ${title.getJName()} should follow .`);
            ok = false;
        }
        else {
            let bud = title.props.get(this.bud);
            if (bud === undefined) {
                this.log(`TITLE ${title.getJName()} does not have ${this.bud} .`);
                ok = false;
            }
            else {
                this.element.budEntitySub = bud;
            }
        }
        if (prop === undefined) {
            this.element.prop = 'value';
        }
        else {
            const arr = ['value', 'count', 'sum', 'avg', 'average', 'max', 'min'];
            if (arr.includes(prop) === false) {
                this.log(`Title does not have function ${prop}`);
            }
        }
        return ok;
    }

    private scanTie(space: Space): boolean {
        let ok = true;
        const { bizEntity } = this.element;
        let tie = bizEntity as BizTie;
        if (this.bud !== undefined) {
            this.log(`TIE ${tie.getJName()} should not follow prop.`);
            ok = false;
        }
        return ok;
    }

    private scanDuo(space: Space): boolean {
        let ok = true;
        const { bizEntity, param: bizParam } = this.element;
        const { params: [param, param2] } = bizParam;
        let duo = bizEntity as BizDuo;
        if (param2 === undefined) {
            if (this.bud !== 'i' && this.bud !== 'x') {
                this.log(`DUO ${duo.getJName()}(p1, p2) should follow I or X`);
                ok = false;
            }
        }
        else {
            if (this.bud !== undefined) {
                this.log(`DUO ${duo.getJName()}(id) should not have prop`);
                ok = false;
            }
        }
        return ok;
    }

    private scanCombo(space: Space): boolean {
        let ok = true;
        const { bizEntity, param: bizParam } = this.element;
        const { params } = bizParam;
        let combo = bizEntity as BizCombo;
        const { length } = combo.keys;
        if (params.length !== length) {
            this.log(`COMBO ${combo.getJName()}(...) should be ${length}`);
            ok = false;
        }
        return ok;
    }
}

export class PBizExpParam extends PElement<BizExpParam> {
    private ties: string[];
    protected _parse(): void {
        if (this.ts.token === Token.SHARP) {
            this.ts.readToken();
            this.parseArray();
        }
        else {
            const { params } = this.element;
            for (; ;) {
                let param = new ValueExpression();
                params.push(param);
                this.context.parseElement(param);
                if (this.ts.token !== Token.COMMA) break;
                this.ts.readToken();
            }
            /*
            if (this.ts.token === Token.COMMA) {
                this.ts.readToken();
                this.element.paramType = BizExpParamType.dou;
                this.element.param2 = new ValueExpression();
                const { param2 } = this.element;
                this.context.parseElement(param2);
            }
            */
            let paramType: BizExpParamType;
            switch (params.length) {
                case 0: paramType = BizExpParamType.none; break;
                case 1: paramType = BizExpParamType.scalar; break;
                case 2: paramType = BizExpParamType.duo; break;
                case 3: paramType = BizExpParamType.multi; break;
            }
            this.element.paramType = paramType;
        }
    }

    private parseArray() {
        if (this.ts.isKeyword('spec') === true) {
            this.element.paramType = BizExpParamType.spec;
            this.ts.readToken();
            this.ts.passKey('on');
            this.ts.passToken(Token.XOR);
            this.ts.passToken(Token.EQU);
            const param = new ValueExpression();
            this.element.params.push(param);
            this.context.parseElement(param);
        }
        else if (this.ts.token === Token.VAR) {
            this.element.paramType = BizExpParamType.ix;
            this.ties = [this.ts.lowerVar];
            this.ts.readToken();
            for (; ;) {
                if (this.ts.token !== Token.BITWISEOR as any) break;
                this.ts.readToken();
                this.ties.push(this.ts.lowerVar);
            }
            this.ts.passKey('on');
            this.ts.passKey('i');
            this.ts.passToken(Token.EQU);
            const param = new ValueExpression();
            this.element.params.push(param);
            this.context.parseElement(param);
        }
        else {
            this.ts.expect('SPEC or ties');
        }
    }

    scan(space: Space): boolean {
        let ok = true;
        const { params } = this.element;
        for (let param of params) {
            if (param !== undefined) {
                if (param.pelement.scan(space) === false) {
                    ok = false;
                }
            }
        }
        if (this.ties !== undefined) {
            let ixs: BizTie[] = [];
            for (let tie of this.ties) {
                let { bizEntityArr: [t] } = space.getBizFromEntityArrFromName(tie);
                if (t === undefined || t.bizPhraseType !== BizPhraseType.tie) {
                    this.log(`${tie} is not a TIE`);
                    ok = false;
                }
                else {
                    ixs.push(t as BizTie);
                }
            }
            this.element.ixs = ixs;
        }
        return ok;
    }
}

export class PBizCheckBudOperand extends PElement<BizCheckBudOperand> {
    private options: string;
    private items: string[];
    protected override _parse(): void {
        let hasParenthese = false;
        if (this.ts.token === Token.LPARENTHESE) {
            hasParenthese = true;
            this.ts.readToken();
        }
        if (this.ts.token == Token.LPARENTHESE && this.ts.peekToken().peekToken === Token.SHARP) {
            this.ts.passToken(Token.LPARENTHESE);
            this.ts.passToken(Token.SHARP);
            let bizExp = new BizExp();
            this.context.parseElement(bizExp);
            this.ts.passToken(Token.RPARENTHESE);
            this.element.bizExp1 = bizExp;
        }
        else if (this.ts.token === Token.MOD) {
            this.ts.readToken();
            let bizField = new BizFieldOperand();
            this.context.parseElement(bizField);
            this.element.bizField = bizField;
        }
        else {
            let optionIdVal = new ValueExpression();
            this.context.parseElement(optionIdVal);
            this.element.optionIdVal = optionIdVal;
        }
        if (this.ts.token === Token.EQU) {
            if (this.element.bizField === undefined && this.element.optionIdVal === undefined) {
                this.ts.error('= not expected');
            }
            this.ts.readToken();
            this.options = this.ts.passVar();
            this.ts.passToken(Token.DOT);
            this.items = [this.ts.passVar()];
        }
        else if (this.ts.isKeyword('in') === true) {
            if (this.element.bizField === undefined) {
                this.ts.error('IN not expected');
            }
            this.items = [];
            this.ts.readToken();
            this.options = this.ts.passVar();
            this.ts.passToken(Token.LPARENTHESE);
            for (; ;) {
                this.items.push(this.ts.passVar());
                const { token } = this.ts;
                if (token === Token.COMMA) {
                    this.ts.readToken();
                    continue;
                }
                if (token === Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
            }
        }
        else {
            this.ts.passKey('on');
            this.ts.passToken(Token.LPARENTHESE);
            this.ts.passToken(Token.SHARP);
            let bizExp = new BizExp();
            this.context.parseElement(bizExp);
            this.ts.passToken(Token.RPARENTHESE);
            this.element.bizExp2 = bizExp;
        }
        if (hasParenthese === true) {
            this.ts.passToken(Token.RPARENTHESE);
        }
    }

    scan(space: Space): boolean {
        let ok = true;
        const { optionIdVal, bizExp1, bizExp2, bizField } = this.element;
        if (optionIdVal !== undefined) {
            if (optionIdVal.pelement.scan(space) === false) ok = false;
        }
        if (bizExp1 !== undefined) {
            if (bizExp1.pelement.scan(space) === false) ok = false;
        }
        if (bizExp2 !== undefined) {
            if (bizExp2.pelement.scan(space) === false) ok = false;
        }
        if (bizField !== undefined) {
            if (bizField.pelement.scan(space) === false) ok = false;
        }
        if (this.options !== undefined) {
            let { bizEntityArr: [options] } = space.getBizFromEntityArrFromName(this.options);
            if (options.bizPhraseType !== BizPhraseType.options) {
                this.log(`${this.options} is not OPTIONS`);
                ok = false;
            }
            else {
                let bizOptions = options as BizOptions;
                this.element.bizOptions = bizOptions;
                this.element.items = [];
                const { items } = this.element;
                if (this.items.length === 0) {
                    this.log(`no ITEM of OPTIONS ${bizOptions.getJName()} defined`);
                    ok = false;
                }
                else {
                    for (let itm of this.items) {
                        let item = bizOptions.items.find(v => v.name === itm);
                        if (item === undefined) {
                            this.log(`${itm} is not an ITEM of OPTIONS ${bizOptions.getJName()}`);
                            ok = false;
                        }
                        items.push(item);
                    }
                }
            }
        }
        return ok;
    }

    override scan2(uq: Uq): boolean {
        let ok = true;
        const { bizExp1, bizExp2, bizOptions } = this.element;
        let options1 = this.checkBudOptions(bizExp1);
        if (options1 === undefined) {
            return false;
        }
        if (bizExp2 !== undefined) {
            let options2 = this.checkBudOptions(bizExp2);
            if (options2 === undefined) {
                return false;
            }
            if (options1 !== options2) {
                this.log(`the two buds in CHECK have different OPTIONS`);
                ok = false;
            }
        }
        else if (options1 !== bizOptions) {
            this.log(`bud is not OPTIONS ${bizOptions.getJName()}`);
            ok = false;
        }
        return ok;
    }

    private checkBudOptions(bizExp: BizExp): BizOptions {
        let { budProp } = bizExp;
        const notCheck = () => { this.log(`${bizExp.prop} is not options`); }
        if (budProp === undefined) {
            notCheck();
            return;
        }
        const { dataType } = budProp;
        switch (dataType) {
            default:
                notCheck();
                return;
            case BudDataType.check:
            case BudDataType.radio:
                break;
        }
        return (budProp as BizBudCheck).options;
    }
}
