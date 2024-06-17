"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizAssign = void 0;
const BizPhraseType_1 = require("../../il/Biz/BizPhraseType");
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
class PBizAssign extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.atom = [];
        this.titles = [];
        this.parseAtom = () => {
            for (;;) {
                this.atom.push(this.ts.passVar());
                if (this.ts.token === tokens_1.Token.SEMICOLON) {
                    this.ts.readToken();
                    break;
                }
                if (this.ts.token === tokens_1.Token.BITWISEOR) {
                    this.ts.readToken();
                    continue;
                }
                this.ts.expectToken(tokens_1.Token.SEMICOLON, tokens_1.Token.BITWISEOR);
            }
        };
        this.parseTitle = () => {
            for (;;) {
                let t0 = this.ts.passVar();
                this.ts.passToken(tokens_1.Token.DOT);
                let t1 = this.ts.passVar();
                this.titles.push([t0, t1]);
                if (this.ts.token === tokens_1.Token.SEMICOLON) {
                    this.ts.readToken();
                    break;
                }
                if (this.ts.token === tokens_1.Token.COMMA) {
                    this.ts.readToken();
                    continue;
                }
                this.ts.expectToken(tokens_1.Token.SEMICOLON, tokens_1.Token.COMMA);
            }
        };
        this.keyColl = {
            atom: this.parseAtom,
            title: this.parseTitle,
            book: this.parseTitle,
        };
    }
    scan(space) {
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
            if (bizAtom === undefined || bizAtom.bizPhraseType !== BizPhraseType_1.BizPhraseType.atom) {
                this.log(`${this.atom} is not an ATOM`);
                ok = false;
            }
            else {
                this.element.atom.push(bizAtom);
            }
        }
        if (this.titles.length === 0) {
            this.log(`Title is not defined`);
            ok = false;
        }
        for (let [t0, t1] of this.titles) {
            let { bizEntityArr: [bizTitle] } = space.getBizFromEntityArrFromName(t0);
            if (bizTitle === undefined || bizTitle.bizPhraseType !== BizPhraseType_1.BizPhraseType.book) {
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
exports.PBizAssign = PBizAssign;
//# sourceMappingURL=Assign.js.map