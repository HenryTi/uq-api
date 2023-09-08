"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBigInt = void 0;
const datatype_1 = require("./datatype");
class PBigInt extends datatype_1.PDataType {
    constructor(dt, context) {
        super(dt, context);
        this.dt = dt;
    }
}
exports.PBigInt = PBigInt;
//# sourceMappingURL=bigint.js.map