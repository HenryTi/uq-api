"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PSmallInt = void 0;
const datatype_1 = require("./datatype");
class PSmallInt extends datatype_1.PDataType {
    constructor(dt, context) {
        super(dt, context);
        this.dt = dt;
    }
}
exports.PSmallInt = PSmallInt;
//# sourceMappingURL=smallint.js.map