"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BForkUpField = exports.BBinUpField = void 0;
const sql_1 = require("../sql");
class BUpField extends sql_1.Exp {
    constructor(tblAlias, upField) {
        super();
        this.tblAlias = tblAlias;
        this.upField = upField;
    }
}
class BBinUpField extends BUpField {
    to(sb) {
        sb.fld(this.tblAlias).dot().fld(this.upField);
    }
}
exports.BBinUpField = BBinUpField;
class BForkUpField extends BUpField {
    to(sb) {
        sb.fld(this.tblAlias).dot().fld(this.upField);
    }
}
exports.BForkUpField = BForkUpField;
//# sourceMappingURL=BUpField.js.map