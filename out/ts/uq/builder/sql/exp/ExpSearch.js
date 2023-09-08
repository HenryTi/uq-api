"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpSearch = void 0;
const Exp_1 = require("./Exp");
const exps_1 = require("./exps");
// memo 1
class ExpSearch extends Exp_1.Exp {
    constructor(key, values) {
        super();
        this.key = key;
        this.values = values;
    }
    to(sb) {
        const { factory } = sb;
        const { dbContext } = factory;
        let valKey = new exps_1.ExpFunc(factory.func_concat, new exps_1.ExpStr('%'), new exps_1.ExpFunc(factory.func_ifnull, dbContext.convertExp(this.key), new exps_1.ExpStr('')), new exps_1.ExpStr('%'));
        let ors = this.values.map(v => new exps_1.ExpLike(dbContext.convertExp(v), valKey));
        sb.l();
        sb.sepStart(' OR ');
        for (let or of ors) {
            sb.sep().exp(or);
        }
        sb.sepEnd();
        sb.r();
    }
}
exports.ExpSearch = ExpSearch;
//# sourceMappingURL=ExpSearch.js.map