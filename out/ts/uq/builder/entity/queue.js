"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BQueue = void 0;
const entity_1 = require("./entity");
class BQueue extends entity_1.BEntity {
    log() {
        this.context.log(`${this.entity.type}: (${this.entity.name}`);
    }
}
exports.BQueue = BQueue;
//# sourceMappingURL=queue.js.map