"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BSelect = void 0;
const bstatement_1 = require("./bstatement");
const select_1 = require("../sql/select");
class BSelect extends bstatement_1.BStatement {
    body(sqls) {
        sqls.push((0, select_1.convertSelect)(this.context, this.istatement.select));
    }
}
exports.BSelect = BSelect;
//# sourceMappingURL=select.js.map