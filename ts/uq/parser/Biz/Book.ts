import { BizBudValue, BizBook, BizID } from "../../il";
import { BizPhraseType } from "../../il/Biz/BizPhraseType";
import { Space } from "../space";
import { Token } from "../tokens";
// import { Token } from "../tokens";
import { PBizEntity } from "./Base";

export class PBizBook extends PBizEntity<BizBook> {
    private i: string;
    private parseI = () => {
        this.i = this.ts.passVar();
        this.ts.passToken(Token.SEMICOLON);
    }

    private parseBookProp = () => {
        this.parseProp();
    }

    readonly keyColl = {
        i: this.parseI,
        prop: this.parseBookProp,
    };

    override scan(space: Space): boolean {
        let ok = super.scan(space);
        if (this.i !== undefined) {
            let bizEntity = space.uq.biz.bizEntities.get(this.i);
            switch (bizEntity.bizPhraseType) {
                default:
                    this.log(`${this.i} must be ATOM, COMBO or Fork`);
                    ok = false;
                    break;
                case BizPhraseType.atom:
                case BizPhraseType.fork:
                case BizPhraseType.combo:
                    this.element.i = bizEntity as BizID;
                    break;
            }
        }
        return ok;
    }
}
