"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizInAct = exports.BizOut = exports.BizIn = exports.BizInOut = void 0;
const builder_1 = require("../../builder");
const parser_1 = require("../../parser");
const Base_1 = require("./Base");
const BizPhraseType_1 = require("./BizPhraseType");
const Entity_1 = require("./Entity");
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
    db(dbContext) {
        return new builder_1.BBizIn(dbContext, this);
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
    db(dbContext) {
        return new builder_1.BBizOut(dbContext, this);
    }
}
exports.BizOut = BizOut;
class BizInAct extends Base_1.BizAct {
    constructor(biz, bizIn) {
        super(biz);
        this.bizIn = bizIn;
    }
    parser(context) {
        return new parser_1.PBizInAct(this, context);
    }
}
exports.BizInAct = BizInAct;
//# sourceMappingURL=InOut.js.map