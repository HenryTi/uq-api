"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizOut = exports.BizIn = exports.BizInOut = exports.BizInAct = void 0;
const parser_1 = require("../../parser");
const Base_1 = require("./Base");
const BizPhraseType_1 = require("./BizPhraseType");
const Entity_1 = require("./Entity");
class BizInAct extends Base_1.BizAct {
    parser(context) {
        return;
    }
}
exports.BizInAct = BizInAct;
class BizInOut extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.fields = [];
        this.arrs = {};
    }
}
exports.BizInOut = BizInOut;
class BizIn extends BizInOut {
    constructor() {
        super(...arguments);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.in;
    }
    parser(context) {
        return new parser_1.PBizIn(this, context);
    }
}
exports.BizIn = BizIn;
class BizOut extends BizInOut {
    constructor() {
        super(...arguments);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.out;
    }
    parser(context) {
        return new parser_1.PBizOut(this, context);
    }
}
exports.BizOut = BizOut;
//# sourceMappingURL=InOut.js.map