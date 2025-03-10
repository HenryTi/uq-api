"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizCheckBudOperand = exports.PBizExpParam = exports.PBizExp = exports.PBizExpOperand = void 0;
const consts_1 = require("../../consts");
const il_1 = require("../../il");
const BizPhraseType_1 = require("../../il/Biz/BizPhraseType");
const element_1 = require("../element");
const tokens_1 = require("../tokens");
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
// (#Entity.Bud(id)[^|.Prop] IN timeSpan +- delta)
class PBizExp extends element_1.PElement {
    _parse() {
        const { props } = this.element;
        if (this.ts.token === tokens_1.Token.MUL) {
            this.isStar = true;
            this.ts.readToken();
        }
        this.bizEntity = this.ts.passVar();
        if (this.ts.token === tokens_1.Token.DOT) {
            this.ts.readToken();
            this.bud = this.ts.passVar();
            if (this.ts.token === tokens_1.Token.SHARP) {
                this.ts.readToken();
                this.combo = this.ts.passVar();
                this.ts.passToken(tokens_1.Token.LPARENTHESE);
                this.element.comboParams = [];
                let { comboParams } = this.element;
                for (;;) {
                    if (this.ts.token === tokens_1.Token.MUL) {
                        comboParams.push(undefined);
                        this.ts.readToken();
                    }
                    else {
                        let val = new il_1.ValueExpression();
                        this.context.parseElement(val);
                        comboParams.push(val);
                    }
                    if (this.ts.token === tokens_1.Token.COMMA) {
                        this.ts.readToken();
                        if (this.ts.token !== tokens_1.Token.RPARENTHESE)
                            continue;
                        this.ts.readToken();
                        break;
                    }
                    if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                        this.ts.readToken();
                        break;
                    }
                }
                return;
            }
        }
        this.ts.passToken(tokens_1.Token.LPARENTHESE);
        this.element.param = new il_1.BizExpParam();
        let { param } = this.element;
        this.context.parseElement(param);
        this.ts.passToken(tokens_1.Token.RPARENTHESE);
        if (this.ts.token === tokens_1.Token.XOR) {
            let isParent = true;
            this.ts.readToken();
            for (;;) {
                props.push({
                    prop: this.ts.passVar(),
                    sysBud: undefined,
                    budProp: undefined,
                    isParent,
                }); // = this.ts.passVar();
                if (this.ts.token !== tokens_1.Token.BITWISEOR)
                    break;
                this.ts.readToken();
            }
        }
        else if (this.ts.token === tokens_1.Token.DOT) {
            this.ts.readToken();
            let isParent;
            if (this.ts.token === tokens_1.Token.XOR) {
                isParent = true;
                this.ts.readToken();
            }
            for (;;) {
                props.push({
                    prop: this.ts.passVar(),
                    sysBud: undefined,
                    budProp: undefined,
                    isParent,
                });
                if (this.ts.token !== tokens_1.Token.BITWISEOR)
                    break;
                this.ts.readToken();
            }
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
        var _a;
        let ok = true;
        let expIDType;
        if (this.isStar === true) {
            switch (this.bizEntity) {
                default:
                    this.log('Only atom or fork allowed after *');
                    ok = false;
                    break;
                case 'atom':
                    expIDType = il_1.BizExpIDType.atom;
                    break;
                case 'fork':
                    expIDType = il_1.BizExpIDType.fork;
                    break;
            }
            this.element.expIDType = expIDType;
        }
        else {
            let fromEntity = space.getBizFromEntityArrFromName(this.bizEntity);
            if (fromEntity === undefined) {
                ok = false;
                this.log(`'${this.bizEntity}' not defined`);
            }
            else {
                let { bizEntityArr, bizEntitySys } = fromEntity;
                if (bizEntitySys !== undefined) {
                    this.element.bizEntitySys = bizEntitySys;
                    const { props } = this.element;
                    for (const { prop, isParent } of props) {
                        switch (bizEntitySys) {
                            case il_1.EnumEntitySys.fork:
                                const forkProps = il_1.BizAtom.ownFields; // ['id', 'no', 'ex'];
                                if (forkProps.findIndex(v => v === prop) < 0) {
                                    ok = false;
                                    this.log(`FORK prop only ${forkProps.join(',')}`);
                                }
                                break;
                            case il_1.EnumEntitySys.bin:
                                const binProps = il_1.BizSheet.ownFields; // ['id', 'no', 'operator'];
                                if (binProps.findIndex(v => v === prop) < 0) {
                                    ok = false;
                                    this.log(`BIN prop only ${forkProps.join(',')}`);
                                }
                                break;
                        }
                    }
                }
                else {
                    const [be] = bizEntityArr;
                    this.element.bizEntity = be;
                }
            }
        }
        this.element.isReadonly = (_a = space.isReadonly) !== null && _a !== void 0 ? _a : false;
        const { bizEntity, bizEntitySys, in: varIn, param } = this.element;
        if (param !== undefined) {
            if (param.pelement.scan(space) === false) {
                ok = false;
            }
        }
        if (bizEntity === undefined) {
            if (bizEntitySys === undefined) {
                if (expIDType === undefined) {
                    this.log(`${this.bizEntity} is not a Biz Entity`);
                    ok = false;
                }
            }
        }
        else {
            let ret;
            switch (bizEntity.bizPhraseType) {
                default:
                    ok = false;
                    this.log(`${bizEntity.getJName()} must be either Atom, Fork, Bin or Title`);
                    break;
                case BizPhraseType_1.BizPhraseType.atom:
                    ret = this.scanAtom(space);
                    break;
                case BizPhraseType_1.BizPhraseType.fork:
                    ret = this.scanFork(space);
                    break;
                case BizPhraseType_1.BizPhraseType.bin:
                    ret = this.scanBin(space);
                    break;
                case BizPhraseType_1.BizPhraseType.book:
                    ret = this.scanBook(space);
                    break;
                case BizPhraseType_1.BizPhraseType.tie:
                    ret = this.scanTie(space);
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
        const { bizEntity, props } = this.element;
        if (this.checkScalar() === false)
            ok = false;
        let bizAtom = bizEntity;
        let jName = bizEntity.getJName();
        if (this.bud !== undefined) {
            let bud = bizAtom.getBud(this.bud);
            if (bud === undefined) {
                this.log(`FORK ${jName} has not ${this.bud}.`);
                ok = false;
            }
            else {
                props.push({
                    prop: undefined,
                    budProp: bud,
                    sysBud: undefined,
                    isParent: undefined,
                });
            }
            return ok;
        }
        for (let p of props) {
            const { prop } = p;
            if (prop === undefined) {
                p.prop = 'id';
            }
            else if (prop === 'no') {
                p.sysBud = il_1.EnumSysBud.atomNo;
            }
            else if (prop === 'ex') {
                p.sysBud = il_1.EnumSysBud.atomEx;
            }
            else {
                let bud = bizAtom.getBud(prop);
                if (bud === undefined) {
                    this.log(`${jName} does not have prop ${prop}`);
                    ok = false;
                }
                else {
                    p.budProp = bud;
                }
            }
        }
        return ok;
    }
    scanFork(space) {
        let ok = true;
        const { bizEntity, props } = this.element;
        if (this.checkScalar() === false)
            ok = false;
        let bizSpec = bizEntity;
        let jName = bizEntity.getJName();
        if (this.bud !== undefined) {
            let bud = bizSpec.getBud(this.bud);
            if (bud === undefined) {
                this.log(`FORK ${jName} has not ${this.bud}.`);
                ok = false;
            }
            else {
                props.push({
                    prop: undefined,
                    budProp: bud,
                    sysBud: undefined,
                    isParent: undefined,
                });
            }
            return ok;
        }
        for (let p of props) {
            const { prop } = p;
            if (prop === undefined) {
                p.prop = 'id';
            }
            else {
                let bud = bizSpec.getBud(prop);
                if (bud === undefined) {
                    this.log(`${jName} does not have prop ${prop}`);
                    ok = false;
                }
                else {
                    p.budProp = bud;
                }
            }
        }
        return ok;
    }
    scanBin(space) {
        let ok = true;
        const { bizEntity, props } = this.element;
        if (this.checkScalar() === false)
            ok = false;
        let bizBin = bizEntity;
        if (this.bud !== undefined) {
            this.log(`BIN ${bizEntity.getJName()} should not .`);
            ok = false;
            return ok;
        }
        for (let p of props) {
            const { prop, isParent } = p;
            if (prop === undefined) {
                p.prop = 'id';
            }
            else {
                const arr = consts_1.binFieldArr;
                if (arr.includes(prop) === false) {
                    let sysBud;
                    switch (prop) {
                        case 'id':
                            sysBud = il_1.EnumSysBud.id;
                            break;
                        case 'no':
                            sysBud = il_1.EnumSysBud.sheetNo;
                            break;
                        case 'operator':
                            sysBud = il_1.EnumSysBud.sheetOperator;
                            break;
                    }
                    if (sysBud !== undefined) {
                        p.sysBud = sysBud;
                        return ok;
                    }
                    let bud;
                    if (isParent === true) {
                        bud = bizBin.getSheetMainBud(prop);
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
                        p.budProp = bud;
                    }
                }
            }
        }
        return ok;
    }
    scanBook(space) {
        let ok = true;
        const { bizEntity, props } = this.element;
        let title = bizEntity;
        if (this.bud === undefined) {
            this.log(`TITLE ${title.getJName()} should follow .`);
            ok = false;
            return ok;
        }
        else {
            let bud = title.props.get(this.bud);
            if (bud === undefined) {
                this.log(`TITLE ${title.getJName()} does not have ${this.bud} .`);
                ok = false;
                return;
            }
            else {
                this.element.budEntitySub = bud;
                if (this.combo !== undefined) {
                    let { bizEntityArr: [bizGroupByEntity] } = space.getBizFromEntityArrFromName(this.combo);
                    if (bizGroupByEntity.bizPhraseType !== BizPhraseType_1.BizPhraseType.combo) {
                        ok = false;
                        this.log(`${this.combo} is not COMBO`);
                    }
                    else {
                        this.element.combo = bizGroupByEntity;
                        const { combo, comboParams } = this.element;
                        const { length } = combo.keys;
                        if (comboParams.length !== length) {
                            ok = false;
                            this.log(`COMBO ${combo.getJName()} ${length} params`);
                        }
                        else {
                            for (let val of comboParams) {
                                if (val === undefined)
                                    continue;
                                if (val.pelement.scan(space) === false) {
                                    ok = false;
                                }
                            }
                        }
                    }
                    return ok;
                }
                if (this.element.param.params.length !== 1) {
                    ok = false;
                    this.log(`Can only have one param`);
                }
            }
        }
        if (props === undefined)
            return ok;
        for (let p of props) {
            const { prop } = p;
            if (prop === undefined) {
                p.prop = 'value';
            }
            else {
                const arr = ['value', 'count', 'sum', 'avg', 'average', 'max', 'min'];
                if (arr.includes(prop) === false) {
                    this.log(`Title does not have function ${prop}`);
                }
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
                default:
                    // 2: paramType = BizExpParamType.duo; break;
                    // case 3: 
                    paramType = il_1.BizExpParamType.multi;
                    break;
            }
            this.element.paramType = paramType;
        }
    }
    parseArray() {
        if (this.ts.isKeyword('fork') === true) {
            this.element.paramType = il_1.BizExpParamType.fork;
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
            this.ts.expect('FORK or ties');
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
            if (this.element.bizField === undefined
                && this.element.optionIdVal === undefined
                && this.element.bizExp1 === undefined) {
                this.ts.error('= not expected');
            }
            this.ts.readToken();
            this.options = this.ts.passVar();
            this.ts.passToken(tokens_1.Token.DOT);
            this.items = [this.ts.passVar()];
        }
        else if (this.ts.isKeyword('in') === true) {
            if (this.element.bizField === undefined
                && this.element.optionIdVal === undefined
                && this.element.bizExp1 === undefined) {
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
        let { props } = bizExp;
        const { budProp, prop } = props[0];
        const notCheck = () => { this.log(`${prop} is not options`); };
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
//# sourceMappingURL=Biz.Exp.js.map