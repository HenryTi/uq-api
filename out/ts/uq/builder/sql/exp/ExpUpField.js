"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpForkUpField = exports.ExpBinUpField = void 0;
const il_1 = require("../../../il");
const Exp_1 = require("./Exp");
class ExpUpField extends Exp_1.Exp {
    constructor(tblAlias, upField) {
        super();
        this.tblAlias = tblAlias;
        this.upField = upField;
    }
}
class ExpBinUpField extends ExpUpField {
    to(sb) {
        sb.append('(SELECT ').fld(this.upField).append(' FROM ').dbName().dot().fld(il_1.EnumSysTable.sheet)
            .append(' WHERE id=').fld(this.tblAlias).dot().fld('sheet').r();
    }
}
exports.ExpBinUpField = ExpBinUpField;
class ExpForkUpField extends ExpUpField {
    to(sb) {
        sb.append('(SELECT ').fld(this.upField).append(' FROM ').dbName().dot().fld(il_1.EnumSysTable.atom)
            .append(' WHERE id=').fld(this.tblAlias).dot().fld('base)');
    }
}
exports.ExpForkUpField = ExpForkUpField;
//# sourceMappingURL=ExpUpField.js.map