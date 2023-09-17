"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizAtomState = exports.PBizAtom = void 0;
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
class PBizAtom extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.parseBase = () => {
            if (this.baseName !== undefined) {
                this.ts.error('BASE can only be defined once');
            }
            this.ts.assertToken(tokens_1.Token.VAR);
            this.baseName = this.ts.lowerVar;
            this.ts.readToken();
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.parseKey = () => {
            this.ts.assertToken(tokens_1.Token.VAR);
            let name = this.ts.lowerVar;
            this.ts.readToken();
            let caption = this.ts.mayPassString();
            let bizBud = this.parseBud('prop', name, caption);
            this.element.keys.push(bizBud);
            if (name !== 'no') {
                if (this.isValidPropName(name) === false) {
                    return;
                }
                this.element.props.set(name, bizBud);
            }
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.parseEx = () => {
            this.ts.readToken();
            let caption = this.ts.mayPassString();
            let bizBud = this.parseBud('prop', 'ex', caption);
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
        this.parseSpec = () => {
            if (this.specName !== undefined) {
                this.ts.error('SPEC can only be defined once');
            }
            this.ts.assertToken(tokens_1.Token.VAR);
            this.specName = this.ts.lowerVar;
            this.ts.readToken();
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
    }
    get defaultName() { return undefined; }
    parseParam() {
        if (this.ts.isKeyword('extends') === true) {
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.VAR) {
                this.ts.expectToken(tokens_1.Token.VAR);
            }
            this.extendsName = this.ts.lowerVar;
            this.ts.readToken();
        }
        else if (this.ts.isKeyword('uuid') === true) {
            this.element.uuid = true;
            this.ts.readToken();
        }
    }
    parseContent() {
        const keyColl = {
            base: this.parseBase,
            uom: this.parseUom,
            spec: this.parseSpec,
            prop: this.parseProp,
            key: this.parseKey,
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
        if (this.extendsName !== undefined) {
            let atom = this.scanAtom(space, this.extendsName);
            if (atom === undefined) {
                ok = false;
            }
            else {
                this.element.extends = atom;
            }
        }
        if (this.baseName !== undefined) {
            let base = this.scanAtom(space, this.baseName);
            if (base === undefined) {
                ok = false;
            }
            else {
                this.element.base = base;
            }
        }
        if (this.specName !== undefined) {
            let spec = this.scanSpec(space, this.specName);
            if (spec === undefined) {
                ok = false;
            }
            else {
                this.element.spec = spec;
            }
        }
        this.element.setUom();
        return ok;
    }
}
exports.PBizAtom = PBizAtom;
class PBizAtomState extends Base_1.PBizBase {
    get defaultName() {
        return undefined;
    }
}
exports.PBizAtomState = PBizAtomState;
//# sourceMappingURL=Atom.js.map