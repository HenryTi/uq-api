"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpNO = void 0;
const Exp_1 = require("./Exp");
class ExpNO extends Exp_1.Exp {
    constructor(entity, stamp) {
        super();
        this.entity = entity;
        this.stamp = stamp;
    }
    to(sb) {
        sb.dbName().dot().fld(`${sb.twProfix}$no`);
        sb.l();
        sb.var('$unit').comma().append('\'').append(this.entity.name).append('\'').comma();
        if (this.stamp) {
            sb.exp(this.stamp);
        }
        else {
            sb.append('null');
        }
        sb.r();
    }
}
exports.ExpNO = ExpNO;
//# sourceMappingURL=ExpNO.js.map