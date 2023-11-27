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
                let format = this.ts.passString();
                // bizBud.format = format;
                bizBud.ui.format = format;
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
    expectName() {
        this.ts.expect(`name of ${this.element.type}`);
    }
    nameShouldNotStartsWith$() {
        this.ts.error('$ can not be in a entity name');
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
                this.nameShouldNotStartsWith$();
            }
        }
        else {
            this.expectName();
        }
        if (this.ts.isKeyword('ver') === true) {
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.NUM) {
                this.ts.expectToken(tokens_1.Token.NUM);
            }
            this.element.ver = this.ts.dec;
            this.ts.readToken();
        }
        this.element.ui = this.parseUI();
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
        let ui = this.parseUI();
        let bizBud = this.parseBud(name, ui);
        return bizBud;
    }
    isValidPropName(prop) {
        if (invalidPropNames[prop] === true) {
            this.ts.error(`${names.join(',')} can not be used as Prop name`);
            return false;
        }
        return true;
    }
    parseBud(name, ui, defaultType) {
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
        let key;
        const tokens = [tokens_1.Token.EQU, tokens_1.Token.COLONEQU, tokens_1.Token.COLON, tokens_1.Token.SEMICOLON, tokens_1.Token.COMMA, tokens_1.Token.RPARENTHESE];
        const { token } = this.ts;
        if (tokens.includes(token) === true) {
            key = defaultType !== null && defaultType !== void 0 ? defaultType : 'none';
        }
        else {
            key = this.ts.lowerVar;
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
        let bizBud = new Bud(this.element.biz, name, ui);
        if (this.ts.isKeyword('required') === true) {
            bizBud.ui.required = true;
            this.ts.readToken();
        }
        bizBud.parser(this.context).parse();
        if (this.element.hasProp(name) === true) {
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
    bizEntityScan2(bizEntity) {
        return true;
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
            let name;
            let ui;
            if (this.ts.token === tokens_1.Token.ADD) {
                this.ts.readToken();
                name = '+';
                ui = this.parseUI();
            }
            else if (this.ts.token === tokens_1.Token.VAR) {
                name = this.ts.passVar();
                ui = this.parseUI();
            }
            if (this.ts.token === tokens_1.Token.LBRACE) {
                this.ts.readToken();
                let budGroup;
                if (name === undefined) {
                    budGroup = this.element.group0;
                }
                else if (name === '+') {
                    budGroup = this.element.group1;
                }
                else {
                    budGroup = this.element.budGroups.get(name);
                    if (budGroup === undefined) {
                        budGroup = new il_1.BudGroup(this.element.biz, name);
                        budGroup.ui = ui;
                        this.element.budGroups.set(name, budGroup);
                    }
                }
                for (;;) {
                    let bud = this.parseSubItem();
                    this.ts.passToken(tokens_1.Token.SEMICOLON);
                    this.element.props.set(bud.name, bud);
                    budGroup.buds.push(bud);
                    if (this.ts.token === tokens_1.Token.RBRACE) {
                        this.ts.readToken();
                        this.ts.mayPassToken(tokens_1.Token.SEMICOLON);
                        break;
                    }
                }
            }
            else {
                if (name === undefined) {
                    this.ts.expectToken(tokens_1.Token.LBRACE);
                }
                let bizBud = this.parseBud(name, ui);
                this.element.group0.buds.push(bizBud);
                this.ts.passToken(tokens_1.Token.SEMICOLON);
                this.element.props.set(bizBud.name, bizBud);
            }
        };
    }
    saveSource() {
        const { type } = this.element;
        let entityType = type.toUpperCase();
        let source = this.getSource();
        this.element.source = entityType + ' ' + this.getNameInSource() + source;
    }
    getNameInSource() {
        return this.element.getJName() + ' ';
    }
    parseContent() {
        const keyColl = this.keyColl;
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
    parseBudAtom(itemName) {
        let ui = this.parseUI();
        let bud = new il_1.BizBudAtom(this.element.biz, itemName, ui);
        if (this.ts.isKeyword('pick') === true) {
            this.ts.readToken();
        }
        this.context.parseElement(bud);
        // this.parseBudEqu(bud);
        this.ts.passToken(tokens_1.Token.SEMICOLON);
        return bud;
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
    parseIxField(ixField) {
        ixField.caption = this.ts.mayPassString();
        ixField.atoms = this.parseAtoms();
    }
    parseAtoms() {
        if (this.ts.isKeyword('me') === true) {
            this.ts.readToken();
            this.ts.passToken(tokens_1.Token.SEMICOLON);
            return undefined;
        }
        let ret = [this.ts.passVar()];
        for (;;) {
            if (this.ts.token !== tokens_1.Token.BITWISEOR)
                break;
            this.ts.readToken();
            ret.push(this.ts.passVar());
        }
        this.ts.passToken(tokens_1.Token.SEMICOLON);
        return ret;
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
        let ok = true;
        let { pelement, name, value } = bud;
        if (this.element.budGroups.has(name) === true) {
            this.log(`Prop name ${name} duplicates with Group name`);
            ok = false;
        }
        if (pelement === undefined) {
            if (value !== undefined) {
                const { exp } = value;
                if (exp !== undefined) {
                    if (exp.pelement.scan(space) === false) {
                        ok = false;
                    }
                }
            }
            return ok;
        }
        if (pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
    scanBuds(space, buds) {
        let ok = true;
        for (let [, value] of buds) {
            if (this.scanBud(space, value) === false)
                ok = false;
        }
        return ok;
    }
    scanIxField(space, tieField) {
        let ok = true;
        let atoms = [];
        let atomNames = tieField.atoms;
        if (atomNames === undefined) {
            if (tieField.caption !== undefined) {
                this.log(`TIE ME field should not define caption`);
                ok = false;
            }
            return ok;
        }
        for (let name of atomNames) {
            let bizEntity = space.getBizEntity(name);
            let { bizPhraseType } = bizEntity;
            if (bizPhraseType === il_1.BizPhraseType.atom || bizPhraseType === il_1.BizPhraseType.spec) {
                atoms.push(bizEntity);
            }
            else {
                this.log(`${name} is neither ATOM nor SPEC`);
                ok = false;
            }
        }
        tieField.atoms = atoms;
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
    scan2(uq) {
        let ok = true;
        if (this.bizEntityScan2(this.element) === false)
            ok = false;
        return ok;
    }
    bizEntityScan2(bizEntity) {
        let ok = true;
        let { props, biz } = bizEntity;
        for (let [, value] of props) {
            let { pelement } = value;
            if (pelement === undefined)
                continue;
            if (pelement.bizEntityScan2(bizEntity) === false)
                ok = false;
        }
        return ok;
    }
}
exports.PBizEntity = PBizEntity;
//# sourceMappingURL=Base.js.map