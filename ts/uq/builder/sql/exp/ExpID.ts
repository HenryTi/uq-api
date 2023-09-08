import { ID, IDNewType } from '../../../il';
import { EnumIdType } from '../../../il';
import { SqlBuilder } from "../sqlBuilder";
import { Exp } from './Exp';
import { ExpVal } from "./exps";

export class ExpID extends Exp {
    private readonly entity: ID;
    private readonly forID: ID;
    private readonly newType: IDNewType;
    private readonly vals: ExpVal[];
    private readonly uuid: ExpVal;
    private readonly stamp: ExpVal;
    private readonly phrases: string[] | ExpVal;
    constructor(entity: ID, forID: ID, newType: IDNewType, vals: ExpVal[], uuid: ExpVal, stamp: ExpVal, phrases: string[] | ExpVal) {
        super();
        this.entity = entity;
        this.forID = forID;
        this.newType = newType;
        this.vals = vals;
        this.uuid = uuid;
        this.stamp = stamp;
        this.phrases = phrases;
    }
    to(sb: SqlBuilder) {
        if (this.phrases !== undefined) {
            let f = `${sb.twProfix}$phrase`;
            sb.l().append('select id from ').dbName().dot().fld(f)
                .append(' where name=');
            if (Array.isArray(this.phrases) === true) {
                sb.string((this.phrases as string[]).join('.'));
            }
            else {
                sb.exp(this.phrases as ExpVal);
            }
            sb.r();
            return;
        }
        if (this.newType === IDNewType.prev) {
            let f = `${sb.twProfix}${this.entity.name}$prev`;
            sb.dbName().dot().fld(f);
            sb.l();
            sb.exp(this.vals[0]);
            sb.r();
            return;
        }
        if (this.forID !== undefined) {
            sb.dbName().dot().fld(`${sb.twProfix}$id_set_entity`);
            sb.l();
            this.$id(sb);
            sb.comma();
            sb.string(this.forID.sName);
            sb.r();
            return;
        }
        this.$id(sb);
    }

    private $id(sb: SqlBuilder) {
        let f = `${sb.twProfix}${this.entity.name}$id`;
        sb.dbName().dot().fld(f);
        sb.l();
        sb.var$unit().comma();
        sb.var$user().comma();
        sb.append(this.newType);
        if (this.entity.idType === EnumIdType.UUID) {
            sb.comma();
            if (this.uuid === undefined)
                sb.append('null');
            else
                sb.exp(this.uuid);
        }
        if (this.entity.isMinute === true) {
            sb.comma();
            if (this.stamp === undefined)
                sb.append('null');
            else
                sb.exp(this.stamp);
        }
        for (let val of this.vals) {
            sb.comma();
            sb.exp(val);
        }
        sb.r();
    }
}

