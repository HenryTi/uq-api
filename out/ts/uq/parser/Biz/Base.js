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
            let defName = this.defaultName;
            if (defName === undefined) {
                this.ts.expect(`name of ${this.element.type}`);
            }
            this.element.name = defName;
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
        else {
            if (jName !== this.element.name) {
                this.element.caption = jName;
            }
        }
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
    scanAtom(space, atomName) {
        let Atom = space.uq.biz.bizEntities.get(atomName);
        if (Atom === undefined || Atom.type !== 'atom') {
            this.log(`${atomName} is not an Atom`);
            return undefined;
        }
        else {
            return Atom;
        }
    }
    scanID(space, idName) {
        let entity = space.uq.entities[idName];
        if (entity === undefined || entity.type !== 'id') {
            this.log(`${idName} is not an ID`);
            return undefined;
        }
        else {
            return entity;
        }
    }
    scanIX(space, ixName) {
        let entity = space.uq.entities[ixName];
        if (entity === undefined || entity.type !== 'ix') {
            this.log(`${ixName} is not an IX`);
            return undefined;
        }
        else {
            return entity;
        }
    }
    scanSpec(space, SpecName) {
        let Spec = space.uq.biz.bizEntities.get(SpecName);
        if (Spec === undefined || Spec.type !== 'spec') {
            this.log(`${SpecName} is not an Spec`);
            return undefined;
        }
        else {
            return Spec;
        }
    }
    getBizEntity(space, entityName, entityType) {
        let bizEntity = space.uq.biz.bizEntities.get(entityName);
        if (bizEntity !== undefined && bizEntity.type === entityType) {
            return bizEntity;
        }
        this.log(`${entityName} is not a Biz ${entityType.toUpperCase()}`);
        return undefined;
    }
}
exports.PBizBase = PBizBase;
const names = ['id', 'ix', 'idx', 'item', 'base', 'no', 'value', 'v1', 'v2', 'v3', 'operator'];
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
            let prop = this.parseSubItem('prop');
            this.element.props.set(prop.name, prop);
        };
        this.parseAssign = () => {
            let prop = this.parseSubItem('assign');
            this.element.assigns.set(prop.name, prop);
        };
    }
    parseSubItem(type) {
        this.ts.assertToken(tokens_1.Token.VAR);
        let name = this.ts.lowerVar;
        this.ts.readToken();
        if (this.isValidPropName(name) === false) {
            return;
        }
        let caption = this.ts.mayPassString();
        let bizBud = this.parseBud(type, name, caption);
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
    parseBud(type, name, caption) {
        const keyColl = {
            none: il_1.BizBudNone,
            int: il_1.BizBudInt,
            dec: il_1.BizBudDec,
            char: il_1.BizBudChar,
            id: il_1.BizBudID,
            atom: il_1.BizBudAtom,
            date: il_1.BizBudDate,
            radio: il_1.BizBudRadio,
            check: il_1.BizBudCheck,
        };
        const keys = Object.keys(keyColl);
        let key = this.ts.lowerVar;
        if (this.ts.token === tokens_1.Token.SEMICOLON) {
            key = 'none';
        }
        else {
            if (this.ts.varBrace === true) {
                this.ts.expect(...keys);
            }
            this.ts.readToken();
        }
        let Bud = keyColl[key];
        if (Bud === undefined) {
            this.ts.expect(...keys);
        }
        let bizBud = new Bud(type, name, caption);
        bizBud.parser(this.context).parse();
        if (this.ts.token === tokens_1.Token.EQU) {
            this.ts.readToken();
            let value;
            switch (this.ts.token) {
                default:
                    this.ts.expectToken(tokens_1.Token.STRING, tokens_1.Token.NUM);
                    break;
                case tokens_1.Token.STRING:
                    value = this.ts.text;
                    break;
                case tokens_1.Token.NUM:
                    value = this.ts.dec;
                    break;
            }
            bizBud.value = value;
            this.ts.readToken();
        }
        if (this.ts.isKeyword('history') === true) {
            bizBud.hasHistory = true;
            this.ts.readToken();
        }
        if (this.element.checkName(name) === false) {
            this.ts.error(`${name} can not be used multiple times`);
        }
        if (this.ts.isKeyword('index') === true) {
            bizBud.hasIndex = true;
            this.ts.readToken();
        }
        return bizBud;
    }
    scanBud(space, bud) {
        let { pelement } = bud;
        if (pelement === undefined)
            return true;
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
        const { props, assigns } = this.element;
        if (this.scanBuds(space, props) === false)
            ok = false;
        if (this.scanBuds(space, assigns) === false)
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
        const { props, assigns } = this.element;
        if (this.scan2Buds(uq, props) === false)
            ok = false;
        if (this.scan2Buds(uq, assigns) === false)
            ok = false;
        return ok;
    }
}
exports.PBizEntity = PBizEntity;
//# sourceMappingURL=Base.js.map