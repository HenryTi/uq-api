"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizAct = void 0;
const element_1 = require("../element");
const Base_1 = require("./Base");
class BizAct extends element_1.IElement {
    constructor(owner) {
        super();
        this.bizPhraseType = Base_1.BizPhraseType.detailAct;
        this.owner = owner;
    }
}
exports.BizAct = BizAct;
//# sourceMappingURL=Act.js.map