"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizTitle = void 0;
// import { Token } from "../tokens";
const Base_1 = require("./Base");
class PBizTitle extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.parseTitleProp = () => {
            this.parseProp();
        };
        this.keyColl = {
            prop: this.parseTitleProp,
        };
    }
}
exports.PBizTitle = PBizTitle;
//# sourceMappingURL=Title.js.map