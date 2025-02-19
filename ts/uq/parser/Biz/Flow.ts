import { BizSheet, Flow } from "../../il";
import { BizPhraseType } from "../../il/Biz/BizPhraseType";
import { Space } from "../space";
import { Token } from "../tokens";
import { PBizEntity } from "./Base";

export class PFlow extends PBizEntity<Flow> {
    private sheets: string[] = [];
    private parseSheet = () => {
        if (this.ts.token === Token.LBRACE) {
            this.ts.readToken();
            for (; ;) {
                if (this.ts.token === Token.RBRACE as any) {
                    this.ts.readToken();
                    break;
                }
                this.sheets.push(this.ts.passVar());
                if (this.ts.token === Token.SEMICOLON as any) {
                    this.ts.readToken();
                    continue;
                }
                if (this.ts.token === Token.RBRACE as any) {
                    this.ts.readToken();
                    break;
                }
                this.ts.expectToken(Token.SEMICOLON, Token.RBRACE);
            }
        }
    }

    private parseQuery = () => {

    }

    protected readonly keyColl = {
        sheet: this.parseSheet,
        query: this.parseQuery,
    }

    override scan(space: Space): boolean {
        let ok = true;
        for (let s of this.sheets) {
            let sheet = space.uq.biz.bizEntities.get(s);
            if (sheet.bizPhraseType !== BizPhraseType.sheet) {
                this.log(`${s} is not SHEET`);
                ok = false;
            }
            else {
                this.element.sheets.push(sheet as BizSheet);
            }
        }
        return true;
    }
}
