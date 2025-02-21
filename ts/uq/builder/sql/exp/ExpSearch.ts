import { BizExp, BizExpOperand, ValueExpression } from "../../../il";
import { BBizExp } from "../../tools";
import { SqlBuilder } from "../sqlBuilder";
import { Exp } from "./Exp";
import { BizExpOperand as BBizExpOperand } from "./ExpBizOperand";
import { ExpCmp, ExpFunc, ExpLike, ExpStr, ExpVal } from "./exps";

// memo 1
export class ExpSearch extends Exp {
    private readonly key: ValueExpression;
    private readonly values: ValueExpression[];
    constructor(key: ValueExpression, values: ValueExpression[]) {
        super();
        this.key = key;
        this.values = values;
    }
    to(sb: SqlBuilder) {
        const { factory } = sb;
        const { dbContext } = factory;
        let valKey = new ExpFunc(factory.func_concat,
            new ExpStr('%'),
            new ExpFunc(
                factory.func_ifnull,
                dbContext.convertExp(this.key),
                new ExpStr(''),
            ),
            new ExpStr('%'));
        const ors: ExpCmp[] = this.values.map(v => {
            const atoms = v.getAtoms();
            if (atoms.length === 1 && atoms[0].type === 'bizexp') {
                const { bizExp } = (atoms[0] as BizExpOperand);
                return new ExpBizExpSearch(bizExp, valKey);
                /*
                sb.append('EXISTS(SELECT * FROM (SELECT NULL as a UNION ');
                sb.exp(dbContext.convertExp(val));
                sb.r().append(' AS t WHERE t.a LIKE ').exp(valKey).append(' LIMIT 1').r();
                */
            }
            return new ExpLike(
                dbContext.convertExp(v) as ExpVal,
                valKey,
            );
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

class ExpBizExpSearch extends Exp {
    private readonly bizExp: BizExp;
    private readonly valLike: ExpVal;
    constructor(bizExp: BizExp, valLike: ExpVal) {
        super();
        this.bizExp = bizExp;
        this.valLike = valLike;
    }

    to(sb: SqlBuilder): void {
        const { props } = this.bizExp;
        for (let i = 0; i < props.length; i++) {
            let bExp = new BBizExp(i);
            bExp.convertFrom(sb.factory.dbContext, this.bizExp);
            if (i > 0) sb.append(' OR ');
            const bBizExpOperand = new BBizExpOperand(bExp);
            bBizExpOperand.to(sb);
            sb.append(' LIKE ');
            sb.exp(this.valLike);
        }
    }
}
