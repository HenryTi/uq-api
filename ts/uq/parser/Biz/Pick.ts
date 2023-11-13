import { BizAtom, BizAtomSpec, BizPick, BizQueryTable } from "../../il";
import { BizPhraseType } from "../../il";
import { Space } from "../space";
import { Token } from "../tokens";
import { PBizEntity } from "./Base";

export class PBizPick extends PBizEntity<BizPick> {
    private atoms: string[] = [];
    private specs: string[] = [];

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

    private parseQuery = () => {
        let query = new BizQueryTable(this.element.biz);
        this.context.parseElement(query);
        this.element.query = query;
        this.ts.mayPassToken(Token.SEMICOLON);
    }

    readonly keyColl = {
        atom: this.parseAtom,
        spec: this.parseSpec,
        param: this.parseProp,
        query: this.parseQuery,
    };

    scan(space: Space): boolean {
        let ok = true;

        const { query } = this.element;
        if (query !== undefined) {
            if (query.pelement.scan(space) === false) {
                ok = false;
            }
        }

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
