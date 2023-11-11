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
        const { pendQuery } = this.bizEntity;
        if (pendQuery === undefined) {
            proc.dropOnly = true;
            return;
        }

        const { params, statement, from } = pendQuery;
        const json = '$json';
        const varJson = new ExpVar(json);
        let { statements, parameters } = proc;
        let { factory, site } = this.context;
        parameters.push(
            bigIntField('$user'),
            jsonField(json),
            bigIntField('$pageStart'),
            bigIntField('$pageSize'),
        );

        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var($site, new BigInt());

        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ($site, new ExpNum(site));


        for (let param of params) {
            const bud = param;
            const { name } = bud;
            declare.var(name, new Char(200));
            let set = factory.createSet();
            statements.push(set);
            set.equ(name, new ExpFunc('JSON_VALUE', varJson, new ExpStr(`$."${name}"`)));
        }

        let sqls = new Sqls(this.context, statements);
        let { statements: queryStatements } = statement;
        sqls.head(queryStatements);
        sqls.body(queryStatements);
        sqls.foot(queryStatements);
    }
}
