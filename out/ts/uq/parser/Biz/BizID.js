"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizCombo = exports.PBizFork = exports.PBizDuo = exports.PBizAtom = exports.PIDUnique = exports.PBizIDExtendable = exports.PBizIDWithShowBuds = void 0;
const il_1 = require("../../il");
const BizPhraseType_1 = require("../../il/Biz/BizPhraseType");
const space_1 = require("../space");
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
const Bud_1 = require("./Bud");
class PBizIDWithShowBuds extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.parseColonBuds = () => {
            if (this.ts.token === tokens_1.Token.BITWISEAND) {
                this.ts.readToken();
                this.parseTitleBuds();
            }
            else {
                this.parsePrimeBuds();
            }
        };
    }
    parseTitleBuds() {
        this.titleBuds = this.parseBudNameArr();
    }
    parsePrimeBuds() {
        this.primeBuds = this.parseBudNameArr();
    }
    parseKeyBuds() {
        let keys = [];
        const parseKey = () => {
            this.ts.assertToken(tokens_1.Token.VAR);
            let name = this.ts.lowerVar;
            this.ts.readToken();
            let ui = this.parseUI();
            let bizBud = this.parseBud(name, ui);
            const { name: budName } = bizBud;
            if (keys.findIndex(v => v.name === budName) >= 0) {
                this.ts.expect(`duplicate ${budName}`);
            }
            keys.push(bizBud);
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
        return keys;
    }
    setBudsShow(buds) {
        for (let bud of buds)
            bud.show = true;
    }
    scanTitleBuds() {
        let ok = true;
        let ret = this.scanBudNameArr(this.titleBuds);
        if (ret === null) {
            ok = false;
        }
        else if (ret !== undefined) {
            this.element.titleBuds = ret;
            this.setBudsShow(ret);
        }
        return ok;
    }
    scanPrimeBuds() {
        let ok = true;
        let ret = this.scanBudNameArr(this.primeBuds);
        if (ret === null) {
            ok = false;
        }
        else if (ret !== undefined) {
            this.element.primeBuds = ret;
            this.setBudsShow(ret);
        }
        return ok;
    }
    scan(space) {
        let ok = super.scan(space);
        if (this.scanTitleBuds() === false)
            ok = false;
        if (this.scanPrimeBuds() === false)
            ok = false;
        return ok;
    }
    scan2(uq) {
        let ok = super.scan2(uq);
        return ok;
    }
}
exports.PBizIDWithShowBuds = PBizIDWithShowBuds;
class PBizIDExtendable extends PBizIDWithShowBuds {
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
    scan0(space) {
        let ok = true;
        if (this.extendsName !== undefined) {
            let atom = this.scanID(space, this.extendsName);
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
    scan(space) {
        let ok = true;
        if (super.scan(space) === false)
            ok = false;
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
exports.PBizIDExtendable = PBizIDExtendable;
class PIDUnique extends Bud_1.PBizBud {
    _parse() {
        this.element.name = this.ts.passVar();
        const { name } = this.element;
        this.keys = [];
        if (this.ts.token !== tokens_1.Token.LBRACE) {
            if (name !== 'no') {
                this.ts.error('should be UNQIUE NO');
            }
            this.ts.passToken(tokens_1.Token.SEMICOLON);
            return;
        }
        this.ts.readToken();
        for (;;) {
            const { token } = this.ts;
            if (token === tokens_1.Token.RBRACE) {
                this.ts.readToken();
                this.ts.mayPassToken(tokens_1.Token.SEMICOLON);
                break;
            }
            else if (token === tokens_1.Token.VAR) {
                if (this.ts.isKeyword('key') === true) {
                    this.ts.readToken();
                    let k = this.ts.passVar();
                    if (this.keys.includes(k) === true) {
                        this.ts.error(`KEY ${k} already defined`);
                    }
                    this.keys.push(k);
                    this.ts.passToken(tokens_1.Token.SEMICOLON);
                }
                else if (this.ts.isKeyword('no') === true) {
                    if (this.no !== undefined) {
                        this.ts.error('NO can only define once');
                    }
                    this.ts.readToken();
                    this.no = this.ts.passVar();
                    this.ts.passToken(tokens_1.Token.SEMICOLON);
                }
                else {
                    this.ts.expect('key', 'no');
                }
            }
            else {
                this.ts.expect('} or key or no');
            }
        }
    }
    getBud(budName, types) {
        let bud = this.element.bizAtom.props.get(budName);
        if (bud === undefined) {
            this.log(`${budName} is not a PROP`);
            return undefined;
        }
        else {
            if (types.includes(bud.dataType) === false) {
                this.log(`${budName} must be ${types.map(v => BizPhraseType_1.BudDataType[v].toUpperCase()).join(', ')}`);
                return undefined;
            }
        }
        return bud;
    }
    scan(space) {
        let ok = true;
        const { name, bizAtom } = this.element;
        if (name === 'no')
            return true;
        const { props } = bizAtom;
        if (props.get(name) !== undefined) {
            ok = false;
            this.log(`Duplicate ${name}`);
            ok = false;
        }
        let noBud = this.getBud(this.no, [BizPhraseType_1.BudDataType.char]);
        if (noBud === undefined) {
            ok = false;
        }
        else {
            this.element.no = noBud;
        }
        let keyBuds = [];
        for (let key of this.keys) {
            let keyBud = this.getBud(key, [BizPhraseType_1.BudDataType.ID, BizPhraseType_1.BudDataType.int, BizPhraseType_1.BudDataType.atom, BizPhraseType_1.BudDataType.radio]);
            if (keyBud === undefined) {
                ok = false;
            }
            else {
                keyBuds.push(keyBud);
            }
        }
        if (keyBuds.length > 1) {
            // 得允许多个keys
            // this.log('KEY only one');
        }
        this.element.keys = keyBuds;
        return ok;
    }
}
exports.PIDUnique = PIDUnique;
class PBizAtom extends PBizIDExtendable {
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
        this.parseUnique = () => {
            if (this.uniques === undefined)
                this.uniques = {};
            let unique = new il_1.IDUnique(this.element, undefined, undefined);
            this.context.parseElement(unique);
            const { name } = unique;
            if (this.uniques[name] !== undefined) {
                this.ts.error(`UNIQUE ${name} duplicate`);
            }
            this.uniques[name] = unique;
        };
        this.keyColl = {
            ':': this.parseColonBuds,
            prop: this.parseProp,
            ex: this.parseEx,
            permit: this.parsePermit,
            unique: this.parseUnique,
            user: this.parseBizUser,
        };
    }
    parseContent() {
        super.parseContent();
    }
    parseParam() {
        super.parseParam();
        if (this.ts.isKeyword('uuid') === true) {
            this.element.uuid = true;
            this.ts.readToken();
        }
    }
    scan0(space) {
        let ok = super.scan0(space);
        if (this.uniques !== undefined) {
            let { uniques } = this.element;
            if (uniques === undefined) {
                this.element.uniques = uniques = [];
            }
            for (let i in this.uniques) {
                let unique = this.uniques[i];
                if (unique.pelement.scan(space) === false) {
                    ok = false;
                }
                else {
                    uniques.push(unique);
                }
            }
        }
        return ok;
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false)
            ok = false;
        return ok;
    }
}
exports.PBizAtom = PBizAtom;
class PBizDuo extends PBizIDWithShowBuds {
    constructor() {
        super(...arguments);
        this.parseI = () => {
            this.parseIField(this.element.i);
        };
        this.parseX = () => {
            this.parseXField(this.element.x);
        };
        this.keyColl = {
            prop: this.parseProp,
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
class PBizIDWithBase extends PBizIDExtendable {
    constructor() {
        super(...arguments);
        this.parsePreset = () => {
            this.element.preset = true;
            this.ts.passToken(tokens_1.Token.SEMICOLON);
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
    scan0(space) {
        let ok = true;
        if (this.baseName === null) {
            this.element.base = il_1.BizIDAny.current;
        }
        else if (this.baseName === undefined) {
            this.log('BASE must be defined');
            ok = false;
        }
        else {
            let base = this.scanID(space, this.baseName);
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
        this.copyBase();
        for (let [, bud] of this.element.props) {
            if (bud.dataType === BizPhraseType_1.BudDataType.bin) {
                ok = false;
                this.log(`no BIN can be used in ID prop`);
            }
        }
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
class PBizFork extends PBizIDWithBase {
    constructor() {
        super(...arguments);
        this.parseKey = () => {
            this.element.keys.push(...this.parseKeyBuds());
        };
        this.keyColl = {
            preset: this.parsePreset,
            base: this.parseBase,
            prop: this.parseProp,
            key: this.parseKey,
            ':': this.parseColonBuds,
        };
    }
    _parse() {
        super._parse();
    }
    scanPrimeBuds() {
        let ret = super.scanPrimeBuds();
        let { primeBuds, keys, props } = this.element;
        if (primeBuds === undefined) {
            this.element.primeBuds = primeBuds = [];
        }
        primeBuds.push(...keys);
        for (let [, value] of props)
            primeBuds.push(value);
        for (let bud of primeBuds)
            bud.show = true;
        return ret;
    }
    scan(space) {
        let ok = true;
        let forkSpace = new BizForkSpace(space);
        if (super.scan(forkSpace) === false)
            ok = false;
        const { keys } = this.element;
        if (keys.length === 0) {
            this.log('SPEC must define KEY');
            ok = false;
        }
        for (let key of keys) {
            if (this.scanBud(forkSpace, key) === false)
                ok = false;
        }
        return ok;
    }
    scan2(uq) {
        let ok = true;
        let { base } = this.element;
        const { fork } = base;
        if (fork !== undefined) {
            ok = false;
            this.log(`${base.getJName()} can not have more than one FORK. ${this.element.getJName()} and ${fork.getJName()}`);
        }
        else {
            base.fork = this.element;
        }
        return ok;
    }
}
exports.PBizFork = PBizFork;
class BizForkSpace extends space_1.Space {
    constructor() {
        super(...arguments);
        this.baseField = new il_1.BizForkBaseField(undefined);
    }
    _getEntityTable(name) {
        return;
    }
    _getTableByAlias(alias) {
        return;
    }
    _varPointer(name, isField) {
        return;
    }
    _getBizField(names) {
        if (names.length === 1 && names[0] === 'base')
            return this.baseField;
    }
}
class PBizCombo extends PBizIDWithShowBuds {
    constructor() {
        super(...arguments);
        this.indexes = [];
        this.parseKey = () => {
            this.element.keys.push(...this.parseKeyBuds());
        };
        this.parseIndex = () => {
            let index = [];
            if (this.ts.token === tokens_1.Token.LPARENTHESE) {
                this.ts.readToken();
                for (;;) {
                    if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                        this.ts.readToken();
                        break;
                    }
                    index.push(this.ts.passVar());
                    if (this.ts.token === tokens_1.Token.COMMA) {
                        this.ts.readToken();
                        continue;
                    }
                }
            }
            else {
                index.push(this.ts.passVar());
            }
            this.indexes.push(index);
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.keyColl = {
            prop: this.parseProp,
            key: this.parseKey,
            index: this.parseIndex,
        };
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false)
            ok = false;
        const { keys } = this.element;
        if (keys.length === 0) {
            this.log('COMBO must define KEY');
            ok = false;
        }
        for (let key of keys) {
            if (this.scanBud(space, key) === false)
                ok = false;
        }
        for (let index of this.indexes) {
            let indexBuds = [];
            for (let k of index) {
                let kBud = keys.find(v => v.name === k);
                if (kBud === undefined) {
                    this.log(`${k} is not a key`);
                    ok = false;
                }
                else {
                    indexBuds.push(kBud);
                }
            }
            this.element.indexes.push(indexBuds);
        }
        return ok;
    }
}
exports.PBizCombo = PBizCombo;
//# sourceMappingURL=BizID.js.map