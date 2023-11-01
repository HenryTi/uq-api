"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizTie = void 0;
const il_1 = require("../../il");
const Base_1 = require("./Base");
class PBizTie extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.keyColl = {
            prop: this.parseProp,
        };
    }
    // bud 有没有type。Tie里面的bud，不需要type，都是bigint
    parseBud(name, ui) {
        return new il_1.BizBudInt(this.element.biz, name, ui);
    }
}
exports.PBizTie = PBizTie;
//# sourceMappingURL=Tie.js.map