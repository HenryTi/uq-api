import { ID } from '../../../il';
import { SqlBuilder } from "../sqlBuilder";
import { Exp } from './Exp';
import { ExpVal } from "./exps";

export class ExpNO extends Exp {
    private entity: ID;
    private stamp: ExpVal;
    constructor(entity: ID, stamp: ExpVal) {
        super();
        this.entity = entity;
        this.stamp = stamp;
    }
    to(sb: SqlBuilder) {
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

