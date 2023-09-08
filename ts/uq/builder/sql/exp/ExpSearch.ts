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
        let ors: ExpCmp[] = this.values.map(v => new ExpLike(
            dbContext.convertExp(v) as ExpVal,
            valKey,
        ));
        sb.l();
        sb.sepStart(' OR ');
        for (let or of ors) {
            sb.sep().exp(or);
        }
        sb.sepEnd();
        sb.r();
    }
}
