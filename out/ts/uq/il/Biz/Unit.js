"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizUnit = void 0;
const Entity_1 = require("./Entity");
class BizUnit extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.name = '$unit';
        this.type = '$unit';
    }
    parser(context) {
        return undefined;
    }
}
exports.BizUnit = BizUnit;
//# sourceMappingURL=Unit.js.map