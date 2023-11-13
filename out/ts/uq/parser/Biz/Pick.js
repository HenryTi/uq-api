"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizPick = void 0;
const il_1 = require("../../il");
const il_2 = require("../../il");
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
class PBizPick extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.atoms = [];
        this.specs = [];
        this.parseAtom = () => {
            this.parseArrayVar(this.atoms);
        };
        this.parseSpec = () => {
            this.parseArrayVar(this.specs);
        };
        this.parseQuery = () => {
            let query = new il_1.BizQueryTable(this.element.biz);
            this.context.parseElement(query);
            this.element.query = query;
            this.ts.mayPassToken(tokens_1.Token.SEMICOLON);
        };
        this.keyColl = {
            atom: this.parseAtom,
            spec: this.parseSpec,
            param: this.parseProp,
            query: this.parseQuery,
        };
    }
    parseArrayVar(arr) {
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            for (;;) {
                if (this.ts.token === tokens_1.Token.VAR) {
                    arr.push(this.ts.lowerVar);
                    this.ts.readToken();
                }
                else {
                    this.ts.expectToken(tokens_1.Token.VAR);
                }
                if (this.ts.token === tokens_1.Token.COMMA) {
                    this.ts.readToken();
                    if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                        this.ts.readToken();
                        break;
                    }
                    continue;
                }
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
            }
        }
        else if (this.ts.token === tokens_1.Token.VAR) {
            arr.push(this.ts.lowerVar);
            this.ts.readToken();
        }
        else {
            this.ts.expectToken(tokens_1.Token.VAR, tokens_1.Token.LPARENTHESE);
        }
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
    scan(space) {
        let ok = true;
        const { query } = this.element;
        if (query !== undefined) {
            if (query.pelement.scan(space) === false) {
                ok = false;
            }
        }
        for (let atom of this.atoms) {
            let bizEntity = this.getBizEntity(space, atom, il_2.BizPhraseType.atom);
            if (bizEntity === undefined) {
                ok = false;
            }
            this.element.atoms.push(bizEntity);
        }
        for (let spec of this.specs) {
            let bizEntity = this.getBizEntity(space, spec, il_2.BizPhraseType.spec);
            if (bizEntity === undefined) {
                ok = false;
            }
            this.element.specs.push(bizEntity);
        }
        return ok;
    }
}
exports.PBizPick = PBizPick;
//# sourceMappingURL=Pick.js.map