import { BizAtom, BizAtomSpec, BizPhraseType, BizPick } from "../../il";
import { Space } from "../space";
import { Token } from "../tokens";
import { PBizEntity } from "./Base";

export class PBizPick extends PBizEntity<BizPick> {
    private atoms: string[] = [];
    private specs: string[] = [];

    /*
    protected parseContent(): void {
        const keyColl = {
            atom: this.parseAtom,
            spec: this.parseSpec,
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
    */

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

    private parseSpec = () => {
        this.parseArrayVar(this.specs);
    }

    readonly keyColl = {
        atom: this.parseAtom,
        spec: this.parseSpec,
    };

    scan(space: Space): boolean {
        let ok = true;
        for (let atom of this.atoms) {
            let bizEntity = this.getBizEntity(space, atom, BizPhraseType.atom);
            if (bizEntity === undefined) {
                ok = false;
            }
            this.element.atoms.push(bizEntity as BizAtom);
        }

        for (let spec of this.specs) {
            let bizEntity = this.getBizEntity(space, spec, BizPhraseType.spec);
            if (bizEntity === undefined) {
                ok = false;
            }
            this.element.specs.push(bizEntity as BizAtomSpec);
        }
        return ok;
    }
}
