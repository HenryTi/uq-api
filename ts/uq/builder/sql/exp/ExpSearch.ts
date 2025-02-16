import { ValueExpression } from "../../../il";
import { SqlBuilder } from "../sqlBuilder";
import { Exp } from "./Exp";
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
        // let ors: ExpCmp[] = [];
        sb.l();
        let first = true;
        for (let val of this.values) {
            if (first === true) first = false;
            else sb.append(' OR ');
            const atoms = val.getAtoms();
            if (atoms.length === 1 && atoms[0].type === 'bizexp') {
                sb.append('(SELECT COUNT(*) FROM (SELECT NULL as a UNION ');
                sb.exp(dbContext.convertExp(val));
                sb.r().append(' AS t WHERE t.a LIKE ').exp(valKey).r().append('>0');
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
