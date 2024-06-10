import { BizAssign, BizAtom } from "../../il";
import { BizPhraseType } from "../../il/Biz/BizPhraseType";
import { Space } from "../space";
import { Token } from "../tokens";
import { PBizEntity } from "./Base";

export class PBizAssign extends PBizEntity<BizAssign> {
    private atom: string[] = [];
    private titles: [string, string][] = [];

    private parseAtom = () => {
        for (; ;) {
            this.atom.push(this.ts.passVar());
            if (this.ts.token === Token.SEMICOLON) {
                this.ts.readToken();
                break;
            }
            if (this.ts.token === Token.BITWISEOR) {
                this.ts.readToken();
                continue;
            }
            this.ts.expectToken(Token.SEMICOLON, Token.BITWISEOR);
        }
    }

    private parseTitle = () => {
        for (; ;) {
            let t0 = this.ts.passVar();
            this.ts.passToken(Token.DOT);
            let t1 = this.ts.passVar();
            this.titles.push([t0, t1]);
            if (this.ts.token === Token.SEMICOLON) {
                this.ts.readToken();
                break;
            }
            if (this.ts.token === Token.COMMA) {
                this.ts.readToken();
                continue;
            }
            this.ts.expectToken(Token.SEMICOLON, Token.COMMA);
        }
    }

    readonly keyColl = {
        atom: this.parseAtom,
        title: this.parseTitle,
    };

    scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
        }
        if (this.atom.length === 0) {
            this.log(`Atom is not defined`);
            ok = false;
        }
        for (let a of this.atom) {
            let { bizEntityArr: [bizAtom] } = space.getBizFromEntityArrFromName(a);
            if (bizAtom === undefined || bizAtom.bizPhraseType !== BizPhraseType.atom) {
                this.log(`${this.atom} is not an ATOM`);
                ok = false;
            }
            else {
                this.element.atom.push(bizAtom as BizAtom);
            }
        }
        if (this.titles.length === 0) {
            this.log(`Title is not defined`);
            ok = false;
        }
        for (let [t0, t1] of this.titles) {
            let { bizEntityArr: [bizTitle] } = space.getBizFromEntityArrFromName(t0);
            if (bizTitle === undefined || bizTitle.bizPhraseType !== BizPhraseType.title) {
                this.log(`${t0} is not a TITLE`);
                ok = false;
            }
            else {
                let bud = bizTitle.getBud(t1);
                if (bud === undefined) {
                    this.log(`${t0} does not define ${t1}`);
                    ok = false;
                }
                else {
                    this.element.title.push([bizTitle, bud]);
                }
            }
        }
        return ok;
    }
}
