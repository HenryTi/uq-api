"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizEntity = exports.PBizBase = void 0;
const il_1 = require("../../il");
const element_1 = require("../element");
const tokens_1 = require("../tokens");
class PBizBase extends element_1.PElement {
    _parse() {
        let jName;
        const { token } = this.ts;
        if (token === tokens_1.Token.VAR) {
            this.element.name = this.ts.lowerVar;
            jName = this.ts._var;
            this.ts.readToken();
        }
        else if (token === tokens_1.Token.DOLLARVAR || token === tokens_1.Token.DOLLAR) {
            if (this.context.isSys === true) {
                this.element.name = this.ts.lowerVar;
                jName = this.ts._var;
                this.ts.readToken();
            }
            else {
                this.ts.error('$ can not be in a entity name');
            }
        }
        else {
            this.ts.expect(`name of ${this.element.type}`);
        }
        if (this.ts.isKeyword('ver') === true) {
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.NUM) {
                this.ts.expectToken(tokens_1.Token.NUM);
            }
            this.element.ver = this.ts.dec;
            this.ts.readToken();
        }
        if (this.ts.token === tokens_1.Token.STRING) {
            this.element.caption = this.ts.text;
            this.ts.readToken();
        }
        /*
        else {
            if (jName !== this.element.name) {
                this.element.caption = jName;
            }
        }
        */
        this.element.setJName(jName);
        this.parseParam();
        if (this.ts.token === tokens_1.Token.LBRACE) {
            this.ts.readToken();
            if (this.ts.token === tokens_1.Token.RBRACE) {
                this.ts.readToken();
                this.ts.mayPassToken(tokens_1.Token.SEMICOLON);
                return;
            }
            this.parseContent();
            this.ts.passToken(tokens_1.Token.RBRACE);
            this.ts.mayPassToken(tokens_1.Token.SEMICOLON);
        }
        else {
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        }
    }
    parseParam() {
    }
    parseContent() {
    }
    parseDefault() {
    }
    scanAtomID(space, atomName) {
        let Atom = space.uq.biz.bizEntities.get(atomName);
        const types = [il_1.BizPhraseType.atom, il_1.BizPhraseType.spec, il_1.BizPhraseType.bud];
        if (Atom === undefined || types.indexOf(Atom.bizPhraseType) < 0) {
            this.log(`${atomName} is not an Atom ID`);
            return undefined;
        }
        else {
            return Atom;
        }
    }
    getBizEntity(space, entityName, ...bizPhraseType) {
        let bizEntity = space.uq.biz.bizEntities.get(entityName);
        if (bizPhraseType === undefined || bizPhraseType.length === 0) {
            if (bizEntity !== undefined) {
                return bizEntity;
            }
            this.log(`${entityName} is not a Biz Entity`);
            return undefined;
        }
        if (bizEntity !== undefined) {
            if (bizPhraseType.indexOf(bizEntity.bizPhraseType) >= 0) {
                return bizEntity;
            }
        }
        this.log(`${entityName} is not a Biz ${bizPhraseType.map(v => il_1.BizPhraseType[v]).join(', ')}`);
        return undefined;
    }
}
exports.PBizBase = PBizBase;
const names = ['i', 'x', 'value', 'price', 'amount', 'si', 'sx'];
const invalidPropNames = (function () {
    let ret = {};
    for (let v of names) {
        ret[v] = true;
    }
    return ret;
})();
class PBizEntity extends PBizBase {
    constructor() {
        super(...arguments);
        this.parseProp = () => {
            let prop = this.parseSubItem();
            this.element.props.set(prop.name, prop);
        };
    }
    saveSource() {
        let entityType = this.element.type.toUpperCase();
        let source = this.getSource();
        this.element.source = entityType + ' ' + source;
    }
    parseSubItem() {
        this.ts.assertToken(tokens_1.Token.VAR);
        let name = this.ts.lowerVar;
        this.ts.readToken();
        if (this.isValidPropName(name) === false) {
            return;
        }
        let caption = this.ts.mayPassString();
        let bizBud = this.parseBud(name, caption);
        this.ts.passToken(tokens_1.Token.SEMICOLON);
        return bizBud;
    }
    isValidPropName(prop) {
        if (invalidPropNames[prop] === true) {
            this.ts.error(`${names.join(',')} can not be used as Prop name`);
            return false;
        }
        return true;
    }
    parseBud(name, caption) {
        const keyColl = {
            none: il_1.BizBudNone,
            int: il_1.BizBudInt,
            dec: il_1.BizBudDec,
            char: il_1.BizBudChar,
            atom: il_1.BizBudAtom,
            date: il_1.BizBudDate,
            intof: il_1.BizBudIntOf,
            radio: il_1.BizBudRadio,
            check: il_1.BizBudCheck,
        };
        const keys = Object.keys(keyColl);
        let key = this.ts.lowerVar;
        const tokens = [tokens_1.Token.EQU, tokens_1.Token.COLONEQU, tokens_1.Token.SEMICOLON];
        if (tokens.includes(this.ts.token) === true) {
            key = 'none';
        }
        else {
            if (this.ts.varBrace === true) {
                this.ts.expect(...keys);
            }
            if (key === 'int') {
                this.ts.readToken();
                if (this.ts.isKeyword('of') === true) {
                    key = 'intof';
                    this.ts.readToken();
                }
            }
            else {
                this.ts.readToken();
            }
        }
        let Bud = keyColl[key];
        if (Bud === undefined) {
            this.ts.expect(...keys);
        }
        let bizBud = new Bud(name, caption);
        bizBud.parser(this.context).parse();
        let act;
        switch (this.ts.token) {
            case tokens_1.Token.EQU:
                act = il_1.BudValueAct.equ;
                break;
            case tokens_1.Token.COLONEQU:
                act = il_1.BudValueAct.init;
                break;
        }
        if (act !== undefined) {
            this.ts.readToken();
            let value = new il_1.ValueExpression();
            this.context.parseElement(value);
            bizBud.value = {
                exp: value,
                act,
            };
        }
        if (this.ts.isKeyword('history') === true) {
            bizBud.hasHistory = true;
            this.ts.readToken();
        }
        if (this.element.checkName(name) === false) {
            this.ts.error(`${name} can not be used multiple times`);
        }
        if (this.ts.isKeyword('index') === true) {
            if (bizBud.canIndex === true) {
                bizBud.flag |= il_1.BudFlag.index;
                this.ts.readToken();
            }
            else {
                this.ts.error('only int or atom can index');
            }
        }
        return bizBud;
    }
    scanBud(space, bud) {
        let { pelement, value } = bud;
        if (pelement === undefined) {
            if (value !== undefined) {
                const { exp } = value;
                if (exp !== undefined) {
                    if (exp.pelement.scan(space) === false)
                        return false;
                }
            }
            return true;
        }
        if (pelement.scan(space) === false)
            return false;
        return true;
    }
    scanBuds(space, buds) {
        let ok = true;
        for (let [, value] of buds) {
            if (this.scanBud(space, value) === false)
                ok = false;
        }
        return ok;
    }
    scan(space) {
        let ok = true;
        const { props } = this.element;
        if (this.scanBuds(space, props) === false)
            ok = false;
        return ok;
    }
    scan2Buds(uq, buds) {
        let ok = true;
        for (let [, value] of buds) {
            let { pelement } = value;
            if (pelement === undefined)
                continue;
            if (pelement.scan2(uq) === false)
                ok = false;
        }
        return ok;
    }
    scan2(uq) {
        let ok = true;
        const { props } = this.element;
        if (this.scan2Buds(uq, props) === false)
            ok = false;
        // if (this.scan2Buds(uq, assigns) === false) ok = false;
        return ok;
    }
}
exports.PBizEntity = PBizEntity;
//# sourceMappingURL=Base.js.map