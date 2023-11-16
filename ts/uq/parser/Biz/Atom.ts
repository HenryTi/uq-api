import { BizAtom, /*BizAtomBud, */BizAtomID, BizAtomIDAny, BizAtomIDWithBase, BizAtomSpec, Uq } from "../../il";
import { Space } from "../space";
import { Token } from "../tokens";
import { PBizEntity } from "./Base";

export abstract class PBizAtomID<T extends BizAtomID> extends PBizEntity<T> {
    private extendsName: string;

    protected parseParam(): void {
        if (this.ts.isKeyword('extends') === true) {
            this.ts.readToken();
            if (this.ts.token !== Token.VAR) {
                this.ts.expectToken(Token.VAR);
            }
            this.extendsName = this.ts.lowerVar;
            this.ts.readToken();
        }
    }

    scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) ok = false;
        if (this.extendsName !== undefined) {
            let atom = this.scanAtomID(space, this.extendsName);
            if (atom === undefined) {
                ok = false;
            }
            else {
                this.element.extends = atom;
                if (this.checkRecursive('EXTENDS', (p: T) => p.extends as T) === false) {
                    ok = false;
                }
            }
        }
        return ok;
    }

    protected checkRecursive(recursiveCaption: string, getPrev: (p: T) => T) {
        let ok = true;
        const coll: { [name: string]: BizAtomID } = {};
        const atomName = this.element.name;
        coll[atomName] = this.element;
        for (let p = this.element; p !== undefined;) {
            let prev = getPrev(p);
            if (prev === undefined) break;
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

export class PBizAtom extends PBizAtomID<BizAtom> {
    protected parseParam(): void {
        super.parseParam();
        if (this.ts.isKeyword('uuid') === true) {
            this.element.uuid = true;
            this.ts.readToken();
        }
    }
    private parseEx = () => {
        this.ts.readToken();
        let ui = this.parseUI();
        let bizBud = this.parseBud('ex', ui);
        this.ts.passToken(Token.SEMICOLON);
        this.element.ex = bizBud;
    }
    /*
    private parseUom = () => {
        if (this.element.uom !== undefined) {
            this.ts.error('UOM can only be defined once');
        }
        this.element.uom = true;
        this.ts.passToken(Token.SEMICOLON);
    }
    */

    private parsePermit = () => {
        this.parsePermission('crud');
    }

    readonly keyColl = {
        // uom: this.parseUom,
        prop: this.parseProp,
        ex: this.parseEx,
        permit: this.parsePermit
    };

    scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) ok = false;
        return ok;
    }

    scan2(uq: Uq): boolean {
        let ok = true;
        if (super.scan2(uq) === false) ok = false;
        this.copyUom();
        return ok;
    }

    private copyUom() {
        let atoms: BizAtom[] = [];
        for (let p = this.element; p !== undefined; p = p.extends as any) {
            /*
            if (p.uom === true) {
                for (let atom of atoms) atom.uom = true;
                break;
            }
            else {
            */
            atoms.push(p);
            //}
        }
    }
}

abstract class PBizAtomIDWithBase<T extends BizAtomIDWithBase> extends PBizAtomID<T> {
    protected baseName: string;
    protected parseIxBase = () => {
        if (this.ts.isKeyword('base') === false) {
            this.ts.expect('base');
        }
        this.element.isIxBase = true;
        this.ts.readToken();
        this.parseBase();
    }
    protected parseBase = () => {
        if (this.baseName !== undefined) {
            this.ts.error('BASE can only be defined once');
        }
        if (this.ts.token === Token.VAR) {
            this.baseName = this.ts.lowerVar;
            this.ts.readToken();
        }
        else {
            // 定义了base，没有base name
            this.baseName = null;
        }
        this.ts.passToken(Token.SEMICOLON);
    }

    scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) ok = false;
        if (this.baseName === null) {
            this.element.base = BizAtomIDAny.current as any;
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
                this.element.base = base as any;
                if (this.checkRecursive('BASE', (p: T) => p.base as T) === false) {
                    ok = false;
                }
            }
        }
        if (this.assertSingleBase() === false) {
            ok = false;
        }
        return ok;
    }

    scan2(uq: Uq): boolean {
        let ok = true;
        if (super.scan2(uq) === false) ok = false;
        this.copyBase();
        return ok;
    }

    // extends 继承的base，拷贝给所有的子类
    private assertSingleBase() {
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
            p = _extends as any;
        }
        return ok;
    }

    private copyBase() {
        let hasBase = false;
        const atoms: T[] = [];
        for (let p = this.element; p !== undefined;) {
            const { base, extends: _extends } = p;
            atoms.push(p);
            if (base !== undefined) {
                if (hasBase === true) {
                    return;
                }
                else {
                    hasBase = true;
                    for (let atom of atoms) atom.base = base;
                }
            }
            else {
                break;
            }
            p = _extends as any;
        }
    }
}

export class PBizAtomSpec extends PBizAtomIDWithBase<BizAtomSpec> {
    private parseKey = () => {
        const parseKey = () => {
            this.ts.assertToken(Token.VAR);
            let name = this.ts.lowerVar;
            this.ts.readToken();
            let ui = this.parseUI();
            let bizBud = this.parseBud(name, ui);
            this.element.keys.push(bizBud);
            this.ts.passToken(Token.SEMICOLON);
        }
        if (this.ts.token === Token.LBRACE) {
            this.ts.readToken();
            for (; ;) {
                parseKey();
                if (this.ts.token === Token.RBRACE as any) {
                    this.ts.readToken();
                    break;
                }
            }
        }
        else {
            parseKey();
        }
    }

    readonly keyColl = {
        ix: this.parseIxBase,
        base: this.parseBase,
        prop: this.parseProp,
        key: this.parseKey,
    };

    scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) ok = false;
        const { keys } = this.element;
        if (keys.length === 0) {
            this.log('SPEC must define KEY');
            ok = false;
        }

        for (let key of keys) {
            if (this.scanBud(space, key) === false) ok = false;
        }
        return ok;
    }
}
