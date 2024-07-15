"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizPrint = exports.PBizTemplet = void 0;
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
class PBizTemplet extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.keyColl = {};
    }
    _parse() {
        this.parseHeader();
        if (this.ts.token !== tokens_1.Token.CODE) {
            this.ts.expectToken(tokens_1.Token.CODE);
        }
        this.element.template = this.ts.text;
        this.ts.readToken();
    }
}
exports.PBizTemplet = PBizTemplet;
class PBizPrint extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.parsePrintHeader = () => {
            this.header = this.ts.passVar();
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.parsePrintContent = () => {
            this.content = this.ts.passVar();
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.parsePrintFooter = () => {
            this.footer = this.ts.passVar();
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.parsePageHeader = () => {
            this.pageHeader = this.ts.passVar();
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.parsePageFooter = () => {
            this.pageFooter = this.ts.passVar();
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.keyColl = {
            header: this.parsePrintHeader,
            content: this.parsePrintContent,
            footer: this.parsePrintFooter,
            pageheader: this.parsePageHeader,
            pagefooter: this.parsePageFooter,
        };
    }
    scan(space) {
        let ok = true;
        return ok;
    }
}
exports.PBizPrint = PBizPrint;
//# sourceMappingURL=Print.js.map