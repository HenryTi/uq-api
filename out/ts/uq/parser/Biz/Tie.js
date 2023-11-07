"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizTie = void 0;
const il_1 = require("../../il");
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
class PBizTie extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.parseI = () => {
            this.parseTieField(this.element.i);
        };
        this.parseX = () => {
            this.parseTieField(this.element.x);
        };
        this.keyColl = {
            i: this.parseI,
            x: this.parseX,
        };
    }
    parseTieField(tieField) {
        tieField.caption = this.ts.mayPassString();
        tieField.atoms = this.parseAtoms();
    }
    parseAtoms() {
        let ret = [this.ts.passVar()];
        for (;;) {
            if (this.ts.token !== tokens_1.Token.BITWISEOR)
                break;
            this.ts.readToken();
            ret.push(this.ts.passVar());
        }
        this.ts.passToken(tokens_1.Token.SEMICOLON);
        return ret;
    }
    scan(space) {
        let ok = true;
        let { i, x } = this.element;
        if (this.scanTieField(space, i) === false)
            ok = false;
        if (this.scanTieField(space, x) === false)
            ok = false;
        return ok;
    }
    scanTieField(space, tieField) {
        let ok = true;
        let atoms = [];
        for (let name of tieField.atoms) {
            let bizEntity = space.getBizEntity(name);
            let { bizPhraseType } = bizEntity;
            if (bizPhraseType === il_1.BizPhraseType.atom || bizPhraseType === il_1.BizPhraseType.spec) {
                atoms.push(bizEntity);
            }
            else {
                this.log(`${name} is neither ATOM nor SPEC`);
                ok = false;
            }
        }
        tieField.atoms = atoms;
        return ok;
    }
}
exports.PBizTie = PBizTie;
//# sourceMappingURL=Tie.js.map