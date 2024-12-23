import { BizStatementOut } from "../../../il";
import { ExpAtVar, ExpFunc, ExpStr, ExpVal, SqlVarTable } from "../../sql";
import { BStatement } from "../../bstatement/bstatement";
import { Sqls } from "../../bstatement/sqls";

export class BBizStatementOut extends BStatement<BizStatementOut> {
    override body(sqls: Sqls): void {
        const { factory } = this.context;
        const { useOut, tos, detail, sets } = this.istatement;
        let varName = '$' + useOut.varName;

        const tblTo = new SqlVarTable(varName + '$TO');
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
        function buildParams(pathFunc: (path: string) => string) {
            let params: ExpVal[] = [];
            for (let i in sets) {
                params.push(new ExpStr(pathFunc(i)), context.expVal(sets[i]));
            }
            return params;
        }
        let vNew: ExpVal;
        if (detail === undefined) {
            vNew = new ExpFunc('JSON_SET', new ExpAtVar(varName), ...buildParams((path: string) => `$."${path}"`));
        }
        else {
            vNew = new ExpFunc(
                'JSON_ARRAY_Append',
                new ExpAtVar(varName),
                new ExpStr(`$."${detail}"`),
                new ExpFunc('JSON_OBJECT', ...buildParams((path: string) => path)),
            );
        }
        setV.equ(varName, vNew);
    }
}

