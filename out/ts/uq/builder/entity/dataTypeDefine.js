"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BDataTypeDefine = void 0;
const entity_1 = require("./entity");
class BDataTypeDefine extends entity_1.BEntity {
    log() {
        this.context.log(`${this.entity.type}: (${this.entity.name}`);
    }
}
exports.BDataTypeDefine = BDataTypeDefine;
//# sourceMappingURL=dataTypeDefine.js.map