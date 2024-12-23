"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizStatementOut = void 0;
const sql_1 = require("../../sql");
const bstatement_1 = require("../../bstatement/bstatement");
class BBizStatementOut extends bstatement_1.BStatement {
    body(sqls) {
        const { factory } = this.context;
        const { useOut, tos, detail, sets } = this.istatement;
        let varName = '$' + useOut.varName;
        const tblTo = new sql_1.SqlVarTable(varName + '$TO');
        for (let to of tos) {
            const insert = factory.createInsert();
            sqls.push(insert);
            insert.table = tblTo;
            insert.cols = [
                { col: 'to', val: this.context.expVal(to) }
            ];
        }
        let setV = factory.createSet();
        sqls.push(setV);
        setV.isAtVar = true;
        const context = this.context;
        function buildParams(pathFunc) {
            let params = [];
            for (let i in sets) {
                params.push(new sql_1.ExpStr(pathFunc(i)), context.expVal(sets[i]));
            }
            return params;
        }
        let vNew;
        if (detail === undefined) {
            vNew = new sql_1.ExpFunc('JSON_SET', new sql_1.ExpAtVar(varName), ...buildParams((path) => `$."${path}"`));
        }
        else {
            vNew = new sql_1.ExpFunc('JSON_ARRAY_Append', new sql_1.ExpAtVar(varName), new sql_1.ExpStr(`$."${detail}"`), new sql_1.ExpFunc('JSON_OBJECT', ...buildParams((path) => path)));
        }
        setV.equ(varName, vNew);
    }
}
exports.BBizStatementOut = BBizStatementOut;
//# sourceMappingURL=biz.statement.out.js.map