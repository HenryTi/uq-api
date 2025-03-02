"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizStatementState = void 0;
const biz_statement_sub_1 = require("./biz.statement.sub");
class PBizStatementState extends biz_statement_sub_1.PBizStatementSub {
    _parse() {
        let key = this.ts.passKey();
        switch (key) {
            case 'end':
                break;
            case 'discard':
                this.to = '$' + key;
                break;
            case 'to':
                this.to = this.ts.passVar();
                break;
            default:
                this.ts.expect('to', 'end', 'discard');
                break;
        }
    }
    scan(space) {
        let ok = true;
        if (this.to !== undefined) {
            const { bizStatement } = this.element;
            const { bizAct } = bizStatement;
            const { sheet } = bizAct.binState.sheetState;
            let state = sheet.states.find(v => v.name === this.to);
            if (state === undefined) {
                ok = false;
                this.log(`SHEET ${sheet.getJName()} has not STATE ${this.to}`);
            }
            else {
                this.element.to = state;
            }
        }
        return ok;
    }
}
exports.PBizStatementState = PBizStatementState;
//# sourceMappingURL=biz.statement.state.js.map