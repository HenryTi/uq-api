import {
    BigInt, BizBin, BizSheet, Dec, JoinType
    , bigIntField, decField, idField, EnumSysTable
    , BudDataType, FieldShowItem, FieldShow, Char, BizPend, jsonField
} from "../../il";
import { Sqls } from "../bstatement";
import { $site } from "../consts";
import { ExecSql, ExpAnd, ExpEQ, ExpField, ExpFunc, ExpGT, ExpIsNull, ExpNum, ExpRoutineExists, ExpStr, ExpVal, ExpVar, Procedure, SqlVarTable, Statement } from "../sql";
import { userParamName } from "../sql/sqlBuilder";
import { EntityTable, VarTable, VarTableWithSchema } from "../sql/statementWithFrom";
import { BBizEntity } from "./BizEntity";

const sheetId = 'sheet';
const s = 's';
const si = 'si';
const sx = 'sx';
const svalue = 'svalue';
const samount = 'samount';
const sprice = 'sprice';
const pendFrom = 'pend';
const i = 'i';
const x = 'x';
const value = 'value';
const amount = 'amount';
const price = 'price';
const binId = 'bin';
const pBinId = '$pBin';
const a = 'a';
const b = 'b';
const c = 'c';
const d = 'd';
const tempBinTable = 'bin';

export class BBizPend extends BBizEntity<BizPend> {
    override async buildProcedures(): Promise<void> {
        super.buildProcedures();
        const { id } = this.bizEntity;
        const procQuery = this.createProcedure(`${this.context.site}.${id}gp`);
        this.buildQueryProc(procQuery);
    }

    private buildQueryProc(proc: Procedure) {
        let { pendQuery } = this.bizEntity;
        if (pendQuery === undefined) {
            proc.dropOnly = true;
            return;
        }

        let { statements, parameters } = proc;
        let { factory, site } = this.context;
        parameters.push(bigIntField('pendPhrase'));
        parameters.push(jsonField('params'));

        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var($site, new BigInt());

        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ($site, new ExpNum(site));
    }
}
