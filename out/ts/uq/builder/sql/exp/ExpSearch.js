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
        // let ors: ExpCmp[] = [];
        sb.l();
        let first = true;
        for (let val of this.values) {
            if (first === true)
                first = false;
            else
                sb.append(' OR ');
            const atoms = val.getAtoms();
            if (atoms.length === 1 && atoms[0].type === 'bizexp') {
                sb.append('(SELECT COUNT(*) FROM (SELECT NULL as a UNION ');
                sb.exp(dbContext.convertExp(val));
                sb.r().append(' AS t WHERE t.a LIKE ').exp(valKey).r().append('>0');
            }
            else {
                sb.exp(new exps_1.ExpLike(dbContext.convertExp(val), valKey));
            }
        }
        ;
        /*
        sb.sepStart(' OR ');
        for (let or of ors) {
            sb.sep().exp(or);
        }
        sb.sepEnd();
        */
        sb.r();
    }
}
exports.ExpSearch = ExpSearch;
//# sourceMappingURL=ExpSearch.js.map