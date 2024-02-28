import { BizAtom, /*BizAtomBud, */BizIDExtendable, BizIDAny, BizIDWithBase, BizSpec, BizDuo, Uq, BizID, BudDataType, BizBud, AtomUnique } from "../../il";
import { Space } from "../space";
import { Token } from "../tokens";
import { PBizEntity } from "./Base";

export abstract class PBizID<T extends BizID> extends PBizEntity<T> {
}

export abstract class PBizIDExtendable<T extends BizIDExtendable> extends PBizID<T> {
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
        const coll: { [name: string]: BizIDExtendable } = {};
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

export class PBizAtom extends PBizIDExtendable<BizAtom> {
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

    private parsePermit = () => {
        this.parsePermission('crud');
    }

    private uniques: { [name: string]: { keys: string[]; no: string; } };
    private parseUnique = () => {
        if (this.uniques === undefined) this.uniques = {};
        let name = this.ts.passVar();
        if (this.uniques[name] !== undefined) {
            this.ts.error(`UNIQUE ${name} duplicate`);
        }
        let keys: string[] = [];
        let no: string;
        this.ts.passToken(Token.LBRACE);
        for (; ;) {
            const { token } = this.ts;
            if (token === Token.RBRACE) {
                this.ts.readToken();
                this.ts.mayPassToken(Token.SEMICOLON);
                break;
            }
            else if (token === Token.VAR) {
                if (this.ts.isKeyword('key') === true) {
                    this.ts.readToken();
                    let k = this.ts.passVar();
                    if (keys.includes(k) === true) {
                        this.ts.error(`KEY ${k} already defined`);
                    }
                    keys.push(k);
                    this.ts.passToken(Token.SEMICOLON);
                }
                else if (this.ts.isKeyword('no') === true) {
                    if (no !== undefined) {
                        this.ts.error('NO can only define once');
                    }
                    this.ts.readToken();
                    no = this.ts.passVar();
                    this.ts.passToken(Token.SEMICOLON);
                }
                else {
                    this.ts.expect('key', 'no');
                }
            }
            else {
                this.ts.expect('} or key or no');
            }
        }
        this.uniques[name] = { keys, no };
    }

    readonly keyColl = {
        prop: this.parseProp,
        ex: this.parseEx,
        permit: this.parsePermit,
        unique: this.parseUnique,
    };

    scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) ok = false;
        if (this.uniques !== undefined) {
            const { props } = this.element;
            const getBud = (budName: string, types: BudDataType[]) => {
                let bud = props.get(budName);
                if (bud === undefined) {
                    this.log(`${budName} is not a PROP`);
                    ok = false;
                }
                else {
                    if (types.includes(bud.dataType) === false) {
                        this.log(`${budName} must be ${types.map(v => BudDataType[v].toUpperCase()).join(', ')}`);
                        ok = false;
                    }
                }
                return bud;
            }
            for (let i in this.uniques) {
                if (props.get(i) !== undefined) {
                    ok = false;
                    this.log(`Duplicate ${i}`);
                    continue;
                }
                const { keys, no } = this.uniques[i];
                let noBud = getBud(no, [BudDataType.char]);
                let keyBuds: BizBud[] = [];
                for (let key of keys) {
                    let keyBud = getBud(key, [BudDataType.ID, BudDataType.int, BudDataType.atom]);
                    keyBuds.push(keyBud);
                }
                let { uniques } = this.element;
                if (uniques === undefined) {
                    this.element.uniques = uniques = [];
                }
                uniques.push({
                    name: i,
                    keys: keyBuds,
                    no: noBud,
                } as AtomUnique);
                if (keyBuds.length > 1) {
                    this.log('KEY only one');
                }
            }
        }
        return ok;
    }

    scan2(uq: Uq): boolean {
        let ok = true;
        if (super.scan2(uq) === false) ok = false;
        return ok;
    }
}

export class PBizDuo extends PBizID<BizDuo> {
    private parseI = () => {
        this.parseIField(this.element.i);
    }

    private parseX = () => {
        this.parseXField(this.element.x);
    }

    readonly keyColl = {
        prop: this.parseProp,
        i: this.parseI,
        x: this.parseX,
    };

    scan(space: Space): boolean {
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

abstract class PBizIDWithBase<T extends BizIDWithBase> extends PBizIDExtendable<T> {
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
            this.element.base = BizIDAny.current as any;
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

export class PBizSpec extends PBizIDWithBase<BizSpec> {
    private parseKey = () => {
        const parseKey = () => {
            this.ts.assertToken(Token.VAR);
            let name = this.ts.lowerVar;
            this.ts.readToken();
            let ui = this.parseUI();
            let bizBud = this.parseBud(name, ui);
            const { name: budName } = bizBud;
            let { keys } = this.element;
            if (keys.findIndex(v => v.name === budName) >= 0) {
                this.ts.expect(`duplicate ${budName}`);
            }
            keys.push(bizBud);
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
