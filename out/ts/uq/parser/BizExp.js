"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizExpParam = exports.PBizExp = exports.PBizExpOperand = void 0;
const il_1 = require("../il");
const element_1 = require("./element");
const tokens_1 = require("./tokens");
/*
interface Tbl {
    entityArr: string[];
    alias: string;
}

interface Join {
    joinType: BizSelectJoinType;
    tbl: Tbl;
}

interface From {
    main: Tbl;
    joins: Join[];
}
*/
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
                this.element.prop = 'base';
                this.ts.readToken();
            }
            else {
                this.element.prop = this.ts.passVar();
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
        let ok = true;
        this.element.bizEntity = space.getBizEntity(this.bizEntity);
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
                    this.log(`${bizEntity.jName} must be either Atom, Spec, Bin or Title`);
                    break;
                case il_1.BizPhraseType.atom:
                    ret = this.scanAtom(space);
                    break;
                case il_1.BizPhraseType.spec:
                    ret = this.scanSpec(space);
                    break;
                case il_1.BizPhraseType.bin:
                    ret = this.scanBin(space);
                    break;
                case il_1.BizPhraseType.title:
                    ret = this.scanTitle(space);
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
            this.log(`${bizEntity.type.toUpperCase()} ${bizEntity.jName} does not support TABLE param.`);
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
            this.log(`ATOM ${bizEntity.jName} should not .`);
            ok = false;
        }
        if (prop === undefined) {
            this.element.prop = 'id';
        }
        else {
            if (bizAtom.okToDefineNewName(prop) === false) {
                this.log(`${bizAtom.jName} does not have prop ${prop}`);
                ok = false;
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
            this.log(`SPEC ${bizEntity.jName} should not .`);
            ok = false;
        }
        if (prop === undefined) {
            this.element.prop = 'id';
        }
        else {
            if (bizSpec.okToDefineNewName(prop) === false) {
                this.log(`${bizSpec.jName} does not have prop ${prop}`);
                ok = false;
            }
        }
        return ok;
    }
    scanBin(space) {
        let ok = true;
        const { bizEntity, prop } = this.element;
        if (this.checkScalar() === false)
            ok = false;
        let bizBin = bizEntity;
        if (this.bud !== undefined) {
            this.log(`BIN ${bizEntity.jName} should not .`);
            ok = false;
        }
        if (prop === undefined) {
            this.element.prop = 'id';
        }
        else {
            const arr = ['i', 'x', 'price', 'amount', 'value'];
            if (arr.includes(prop) === false || bizBin.okToDefineNewName(prop) === false) {
                this.log(`${bizBin.jName} does not have prop ${prop}`);
                ok = false;
            }
        }
        return ok;
    }
    scanTitle(space) {
        let ok = true;
        const { bizEntity, prop } = this.element;
        let title = bizEntity;
        if (this.bud === undefined) {
            this.log(`TITLE ${title.jName} should follow .`);
            ok = false;
        }
        else {
            let bud = title.props.get(this.bud);
            if (bud === undefined) {
                this.log(`TITLE ${title.getJName()} does not have ${this.bud} .`);
                ok = false;
            }
            else {
                this.element.bud = bud;
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
}
exports.PBizExp = PBizExp;
class PBizExpParam extends element_1.PElement {
    _parse() {
        if (this.ts.token === tokens_1.Token.SHARP) {
            this.ts.readToken();
            this.parseArray();
        }
        else {
            this.element.param = new il_1.ValueExpression();
            this.element.paramType = il_1.BizExpParamType.scalar;
            const { param } = this.element;
            this.context.parseElement(param);
        }
    }
    parseArray() {
        if (this.ts.isKeyword('spec') === true) {
            this.element.paramType = il_1.BizExpParamType.spec;
            this.ts.readToken();
            this.ts.passKey('on');
            this.ts.passToken(tokens_1.Token.XOR);
            this.ts.passToken(tokens_1.Token.EQU);
            this.element.param = new il_1.ValueExpression();
            this.context.parseElement(this.element.param);
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
            this.element.param = new il_1.ValueExpression();
            this.context.parseElement(this.element.param);
        }
        else {
            this.ts.expect('SPEC or ties');
        }
    }
    scan(space) {
        let ok = true;
        const { param } = this.element;
        if (param !== undefined) {
            if (param.pelement.scan(space) === false) {
                ok = false;
            }
        }
        if (this.ties !== undefined) {
            let ixs = [];
            for (let tie of this.ties) {
                let t = space.getBizEntity(tie);
                if (t === undefined || t.bizPhraseType !== il_1.BizPhraseType.tie) {
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
//# sourceMappingURL=BizExp.js.map