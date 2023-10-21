"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizEntity = exports.PBizBase = void 0;
const il_1 = require("../../il");
const element_1 = require("../element");
const tokens_1 = require("../tokens");
class PBizBase extends element_1.PElement {
    constructor() {
        super(...arguments);
        this.parseOptions = {
            history: (bizBud) => {
                bizBud.hasHistory = true;
                this.ts.readToken();
            },
            index: (bizBud) => {
                bizBud.flag |= il_1.BudIndex.index;
                this.ts.readToken();
            },
            format: (bizBud) => {
                this.ts.readToken();
                this.ts.mayPassToken(tokens_1.Token.EQU);
                bizBud.format = this.ts.passString();
            },
            set: (bizBud) => {
                this.ts.readToken();
                this.ts.mayPassToken(tokens_1.Token.EQU);
                let setTypeText = this.ts.passKey();
                let setType;
                switch (setTypeText) {
                    default:
                        this.ts.expect('assign', 'cumulate', 'balance');
                        break;
                    case 'assign':
                    case '赋值':
                        setType = il_1.SetType.assign;
                        break;
                    case 'cumulate':
                    case '累加':
                        setType = il_1.SetType.cumulate;
                        break;
                    case 'balance':
                    case '结余':
                        setType = il_1.SetType.balance;
                        break;
                }
                bizBud.setType = setType;
            }
        };
    }
    _parse() {
        this.parseHeader();
        this.parseBody();
    }
    parseHeader() {
        let jName;
        const { token } = this.ts;
        if (token === tokens_1.Token.VAR) {
            this.element.nameStartAt = this.sourceStart;
            this.element.name = this.ts.lowerVar;
            jName = this.ts._var;
            this.ts.readToken();
        }
        else if (token === tokens_1.Token.DOLLARVAR || token === tokens_1.Token.DOLLAR) {
            if (this.context.isSys === true) {
                this.element.nameStartAt = this.sourceStart;
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
        this.element.setJName(jName);
        this.parseParam();
    }
    parseBody() {
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
    parseSubItem() {
        this.ts.assertToken(tokens_1.Token.VAR);
        let name = this.ts.lowerVar;
        this.ts.readToken();
        // if (this.isValidPropName(name) === false) {
        //    return;
        // }
        let caption = this.ts.mayPassString();
        let bizBud = this.parseBud(name, caption);
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
        const tokens = [tokens_1.Token.EQU, tokens_1.Token.COLONEQU, tokens_1.Token.SEMICOLON, tokens_1.Token.COMMA, tokens_1.Token.RPARENTHESE];
        const { token } = this.ts;
        if (tokens.includes(token) === true) {
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
        let bizBud = new Bud(this.element.biz, name, caption);
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
            let exp;
            let query;
            if (this.ts.token === tokens_1.Token.LBRACE) {
                query = new il_1.BizQueryValue(this.element.biz);
                this.context.parseElement(query);
            }
            else {
                exp = new il_1.ValueExpression();
                this.context.parseElement(exp);
            }
            bizBud.value = {
                exp,
                act,
                query,
            };
        }
        if (this.element.okToDefineNewName(name) === false) {
            this.ts.error(`${name} can not be used multiple times`);
        }
        const options = {};
        for (;;) {
            if (this.ts.isKeyword(undefined) === false)
                break;
            let { lowerVar: option } = this.ts;
            if (options[option] === true) {
                this.ts.error(`${option} can define once`);
            }
            let parse = this.parseOptions[option];
            if (parse === undefined)
                break;
            parse(bizBud);
            options[option] = true;
        }
        if (bizBud.setType === undefined) {
            bizBud.setType = il_1.SetType.assign;
        }
        return bizBud;
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
            if (this.ts.token === tokens_1.Token.LBRACE) {
                this.ts.readToken();
                for (;;) {
                    let prop = this.parseSubItem();
                    this.ts.passToken(tokens_1.Token.SEMICOLON);
                    this.element.props.set(prop.name, prop);
                    if (this.ts.token === tokens_1.Token.RBRACE) {
                        this.ts.readToken();
                        this.ts.mayPassToken(tokens_1.Token.SEMICOLON);
                        break;
                    }
                }
            }
            else {
                let prop = this.parseSubItem();
                this.ts.passToken(tokens_1.Token.SEMICOLON);
                this.element.props.set(prop.name, prop);
            }
        };
    }
    saveSource() {
        let entityType = this.element.type.toUpperCase();
        let source = this.getSource();
        this.element.source = entityType + ' ' + source;
    }
    parseContent() {
        const keyColl = this.keyColl;
        /*
        {
            prop: this.parseProp,
        };
        */
        const keys = Object.keys(keyColl);
        for (;;) {
            if (this.ts.token === tokens_1.Token.RBRACE)
                break;
            let parse = keyColl[this.ts.lowerVar];
            if (this.ts.varBrace === true || parse === undefined) {
                this.ts.expect(...keys);
            }
            this.ts.readToken();
            parse();
        }
    }
    parsePermitOne(permissionLetters) {
        let role;
        let permission = {};
        // , a: boolean, n: boolean, c: boolean, r: boolean, u: boolean, d: boolean, l: boolean;
        switch (this.ts.token) {
            default:
                this.ts.expectToken(tokens_1.Token.VAR, tokens_1.Token.MUL, tokens_1.Token.SUB);
                break;
            case tokens_1.Token.MUL:
                role = '*';
                this.ts.readToken();
                break;
            case tokens_1.Token.VAR:
                role = this.ts.lowerVar;
                this.ts.readToken();
                break;
        }
        if (this.ts.token === tokens_1.Token.VAR && this.ts.varBrace === false) {
            let letters = this.ts.lowerVar;
            this.ts.readToken();
            for (let i = 0; i < letters.length; i++) {
                let c = letters.charAt(i);
                if (permissionLetters.includes(c) === true) {
                    permission[c] = true;
                }
                else {
                    this.ts.error(`${c} is a valid permission letter`);
                }
            }
        }
        else {
            permission.a = true;
        }
        this.element.permissions[role] = permission;
    }
    parsePermission(permissionLetters) {
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            for (;;) {
                this.parsePermitOne(permissionLetters);
                if (this.ts.token === tokens_1.Token.COMMA) {
                    this.ts.readToken();
                    if (this.ts.token === tokens_1.Token.RBRACE) {
                        this.ts.readToken();
                        break;
                    }
                    continue;
                }
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
            }
        }
        else {
            this.parsePermitOne(permissionLetters);
        }
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
    scanPermission(space) {
        let ok = true;
        let { permissions } = this.element;
        for (let i in permissions) {
            if (i === '*')
                continue;
            let entity = space.getBizEntity(i);
            if (entity === undefined || entity.type !== 'role') {
                this.log(`${i} is not a ROLE`);
                ok = false;
            }
        }
        return ok;
    }
    scanBud(space, bud) {
        let { pelement, value } = bud;
        if (pelement === undefined) {
            if (value !== undefined) {
                const { exp, query } = value;
                if (exp !== undefined) {
                    if (exp.pelement.scan(space) === false)
                        return false;
                }
                if (query !== undefined) {
                    if (query.pelement.scan(space) === false)
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
        if (this.scanPermission(space) === false)
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