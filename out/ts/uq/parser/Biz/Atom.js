"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizPick = exports.PBizAtomBud = exports.PBizAtomSpec = exports.PBizAtom = exports.PBizAtomID = void 0;
const il_1 = require("../../il");
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
class PBizAtomID extends Base_1.PBizEntity {
    parseParam() {
        if (this.ts.isKeyword('extends') === true) {
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.VAR) {
                this.ts.expectToken(tokens_1.Token.VAR);
            }
            this.extendsName = this.ts.lowerVar;
            this.ts.readToken();
        }
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false)
            ok = false;
        if (this.extendsName !== undefined) {
            let atom = this.scanAtomID(space, this.extendsName);
            if (atom === undefined) {
                ok = false;
            }
            else {
                this.element.extends = atom;
                if (this.checkRecursive('EXTENDS', (p) => p.extends) === false) {
                    ok = false;
                }
            }
        }
        return ok;
    }
    checkRecursive(recursiveCaption, getPrev) {
        let ok = true;
        const coll = {};
        const atomName = this.element.name;
        coll[atomName] = this.element;
        for (let p = this.element; p !== undefined;) {
            let prev = getPrev(p);
            if (prev === undefined)
                break;
            const { name: prevName } = prev;
            if (coll[prevName] !== undefined) {
                this.log(`Atom ${atomName} ${recursiveCaption} recursive ${p.name}`);
                ok = false;
                break;
            }
            coll[prevName] = prev;
            p = prev;
        }
        return ok;
    }
}
exports.PBizAtomID = PBizAtomID;
class PBizAtom extends PBizAtomID {
    constructor() {
        super(...arguments);
        this.parseEx = () => {
            this.ts.readToken();
            let caption = this.ts.mayPassString();
            let bizBud = this.parseBud('ex', caption);
            this.ts.passToken(tokens_1.Token.SEMICOLON);
            this.element.ex = bizBud;
        };
        this.parseUom = () => {
            if (this.element.uom !== undefined) {
                this.ts.error('UOM can only be defined once');
            }
            this.element.uom = true;
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
    }
    parseParam() {
        super.parseParam();
        if (this.ts.isKeyword('uuid') === true) {
            this.element.uuid = true;
            this.ts.readToken();
        }
    }
    parseContent() {
        const keyColl = {
            uom: this.parseUom,
            prop: this.parseProp,
            ex: this.parseEx,
        };
        const keys = Object.keys(keyColl);
        for (;;) {
            let parse = keyColl[this.ts.lowerVar];
            if (this.ts.varBrace === true || parse === undefined) {
                this.ts.expect(...keys);
            }
            this.ts.readToken();
            parse();
            if (this.ts.token === tokens_1.Token.RBRACE)
                break;
        }
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false)
            ok = false;
        return ok;
    }
    scan2(uq) {
        let ok = true;
        if (super.scan2(uq) === false)
            ok = false;
        this.copyUom();
        return ok;
    }
    copyUom() {
        let atoms = [];
        for (let p = this.element; p !== undefined; p = p.extends) {
            if (p.uom === true) {
                for (let atom of atoms)
                    atom.uom = true;
                break;
            }
            else {
                atoms.push(p);
            }
        }
    }
}
exports.PBizAtom = PBizAtom;
class PBizAtomIDWithBase extends PBizAtomID {
    constructor() {
        super(...arguments);
        this.parseBase = () => {
            if (this.baseName !== undefined) {
                this.ts.error('BASE can only be defined once');
            }
            if (this.ts.token === tokens_1.Token.VAR) {
                this.baseName = this.ts.lowerVar;
                this.ts.readToken();
            }
            else {
                // 定义了base，没有base name
                this.baseName = null;
            }
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false)
            ok = false;
        if (this.baseName === null) {
            this.element.base = il_1.BizAtomIDAny.current;
        }
        else if (this.baseName === undefined) {
            this.log('BASE must be defined');
            ok = false;
        }
        else {
            let base = this.scanAtomID(space, this.baseName);
            if (base === undefined) {
                ok = false;
            }
            else {
                this.element.base = base;
                if (this.checkRecursive('BASE', (p) => p.base) === false) {
                    ok = false;
                }
            }
        }
        if (this.assertSingleBase() === false) {
            ok = false;
        }
        return ok;
    }
    scan2(uq) {
        let ok = true;
        if (super.scan2(uq) === false)
            ok = false;
        this.copyBase();
        return ok;
    }
    // extends 继承的base，拷贝给所有的子类
    assertSingleBase() {
        let ok = true;
        let hasBase = false;
        for (let p = this.element; p !== undefined;) {
            const { base, extends: _extends } = p;
            if (base !== undefined) {
                if (hasBase === true) {
                    this.log(`Atom ${this.element.name} has multiple base`);
                    return false;
                }
                else {
                    hasBase = true;
                }
            }
            else {
                break;
            }
            p = _extends;
        }
        return ok;
    }
    copyBase() {
        let hasBase = false;
        const atoms = [];
        for (let p = this.element; p !== undefined;) {
            const { base, extends: _extends } = p;
            atoms.push(p);
            if (base !== undefined) {
                if (hasBase === true) {
                    return;
                }
                else {
                    hasBase = true;
                    for (let atom of atoms)
                        atom.base = base;
                }
            }
            else {
                break;
            }
            p = _extends;
        }
    }
}
class PBizAtomSpec extends PBizAtomIDWithBase {
    constructor() {
        super(...arguments);
        this.parseKey = () => {
            this.ts.assertToken(tokens_1.Token.VAR);
            let name = this.ts.lowerVar;
            this.ts.readToken();
            let caption = this.ts.mayPassString();
            let bizBud = this.parseBud(name, caption);
            this.element.keys.push(bizBud);
            if (name !== 'no') {
                if (this.isValidPropName(name) === false) {
                    return;
                }
                this.element.props.set(name, bizBud);
            }
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
    }
    parseContent() {
        const keyColl = {
            base: this.parseBase,
            prop: this.parseProp,
            key: this.parseKey,
        };
        const keys = Object.keys(keyColl);
        for (;;) {
            let parse = keyColl[this.ts.lowerVar];
            if (this.ts.varBrace === true || parse === undefined) {
                this.ts.expect(...keys);
            }
            this.ts.readToken();
            parse();
            if (this.ts.token === tokens_1.Token.RBRACE)
                break;
        }
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false)
            ok = false;
        const { keys } = this.element;
        if (keys.length === 0) {
            this.log('SPEC must define KEY');
            ok = false;
        }
        return ok;
    }
}
exports.PBizAtomSpec = PBizAtomSpec;
class PBizAtomBud extends PBizAtomIDWithBase {
    constructor() {
        super(...arguments);
        this.parseJoin = () => {
            if (this.joinName !== undefined) {
                this.ts.error('JOIN can only be defined once');
            }
            if (this.ts.token === tokens_1.Token.VAR) {
                this.joinName = this.ts.lowerVar;
                this.ts.readToken();
            }
            else {
                // 定义了base，没有base name
                this.joinName = null;
            }
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
    }
    parseContent() {
        const keyColl = {
            base: this.parseBase,
            join: this.parseJoin,
            prop: this.parseProp,
        };
        const keys = Object.keys(keyColl);
        for (;;) {
            let parse = keyColl[this.ts.lowerVar];
            if (this.ts.varBrace === true || parse === undefined) {
                this.ts.expect(...keys);
            }
            this.ts.readToken();
            parse();
            if (this.ts.token === tokens_1.Token.RBRACE)
                break;
        }
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false)
            ok = false;
        if (this.joinName === null) {
            this.element.join = il_1.BizAtomIDAny.current;
        }
        else if (this.joinName === undefined) {
            this.log('BUD must define JOIN');
            ok = false;
        }
        else {
            let join = this.scanAtomID(space, this.joinName);
            if (join === undefined) {
                ok = false;
            }
            else {
                this.element.join = join;
                if (this.checkRecursive('JOIN', (p) => p.join) === false) {
                    ok = false;
                }
            }
        }
        return ok;
    }
}
exports.PBizAtomBud = PBizAtomBud;
class PBizPick extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.atoms = [];
        this.joins = [];
        this.parseAtom = () => {
            this.parseArrayVar(this.atoms);
        };
        this.parseUom = () => {
            this.element.uom = true;
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.parseSpec = () => {
            if (this.ts.token !== tokens_1.Token.VAR) {
                this.ts.expectToken(tokens_1.Token.VAR);
            }
            this.spec = this.ts.lowerVar;
            this.ts.readToken();
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.parseJoin = () => {
            this.parseArrayVar(this.joins);
        };
    }
    parseContent() {
        const keyColl = {
            atom: this.parseAtom,
            uom: this.parseUom,
            spec: this.parseSpec,
            join: this.parseJoin,
        };
        const keys = Object.keys(keyColl);
        for (;;) {
            let parse = keyColl[this.ts.lowerVar];
            if (this.ts.varBrace === true || parse === undefined) {
                this.ts.expect(...keys);
            }
            this.ts.readToken();
            parse();
            if (this.ts.token === tokens_1.Token.RBRACE)
                break;
        }
    }
    parseArrayVar(arr) {
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            for (;;) {
                if (this.ts.token === tokens_1.Token.VAR) {
                    arr.push(this.ts.lowerVar);
                    this.ts.readToken();
                }
                else {
                    this.ts.expectToken(tokens_1.Token.VAR);
                }
                if (this.ts.token === tokens_1.Token.COMMA) {
                    this.ts.readToken();
                    if (this.ts.token === tokens_1.Token.RPARENTHESE) {
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
        else if (this.ts.token === tokens_1.Token.VAR) {
            arr.push(this.ts.lowerVar);
            this.ts.readToken();
        }
        else {
            this.ts.expectToken(tokens_1.Token.VAR, tokens_1.Token.LPARENTHESE);
        }
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
    scan(space) {
        let ok = true;
        for (let atom of this.atoms) {
            let bizEntity = this.getBizEntity(space, atom, il_1.BizPhraseType.atom);
            if (bizEntity === undefined) {
                ok = false;
            }
            this.element.atoms.push(bizEntity);
        }
        this.element.spec = this.getBizEntity(space, this.spec, il_1.BizPhraseType.spec);
        const joinBizPhraseTypes = [il_1.BizPhraseType.options, il_1.BizPhraseType.atom, il_1.BizPhraseType.bud];
        for (let join of this.joins) {
            let bizEntity = this.getBizEntity(space, join, ...joinBizPhraseTypes);
            if (bizEntity === undefined) {
                ok = false;
            }
            this.element.joins.push(bizEntity);
        }
        return ok;
    }
}
exports.PBizPick = PBizPick;
//# sourceMappingURL=Atom.js.map