import { BizAtom, BizAtomBud, BizAtomID, BizAtomIDAny, BizAtomIDWithBase, BizAtomSpec, BizPhraseType, BizPick, Uq } from "../../il";
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

    protected parseContent(): void {
        const keyColl = {
            uom: this.parseUom,
            prop: this.parseProp,
            ex: this.parseEx,
        };
        const keys = Object.keys(keyColl);
        for (; ;) {
            let parse = keyColl[this.ts.lowerVar];
            if (this.ts.varBrace === true || parse === undefined) {
                this.ts.expect(...keys);
            }
            this.ts.readToken();
            parse();
            if (this.ts.token === Token.RBRACE) break;
        }
    }

    private parseEx = () => {
        this.ts.readToken();
        let caption: string = this.ts.mayPassString();
        let bizBud = this.parseBud('ex', caption);
        this.ts.passToken(Token.SEMICOLON);
        this.element.ex = bizBud;
    }

    private parseUom = () => {
        if (this.element.uom !== undefined) {
            this.ts.error('UOM can only be defined once');
        }
        this.element.uom = true;
        this.ts.passToken(Token.SEMICOLON);
    }

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
            if (p.uom === true) {
                for (let atom of atoms) atom.uom = true;
                break;
            }
            else {
                atoms.push(p);
            }
        }
    }
}

class PBizAtomIDWithBase<T extends BizAtomIDWithBase> extends PBizAtomID<T> {
    protected baseName: string;
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
    protected parseContent(): void {
        const keyColl = {
            base: this.parseBase,
            prop: this.parseProp,
            key: this.parseKey,
        };
        const keys = Object.keys(keyColl);
        for (; ;) {
            let parse = keyColl[this.ts.lowerVar];
            if (this.ts.varBrace === true || parse === undefined) {
                this.ts.expect(...keys);
            }
            this.ts.readToken();
            parse();
            if (this.ts.token === Token.RBRACE) break;
        }
    }

    private parseKey = () => {
        this.ts.assertToken(Token.VAR);
        let name = this.ts.lowerVar;
        this.ts.readToken();
        let caption: string = this.ts.mayPassString();
        let bizBud = this.parseBud(name, caption);
        this.element.keys.push(bizBud);
        if (name !== 'no') {
            if (this.isValidPropName(name) === false) {
                return;
            }
            this.element.props.set(name, bizBud);
        }
        this.ts.passToken(Token.SEMICOLON);
    }

    scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) ok = false;
        const { keys } = this.element;
        if (keys.length === 0) {
            this.log('SPEC must define KEY');
            ok = false;
        }
        return ok;
    }
}

export class PBizAtomBud extends PBizAtomIDWithBase<BizAtomBud> {
    private joinName: string;

    protected parseContent(): void {
        const keyColl = {
            base: this.parseBase,
            join: this.parseJoin,
            prop: this.parseProp,
        };
        const keys = Object.keys(keyColl);
        for (; ;) {
            let parse = keyColl[this.ts.lowerVar];
            if (this.ts.varBrace === true || parse === undefined) {
                this.ts.expect(...keys);
            }
            this.ts.readToken();
            parse();
            if (this.ts.token === Token.RBRACE) break;
        }
    }

    private parseJoin = () => {
        if (this.joinName !== undefined) {
            this.ts.error('JOIN can only be defined once');
        }
        if (this.ts.token === Token.VAR) {
            this.joinName = this.ts.lowerVar;
            this.ts.readToken();
        }
        else {
            // 定义了base，没有base name
            this.joinName = null;
        }
        this.ts.passToken(Token.SEMICOLON);
    }

    scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) ok = false;
        if (this.joinName === null) {
            this.element.join = BizAtomIDAny.current;
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
                if (this.checkRecursive('JOIN', (p: BizAtomBud) => p.join as BizAtomBud) === false) {
                    ok = false;
                }
            }
        }
        return ok;
    }
}

export class PBizPick extends PBizEntity<BizPick> {
    private atoms: string[] = [];
    private spec: string;
    private joins: string[] = [];

    protected parseContent(): void {
        const keyColl = {
            atom: this.parseAtom,
            uom: this.parseUom,
            spec: this.parseSpec,
            join: this.parseJoin,
        };
        const keys = Object.keys(keyColl);
        for (; ;) {
            let parse = keyColl[this.ts.lowerVar];
            if (this.ts.varBrace === true || parse === undefined) {
                this.ts.expect(...keys);
            }
            this.ts.readToken();
            parse();
            if (this.ts.token === Token.RBRACE) break;
        }
    }

    private parseArrayVar(arr: string[]) {
        if (this.ts.token === Token.LPARENTHESE) {
            this.ts.readToken();
            for (; ;) {
                if (this.ts.token === Token.VAR as any) {
                    arr.push(this.ts.lowerVar);
                    this.ts.readToken();
                }
                else {
                    this.ts.expectToken(Token.VAR);
                }
                if (this.ts.token === Token.COMMA as any) {
                    this.ts.readToken();
                    if (this.ts.token === Token.RPARENTHESE as any) {
                        this.ts.readToken();
                        break;
                    }
                    continue;
                }
                if (this.ts.token === Token.RPARENTHESE as any) {
                    this.ts.readToken();
                    break;
                }
            }
        }
        else if (this.ts.token === Token.VAR) {
            arr.push(this.ts.lowerVar);
            this.ts.readToken();
        }
        else {
            this.ts.expectToken(Token.VAR, Token.LPARENTHESE);
        }
        this.ts.passToken(Token.SEMICOLON);
    }

    private parseAtom = () => {
        this.parseArrayVar(this.atoms);
    }

    private parseUom = () => {
        this.element.uom = true;
        this.ts.passToken(Token.SEMICOLON);
    }

    private parseSpec = () => {
        if (this.ts.token !== Token.VAR) {
            this.ts.expectToken(Token.VAR);
        }
        this.spec = this.ts.lowerVar;
        this.ts.readToken();
        this.ts.passToken(Token.SEMICOLON);
    }

    private parseJoin = () => {
        this.parseArrayVar(this.joins);
    }

    scan(space: Space): boolean {
        let ok = true;
        for (let atom of this.atoms) {
            let bizEntity = this.getBizEntity(space, atom, BizPhraseType.atom);
            if (bizEntity === undefined) {
                ok = false;
            }
            this.element.atoms.push(bizEntity as BizAtom);
        }

        this.element.spec = this.getBizEntity(space, this.spec, BizPhraseType.spec);

        const joinBizPhraseTypes = [BizPhraseType.options, BizPhraseType.atom, BizPhraseType.bud];
        for (let join of this.joins) {
            let bizEntity = this.getBizEntity(space, join, ...joinBizPhraseTypes);
            if (bizEntity === undefined) {
                ok = false;
            }
            this.element.joins.push(bizEntity as BizAtomID);
        }
        return ok;
    }
}
