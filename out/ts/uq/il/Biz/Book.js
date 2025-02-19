"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizBook = void 0;
const parser_1 = require("../../parser");
const BizPhraseType_1 = require("./BizPhraseType");
const Entity_1 = require("./Entity");
class BizBook extends Entity_1.BizNotID {
    constructor() {
        super(...arguments);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.book;
    }
    parser(context) {
        return new parser_1.PBizBook(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        if (this.i !== undefined) {
            ret.i = this.i.id;
        }
        return ret;
    }
}
exports.BizBook = BizBook;
//# sourceMappingURL=Book.js.map