"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizSelectStatement = exports.EnumAsc = exports.FromEntity = void 0;
const Entity_1 = require("../Entity");
// 下面这句，改成 from "../Biz"; 会出错 Class extends value undefined is not a constructor or null
const statement_1 = require("../../statement");
class FromEntity extends Entity_1.BizFromEntity {
}
exports.FromEntity = FromEntity;
var EnumAsc;
(function (EnumAsc) {
    EnumAsc[EnumAsc["asc"] = 1] = "asc";
    EnumAsc[EnumAsc["desc"] = 0] = "desc";
})(EnumAsc || (exports.EnumAsc = EnumAsc = {}));
class BizSelectStatement extends statement_1.Statement {
    getBizFromEntityFromAlias(alias) {
        return this.getBizFromEntityArrFromAlias(alias, this.fromEntity);
    }
    getBizFromEntityArrFromAlias(alias, fromEntity) {
        if (alias === fromEntity.alias)
            return fromEntity;
        const { subs } = fromEntity;
        if (subs === undefined)
            return undefined;
        for (let sub of subs) {
            let ret = this.getBizFromEntityArrFromAlias(alias, sub.fromEntity);
            if (ret !== undefined)
                return ret;
        }
        return undefined;
    }
}
exports.BizSelectStatement = BizSelectStatement;
//# sourceMappingURL=biz.select.js.map