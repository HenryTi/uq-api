"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDate = void 0;
const datatype_1 = require("./datatype");
class PDate extends datatype_1.PDataType {
    constructor(dt, context) {
        super(dt, context);
        this.dt = dt;
    }
}
exports.PDate = PDate;
//# sourceMappingURL=date.js.map