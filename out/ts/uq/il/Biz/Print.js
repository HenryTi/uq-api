"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizPrint = exports.BizTemplet = void 0;
const parser_1 = require("../../parser");
const BizPhraseType_1 = require("./BizPhraseType");
const Entity_1 = require("./Entity");
class BizTemplet extends Entity_1.BizNotID {
    constructor() {
        super(...arguments);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.templet;
    }
    parser(context) {
        return new parser_1.PBizTemplet(this, context);
    }
}
exports.BizTemplet = BizTemplet;
class BizPrint extends Entity_1.BizNotID {
    constructor() {
        super(...arguments);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.print;
    }
    parser(context) {
        return new parser_1.PBizPrint(this, context);
    }
}
exports.BizPrint = BizPrint;
//# sourceMappingURL=Print.js.map