"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BRole = void 0;
const entity_1 = require("./entity");
class BRole extends entity_1.BEntity {
    log() {
        this.context.log(`${this.entity.type}: (${this.entity.name}`);
    }
}
exports.BRole = BRole;
//# sourceMappingURL=role.js.map