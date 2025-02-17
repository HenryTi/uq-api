"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpSearch = void 0;
const tools_1 = require("../../tools");
const Exp_1 = require("./Exp");
const ExpBizOperand_1 = require("./ExpBizOperand");
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
        const ors = this.values.map(v => {
            const atoms = v.getAtoms();
            if (atoms.length === 1 && atoms[0].type === 'bizexp') {
                const { bizExp } = atoms[0];
                return new ExpBizExpSearch(bizExp, valKey);
                /*
                sb.append('EXISTS(SELECT * FROM (SELECT NULL as a UNION ');
                sb.exp(dbContext.convertExp(val));
                sb.r().append(' AS t WHERE t.a LIKE ').exp(valKey).append(' LIMIT 1').r();
                */
            }
            return new exps_1.ExpLike(dbContext.convertExp(v), valKey);
        });
        sb.l();
        /*
        let first = true;
        for (let val of this.values) {
            if (first === true) first = false;
            else sb.append(' OR ');
            const atoms = val.getAtoms();
            if (atoms.length === 1 && atoms[0].type === 'bizexp') {
                sb.append('EXISTS(SELECT * FROM (SELECT NULL as a UNION ');
                sb.exp(dbContext.convertExp(val));
                sb.r().append(' AS t WHERE t.a LIKE ').exp(valKey).append(' LIMIT 1').r();
            }
            else {
                sb.exp(
                    new ExpLike(
                        dbContext.convertExp(val) as ExpVal,
                        valKey,
                    )
                );
            }
        };
        */
        sb.sepStart(' OR ');
        for (let or of ors) {
            sb.sep().exp(or);
        }
        sb.sepEnd();
        sb.r();
    }
}
exports.ExpSearch = ExpSearch;
class ExpBizExpSearch extends Exp_1.Exp {
    constructor(bizExp, valLike) {
        super();
        this.bizExp = bizExp;
        this.valLike = valLike;
    }
    to(sb) {
        let bExp = new tools_1.BBizExp();
        bExp.convertFrom(sb.factory.dbContext, this.bizExp);
        const { props } = this.bizExp;
        for (let i = 0; i < props.length; i++) {
            if (i > 0)
                sb.append(' OR ');
            const bBizExpOperand = new ExpBizOperand_1.BizExpOperand(bExp, i);
            bBizExpOperand.to(sb);
            sb.append(' LIKE ');
            sb.exp(this.valLike);
        }
    }
}
//# sourceMappingURL=ExpSearch.js.map