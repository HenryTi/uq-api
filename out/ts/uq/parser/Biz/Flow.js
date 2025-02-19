"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PFlow = void 0;
const BizPhraseType_1 = require("../../il/Biz/BizPhraseType");
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
class PFlow extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.sheets = [];
        this.parseSheet = () => {
            if (this.ts.token === tokens_1.Token.LBRACE) {
                this.ts.readToken();
                for (;;) {
                    if (this.ts.token === tokens_1.Token.RBRACE) {
                        this.ts.readToken();
                        break;
                    }
                    this.sheets.push(this.ts.passVar());
                    if (this.ts.token === tokens_1.Token.SEMICOLON) {
                        this.ts.readToken();
                        continue;
                    }
                    if (this.ts.token === tokens_1.Token.RBRACE) {
                        this.ts.readToken();
                        break;
                    }
                    this.ts.expectToken(tokens_1.Token.SEMICOLON, tokens_1.Token.RBRACE);
                }
            }
        };
        this.parseQuery = () => {
        };
        this.keyColl = {
            sheet: this.parseSheet,
            query: this.parseQuery,
        };
    }
    scan(space) {
        let ok = true;
        for (let s of this.sheets) {
            let sheet = space.uq.biz.bizEntities.get(s);
            if (sheet.bizPhraseType !== BizPhraseType_1.BizPhraseType.sheet) {
                this.log(`${s} is not SHEET`);
                ok = false;
            }
            else {
                this.element.sheets.push(sheet);
            }
        }
        return true;
    }
}
exports.PFlow = PFlow;
//# sourceMappingURL=Flow.js.map