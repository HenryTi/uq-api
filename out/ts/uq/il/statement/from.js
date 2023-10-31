"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FromStatement = void 0;
const parser_1 = require("../../parser");
const statement_1 = require("./statement");
class FromStatement extends statement_1.Statement {
    constructor() {
        super(...arguments);
        this.bizEntityArr = [];
        this.cols = [];
    }
    get type() { return 'from'; }
    db(db) {
        return db.fromStatement(this);
    }
    parser(context) {
        return new parser_1.PFromStatement(this, context);
    }
    getBud(fieldName) {
        let bizEntity = undefined;
        let bud = undefined;
        for (let entity of this.bizEntityArr) {
            let b = entity.getBud(fieldName);
            if (b !== undefined) {
                bud = b;
            }
        }
        return [bizEntity, bud];
    }
}
exports.FromStatement = FromStatement;
//# sourceMappingURL=from.js.map