import { SqlBuilder } from "../sqlBuilder";
import { Exp } from './Exp';
import { ExpVal } from "./exps";

export class ExpUMinute extends Exp {
    private stamp: ExpVal;
    constructor(stamp: ExpVal) {
        super();
        this.stamp = stamp;
    }
    to(sb: SqlBuilder) {
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

