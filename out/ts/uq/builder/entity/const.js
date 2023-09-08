"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BConst = void 0;
const entity_1 = require("./entity");
class BConst extends entity_1.BEntity {
    log() {
        this.context.log(`${this.entity.type}: (${this.entity.name}`);
    }
}
exports.BConst = BConst;
//# sourceMappingURL=const.js.map