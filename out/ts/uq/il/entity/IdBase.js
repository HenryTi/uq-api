"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdBase = void 0;
const entity_1 = require("./entity");
class IdBase extends entity_1.EntityWithTable {
    constructor() {
        super(...arguments);
        // id: Field;
        this.fields = [];
    }
}
exports.IdBase = IdBase;
//# sourceMappingURL=IdBase.js.map