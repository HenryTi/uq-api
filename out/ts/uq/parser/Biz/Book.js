"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizBook = void 0;
const BizPhraseType_1 = require("../../il/Biz/BizPhraseType");
const tokens_1 = require("../tokens");
// import { Token } from "../tokens";
const Base_1 = require("./Base");
class PBizBook extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.parseI = () => {
            this.i = this.ts.passVar();
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.parseBookProp = () => {
            this.parseProp();
        };
        this.keyColl = {
            i: this.parseI,
            prop: this.parseBookProp,
        };
    }
    scan(space) {
        let ok = super.scan(space);
        if (this.i !== undefined) {
            let bizEntity = space.uq.biz.bizEntities.get(this.i);
            switch (bizEntity.bizPhraseType) {
                default:
                    this.log(`${this.i} must be ATOM, COMBO or Fork`);
                    ok = false;
                    break;
                case BizPhraseType_1.BizPhraseType.atom:
                case BizPhraseType_1.BizPhraseType.fork:
                case BizPhraseType_1.BizPhraseType.combo:
                    this.element.i = bizEntity;
                    break;
            }
        }
        return ok;
    }
}
exports.PBizBook = PBizBook;
//# sourceMappingURL=Book.js.map