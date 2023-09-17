"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PJsonDataType = void 0;
const datatype_1 = require("./datatype");
class PJsonDataType extends datatype_1.PDataType {
    constructor(dt, context) {
        super(dt, context);
        this.dt = dt;
    }
}
exports.PJsonDataType = PJsonDataType;
//# sourceMappingURL=json.js.map