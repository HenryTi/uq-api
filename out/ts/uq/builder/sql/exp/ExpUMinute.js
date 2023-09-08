"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpUMinute = void 0;
const Exp_1 = require("./Exp");
class ExpUMinute extends Exp_1.Exp {
    constructor(stamp) {
        super();
        this.stamp = stamp;
    }
    to(sb) {
        sb.dbName().dot().fld(`${sb.twProfix}$idmu`);
        sb.l();
        //sb.append('0, 0, ');
        sb.append('0, ');
        if (this.stamp) {
            sb.exp(this.stamp);
        }
        else {
            sb.append('null');
        }
        sb.r();
    }
}
exports.ExpUMinute = ExpUMinute;
//# sourceMappingURL=ExpUMinute.js.map