"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BEnum = void 0;
const entity_1 = require("./entity");
class BEnum extends entity_1.BEntity {
    log() {
        this.context.log(`${this.entity.type}: (${this.entity.name}`);
    }
}
exports.BEnum = BEnum;
//# sourceMappingURL=enum.js.map