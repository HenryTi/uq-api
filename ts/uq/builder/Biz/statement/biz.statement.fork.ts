import {
    EnumSysTable, BizStatementFork, JoinType,
    BizFork
} from "../../../il";
import { BudDataType } from "../../../il/Biz/BizPhraseType";
import {
    ExpAnd, ExpAtVar, ExpCmp, ExpEQ, ExpField, ExpFunc, ExpNull, ExpNum, ExpStr, ExpVal,
    ExpVar
} from "../../sql";
import { EntityTable } from "../../sql/statementWithFrom";
import { Sqls } from "../../bstatement/sqls";
import { BBizStatementID } from "./biz.statement.ID";
import { $site, $user } from "../../consts";

const a = 'a';
export class BBizStatementFork extends BBizStatementID<BizFork, BizStatementFork> {
    override body(sqls: Sqls): void {
        const { fork } = this.istatement;
        if (fork !== undefined) {
            this.buildFromFork(sqls, fork);
        }
        else {
            this.buildFromForkVal(sqls);
        }
    }

    protected buildIdFromNo(sqls: Sqls): ExpVal {
        return;
    }

    protected buildIdFromUnique(sqls: Sqls): ExpVal {
        return;
    }

    private buildFromFork(sqls: Sqls, fork: BizFork) {
        const { factory } = this.context;
        const { inVals } = this.istatement;
        let select = factory.createSelect();
        sqls.push(select);
        select.toVar = true;
        select.column(new ExpField('id', a), undefined, this.istatement.toVar);
        select.from(new EntityTable(EnumSysTable.idu, false, a));
        let wheres: ExpCmp[] = [
            new ExpEQ(new ExpField('base', a), this.context.expVal(inVals[0])),
        ]
        let { keys } = fork;
        let len = keys.length;
        for (let i = 0; i < len; i++) {
            const key = keys[i];
            const { id, dataType } = key;
            let tbl: EnumSysTable, val: ExpVal = this.context.expVal(inVals[i + 1]);
            switch (dataType) {
                default:
                    tbl = EnumSysTable.ixInt;
                    break;
                case BudDataType.date:
                    tbl = EnumSysTable.ixInt;
                    val = new ExpFunc('DATEDIFF', val, new ExpStr('1970-01-01'));
                    break;
                case BudDataType.str:
                case BudDataType.char:
                    tbl = EnumSysTable.ixStr;
                    break;
                case BudDataType.dec:
                    tbl = EnumSysTable.ixDec;
                    break;
                case BudDataType.fork:
                    tbl = EnumSysTable.ixJson;
                    break;
            }
            let t = 't' + i;
            select.join(JoinType.join, new EntityTable(tbl, false, t))
            select.on(new ExpAnd(
                new ExpEQ(new ExpField('i', t), new ExpField('id', a)),
                new ExpEQ(new ExpField('x', t), new ExpNum(id)),
            ));
            wheres.push(new ExpEQ(new ExpField('value', t), val));
        }
        select.where(new ExpAnd(...wheres));
    }

    private buildFromForkVal(sqls: Sqls) {
        const { toVar, valFork } = this.istatement;
        const { factory, site } = this.context;
        let exp = this.context.expVal(valFork);
        let execSql = factory.createExecSql();
        execSql.no = this.istatement.no;
        sqls.push(execSql);
        execSql.sql = new ExpFunc(
            factory.func_concat,
            new ExpStr(`CALL \`${$site}.${site}\`.\``),
            new ExpFunc('JSON_VALUE', exp, new ExpStr('$."$"')),
            new ExpStr('$f`(?,?,?,?,?)'),
        );
        execSql.parameters = [
            new ExpNum(site)            // $site
            , new ExpVar($user)         // $user
            , ExpNull.null              // $id
            , new ExpFunc('JSON_VALUE', exp, new ExpStr('$."$base"'))       // base
            , exp
        ];

        let setVal = factory.createSet();
        sqls.push(setVal);
        setVal.equ(toVar.varName(toVar.name), new ExpAtVar('execSqlValue'));
    }
}
