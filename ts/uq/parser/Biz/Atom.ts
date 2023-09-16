import { BizAtom, BizAtomState, BizSpec } from "../../il";
import { Space } from "../space";
import { Token } from "../tokens";
import { PBizBase, PBizEntity } from "./Base";

export class PBizAtom extends PBizEntity<BizAtom> {
    protected get defaultName(): string { return undefined; }

    private extendsName: string;
    private baseName: string;
    private specName: string;

    protected parseParam(): void {
        if (this.ts.isKeyword('extends') === true) {
            this.ts.readToken();
            if (this.ts.token !== Token.VAR) {
                this.ts.expectToken(Token.VAR);
            }
            this.extendsName = this.ts.lowerVar;
            this.ts.readToken();
        }
        else if (this.ts.isKeyword('uuid') === true) {
            this.element.uuid = true;
            this.ts.readToken();
        }
    }

    protected parseContent(): void {
        const keyColl = {
            base: this.parseBase,
            uom: this.parseUom,
            spec: this.parseSpec,
            prop: this.parseProp,
            key: this.parseKey,
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

    private parseBase = () => {
        if (this.baseName !== undefined) {
            this.ts.error('BASE can only be defined once');
        }
        this.ts.assertToken(Token.VAR);
        this.baseName = this.ts.lowerVar;
        this.ts.readToken();
        this.ts.passToken(Token.SEMICOLON);
    }

    private parseKey = () => {
        this.ts.assertToken(Token.VAR);
        let name = this.ts.lowerVar;
        this.ts.readToken();
        let caption: string = this.ts.mayPassString();
        if (name !== 'no') {
            if (this.isValidPropName(name) === false) {
                return;
            }
        }
        let bizBud = this.parseBud('prop', name, caption);
        this.ts.passToken(Token.SEMICOLON);
        this.element.keys.push(bizBud);
    }

    private parseEx = () => {
        this.ts.readToken();
        let caption: string = this.ts.mayPassString();
        let bizBud = this.parseBud('prop', 'ex', caption);
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

    private parseSpec = () => {
        if (this.specName !== undefined) {
            this.ts.error('SPEC can only be defined once');
        }
        this.ts.assertToken(Token.VAR);
        this.specName = this.ts.lowerVar;
        this.ts.readToken();
        this.ts.passToken(Token.SEMICOLON);
    }

    scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) ok = false;
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

export class PBizAtomState extends PBizBase<BizAtomState> {
    protected get defaultName(): string {
        return undefined;
    }
}
