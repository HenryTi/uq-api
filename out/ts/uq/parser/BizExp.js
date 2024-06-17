"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizCheckBudOperand = exports.PBizExpParam = exports.PBizExp = exports.PBizExpOperand = void 0;
const consts_1 = require("../consts");
const il_1 = require("../il");
const BizPhraseType_1 = require("../il/Biz/BizPhraseType");
const element_1 = require("./element");
const tokens_1 = require("./tokens");
class PBizExpOperand extends element_1.PElement {
    _parse() {
        this.element.bizExp = new il_1.BizExp();
        const { bizExp } = this.element;
        this.context.parseElement(bizExp);
    }
    scan(space) {
        let ok = true;
        const { bizExp } = this.element;
        if (bizExp.pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
}
exports.PBizExpOperand = PBizExpOperand;
// (#Entity.Bud(id).^|Prop IN timeSpan +- delta)
class PBizExp extends element_1.PElement {
    _parse() {
        this.bizEntity = this.ts.passVar();
        if (this.ts.token === tokens_1.Token.DOT) {
            this.ts.readToken();
            this.bud = this.ts.passVar();
        }
        this.ts.passToken(tokens_1.Token.LPARENTHESE);
        this.element.param = new il_1.BizExpParam(); // new ValueExpression();
        let { param } = this.element;
        this.context.parseElement(param);
        this.ts.passToken(tokens_1.Token.RPARENTHESE);
        if (this.ts.token === tokens_1.Token.DOT) {
            this.ts.readToken();
            if (this.ts.token === tokens_1.Token.XOR) {
                this.element.isParent = true;
                this.ts.readToken();
            }
            this.element.prop = this.ts.passVar();
        }
        if (this.ts.isKeyword('in') === true) {
            this.ts.readToken();
            let timeSpan = this.ts.passVar();
            let op;
            let val;
            switch (this.ts.token) {
                case tokens_1.Token.SUB:
                    op = '-';
                    break;
                case tokens_1.Token.ADD:
                    op = '+';
                    break;
            }
            if (op !== undefined) {
                this.ts.readToken();
                val = new il_1.ValueExpression();
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
    scan(space) {
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
            let ret;
            switch (bizEntity.bizPhraseType) {
                default:
                    ok = false;
                    this.log(`${bizEntity.getJName()} must be either Atom, Spec, Bin or Title`);
                    break;
                case BizPhraseType_1.BizPhraseType.atom:
                    ret = this.scanAtom(space);
                    break;
                case BizPhraseType_1.BizPhraseType.fork:
                    ret = this.scanSpec(space);
                    break;
                case BizPhraseType_1.BizPhraseType.bin:
                    ret = this.scanBin(space);
                    break;
                case BizPhraseType_1.BizPhraseType.book:
                    ret = this.scanTitle(space);
                    break;
                case BizPhraseType_1.BizPhraseType.tie:
                    ret = this.scanTie(space);
                    break;
                case BizPhraseType_1.BizPhraseType.duo:
                    ret = this.scanDuo(space);
                    break;
                case BizPhraseType_1.BizPhraseType.combo:
                    ret = this.scanCombo(space);
                    break;
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
    checkScalar() {
        const { bizEntity, param } = this.element;
        if (param.paramType !== il_1.BizExpParamType.scalar) {
            this.log(`${bizEntity.type.toUpperCase()} ${bizEntity.getJName()} does not support TABLE param.`);
            return false;
        }
        return true;
    }
    scanAtom(space) {
        let ok = true;
        const { bizEntity, prop } = this.element;
        if (this.checkScalar() === false)
            ok = false;
        let bizAtom = bizEntity;
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
    scanSpec(space) {
        let ok = true;
        const { bizEntity, prop } = this.element;
        if (this.checkScalar() === false)
            ok = false;
        let bizSpec = bizEntity;
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
    scanBin(space) {
        let ok = true;
        const { bizEntity, prop, isParent } = this.element;
        if (this.checkScalar() === false)
            ok = false;
        let bizBin = bizEntity;
        if (this.bud !== undefined) {
            this.log(`BIN ${bizEntity.getJName()} should not .`);
            ok = false;
        }
        if (prop === undefined) {
            this.element.prop = 'id';
        }
        else {
            const arr = consts_1.binFieldArr;
            if (arr.includes(prop) === false) {
                let bud;
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
    scanTitle(space) {
        let ok = true;
        const { bizEntity, prop } = this.element;
        let title = bizEntity;
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
    scanTie(space) {
        let ok = true;
        const { bizEntity } = this.element;
        let tie = bizEntity;
        if (this.bud !== undefined) {
            this.log(`TIE ${tie.getJName()} should not follow prop.`);
            ok = false;
        }
        return ok;
    }
    scanDuo(space) {
        let ok = true;
        const { bizEntity, param: bizParam } = this.element;
        const { params: [param, param2] } = bizParam;
        let duo = bizEntity;
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
    scanCombo(space) {
        let ok = true;
        const { bizEntity, param: bizParam } = this.element;
        const { params } = bizParam;
        let combo = bizEntity;
        const { length } = combo.keys;
        if (params.length !== length) {
            this.log(`COMBO ${combo.getJName()}(...) should be ${length}`);
            ok = false;
        }
        return ok;
    }
}
exports.PBizExp = PBizExp;
class PBizExpParam extends element_1.PElement {
    _parse() {
        if (this.ts.token === tokens_1.Token.SHARP) {
            this.ts.readToken();
            this.parseArray();
        }
        else {
            const { params } = this.element;
            for (;;) {
                let param = new il_1.ValueExpression();
                params.push(param);
                this.context.parseElement(param);
                if (this.ts.token !== tokens_1.Token.COMMA)
                    break;
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
            let paramType;
            switch (params.length) {
                case 0:
                    paramType = il_1.BizExpParamType.none;
                    break;
                case 1:
                    paramType = il_1.BizExpParamType.scalar;
                    break;
                case 2:
                    paramType = il_1.BizExpParamType.duo;
                    break;
                case 3:
                    paramType = il_1.BizExpParamType.multi;
                    break;
            }
            this.element.paramType = paramType;
        }
    }
    parseArray() {
        if (this.ts.isKeyword('spec') === true) {
            this.element.paramType = il_1.BizExpParamType.spec;
            this.ts.readToken();
            this.ts.passKey('on');
            this.ts.passToken(tokens_1.Token.XOR);
            this.ts.passToken(tokens_1.Token.EQU);
            const param = new il_1.ValueExpression();
            this.element.params.push(param);
            this.context.parseElement(param);
        }
        else if (this.ts.token === tokens_1.Token.VAR) {
            this.element.paramType = il_1.BizExpParamType.ix;
            this.ties = [this.ts.lowerVar];
            this.ts.readToken();
            for (;;) {
                if (this.ts.token !== tokens_1.Token.BITWISEOR)
                    break;
                this.ts.readToken();
                this.ties.push(this.ts.lowerVar);
            }
            this.ts.passKey('on');
            this.ts.passKey('i');
            this.ts.passToken(tokens_1.Token.EQU);
            const param = new il_1.ValueExpression();
            this.element.params.push(param);
            this.context.parseElement(param);
        }
        else {
            this.ts.expect('SPEC or ties');
        }
    }
    scan(space) {
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
            let ixs = [];
            for (let tie of this.ties) {
                let { bizEntityArr: [t] } = space.getBizFromEntityArrFromName(tie);
                if (t === undefined || t.bizPhraseType !== BizPhraseType_1.BizPhraseType.tie) {
                    this.log(`${tie} is not a TIE`);
                    ok = false;
                }
                else {
                    ixs.push(t);
                }
            }
            this.element.ixs = ixs;
        }
        return ok;
    }
}
exports.PBizExpParam = PBizExpParam;
class PBizCheckBudOperand extends element_1.PElement {
    _parse() {
        let hasParenthese = false;
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            hasParenthese = true;
            this.ts.readToken();
        }
        if (this.ts.token == tokens_1.Token.LPARENTHESE && this.ts.peekToken().peekToken === tokens_1.Token.SHARP) {
            this.ts.passToken(tokens_1.Token.LPARENTHESE);
            this.ts.passToken(tokens_1.Token.SHARP);
            let bizExp = new il_1.BizExp();
            this.context.parseElement(bizExp);
            this.ts.passToken(tokens_1.Token.RPARENTHESE);
            this.element.bizExp1 = bizExp;
        }
        else if (this.ts.token === tokens_1.Token.MOD) {
            this.ts.readToken();
            let bizField = new il_1.BizFieldOperand();
            this.context.parseElement(bizField);
            this.element.bizField = bizField;
        }
        else {
            let optionIdVal = new il_1.ValueExpression();
            this.context.parseElement(optionIdVal);
            this.element.optionIdVal = optionIdVal;
        }
        if (this.ts.token === tokens_1.Token.EQU) {
            if (this.element.bizField === undefined && this.element.optionIdVal === undefined) {
                this.ts.error('= not expected');
            }
            this.ts.readToken();
            this.options = this.ts.passVar();
            this.ts.passToken(tokens_1.Token.DOT);
            this.items = [this.ts.passVar()];
        }
        else if (this.ts.isKeyword('in') === true) {
            if (this.element.bizField === undefined) {
                this.ts.error('IN not expected');
            }
            this.items = [];
            this.ts.readToken();
            this.options = this.ts.passVar();
            this.ts.passToken(tokens_1.Token.LPARENTHESE);
            for (;;) {
                this.items.push(this.ts.passVar());
                const { token } = this.ts;
                if (token === tokens_1.Token.COMMA) {
                    this.ts.readToken();
                    continue;
                }
                if (token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
            }
        }
        else {
            this.ts.passKey('on');
            this.ts.passToken(tokens_1.Token.LPARENTHESE);
            this.ts.passToken(tokens_1.Token.SHARP);
            let bizExp = new il_1.BizExp();
            this.context.parseElement(bizExp);
            this.ts.passToken(tokens_1.Token.RPARENTHESE);
            this.element.bizExp2 = bizExp;
        }
        if (hasParenthese === true) {
            this.ts.passToken(tokens_1.Token.RPARENTHESE);
        }
    }
    scan(space) {
        let ok = true;
        const { optionIdVal, bizExp1, bizExp2, bizField } = this.element;
        if (optionIdVal !== undefined) {
            if (optionIdVal.pelement.scan(space) === false)
                ok = false;
        }
        if (bizExp1 !== undefined) {
            if (bizExp1.pelement.scan(space) === false)
                ok = false;
        }
        if (bizExp2 !== undefined) {
            if (bizExp2.pelement.scan(space) === false)
                ok = false;
        }
        if (bizField !== undefined) {
            if (bizField.pelement.scan(space) === false)
                ok = false;
        }
        if (this.options !== undefined) {
            let { bizEntityArr: [options] } = space.getBizFromEntityArrFromName(this.options);
            if (options.bizPhraseType !== BizPhraseType_1.BizPhraseType.options) {
                this.log(`${this.options} is not OPTIONS`);
                ok = false;
            }
            else {
                let bizOptions = options;
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
    scan2(uq) {
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
    checkBudOptions(bizExp) {
        let { budProp } = bizExp;
        const notCheck = () => { this.log(`${bizExp.prop} is not options`); };
        if (budProp === undefined) {
            notCheck();
            return;
        }
        const { dataType } = budProp;
        switch (dataType) {
            default:
                notCheck();
                return;
            case BizPhraseType_1.BudDataType.check:
            case BizPhraseType_1.BudDataType.radio:
                break;
        }
        return budProp.options;
    }
}
exports.PBizCheckBudOperand = PBizCheckBudOperand;
//# sourceMappingURL=BizExp.js.map