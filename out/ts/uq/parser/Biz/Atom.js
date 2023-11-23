"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizAtomSpec = exports.PBizDuo = exports.PBizAtom = exports.PBizAtomID = void 0;
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
            let ui = this.parseUI();
            let bizBud = this.parseBud('ex', ui);
            this.ts.passToken(tokens_1.Token.SEMICOLON);
            this.element.ex = bizBud;
        };
        this.parsePermit = () => {
            this.parsePermission('crud');
        };
        this.keyColl = {
            prop: this.parseProp,
            ex: this.parseEx,
            permit: this.parsePermit
        };
    }
    parseParam() {
        super.parseParam();
        if (this.ts.isKeyword('uuid') === true) {
            this.element.uuid = true;
            this.ts.readToken();
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
        return ok;
    }
}
exports.PBizAtom = PBizAtom;
class PBizDuo extends PBizAtomID {
    constructor() {
        super(...arguments);
        this.parseI = () => {
            this.parseIxField(this.element.i);
        };
        this.parseX = () => {
            this.parseIxField(this.element.x);
        };
        this.keyColl = {
            i: this.parseI,
            x: this.parseX,
        };
    }
    scan(space) {
        let ok = true;
        let { i, x } = this.element;
        if (this.scanIxField(space, i) === false) {
            ok = false;
        }
        if (this.scanIxField(space, x) === false) {
            ok = false;
        }
        return ok;
    }
}
exports.PBizDuo = PBizDuo;
class PBizAtomIDWithBase extends PBizAtomID {
    constructor() {
        super(...arguments);
        this.parseIxBase = () => {
            if (this.ts.isKeyword('base') === false) {
                this.ts.expect('base');
            }
            this.element.isIxBase = true;
            this.ts.readToken();
            this.parseBase();
        };
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
            const parseKey = () => {
                this.ts.assertToken(tokens_1.Token.VAR);
                let name = this.ts.lowerVar;
                this.ts.readToken();
                let ui = this.parseUI();
                let bizBud = this.parseBud(name, ui);
                this.element.keys.push(bizBud);
                this.ts.passToken(tokens_1.Token.SEMICOLON);
            };
            if (this.ts.token === tokens_1.Token.LBRACE) {
                this.ts.readToken();
                for (;;) {
                    parseKey();
                    if (this.ts.token === tokens_1.Token.RBRACE) {
                        this.ts.readToken();
                        break;
                    }
                }
            }
            else {
                parseKey();
            }
        };
        this.keyColl = {
            ix: this.parseIxBase,
            base: this.parseBase,
            prop: this.parseProp,
            key: this.parseKey,
        };
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
        for (let key of keys) {
            if (this.scanBud(space, key) === false)
                ok = false;
        }
        return ok;
    }
}
exports.PBizAtomSpec = PBizAtomSpec;
//# sourceMappingURL=Atom.js.map