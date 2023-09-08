"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BImport = void 0;
const entity_1 = require("./entity");
class BImport extends entity_1.BEntity {
    log() {
        this.context.log(`${this.entity.type}: (${this.entity.name}`);
    }
}
exports.BImport = BImport;
//# sourceMappingURL=import.js.map