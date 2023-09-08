"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpID = void 0;
const il_1 = require("../../../il");
const il_2 = require("../../../il");
const Exp_1 = require("./Exp");
class ExpID extends Exp_1.Exp {
    constructor(entity, forID, newType, vals, uuid, stamp, phrases) {
        super();
        this.entity = entity;
        this.forID = forID;
        this.newType = newType;
        this.vals = vals;
        this.uuid = uuid;
        this.stamp = stamp;
        this.phrases = phrases;
    }
    to(sb) {
        if (this.phrases !== undefined) {
            let f = `${sb.twProfix}$phrase`;
            sb.l().append('select id from ').dbName().dot().fld(f)
                .append(' where name=');
            if (Array.isArray(this.phrases) === true) {
                sb.string(this.phrases.join('.'));
            }
            else {
                sb.exp(this.phrases);
            }
            sb.r();
            return;
        }
        if (this.newType === il_1.IDNewType.prev) {
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
    $id(sb) {
        let f = `${sb.twProfix}${this.entity.name}$id`;
        sb.dbName().dot().fld(f);
        sb.l();
        sb.var$unit().comma();
        sb.var$user().comma();
        sb.append(this.newType);
        if (this.entity.idType === il_2.EnumIdType.UUID) {
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
exports.ExpID = ExpID;
//# sourceMappingURL=ExpID.js.map