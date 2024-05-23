"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizQuery = void 0;
const il_1 = require("../../il");
const BizPhraseType_1 = require("../../il/Biz/BizPhraseType");
const bstatement_1 = require("../bstatement");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const BizEntity_1 = require("./BizEntity");
const a = 'a', b = 'b';
class BBizQuery extends BizEntity_1.BBizEntity {
    buildProcedures() {
        const _super = Object.create(null, {
            buildProcedures: { get: () => super.buildProcedures }
        });
        return __awaiter(this, void 0, void 0, function* () {
            _super.buildProcedures.call(this);
            const { id } = this.bizEntity;
            const procQuery = this.createProcedure(`${this.context.site}.${id}q`);
            this.buildQueryProc(procQuery);
        });
    }
    buildQueryProc(proc) {
        const { params, statement, from } = this.bizEntity;
        const site = '$site';
        const json = '$json';
        const varJson = new sql_1.ExpVar(json);
        const { parameters, statements } = proc;
        const { factory } = this.context;
        parameters.push((0, il_1.bigIntField)('$user'), (0, il_1.jsonField)(json), (0, il_1.bigIntField)('$pageStart'), (0, il_1.bigIntField)('$pageSize'));
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var(site, new il_1.BigInt());
        let setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(site, new sql_1.ExpNum(this.context.site));
        for (let param of params) {
            const bud = param;
            const { name } = bud;
            declare.var(name, new il_1.Char(200));
            let set = factory.createSet();
            statements.push(set);
            set.equ(name, new sql_1.ExpFunc('JSON_VALUE', varJson, new sql_1.ExpStr(`$."${name}"`)));
        }
        let sqls = new bstatement_1.Sqls(this.context, statements);
        let { statements: queryStatements } = statement;
        sqls.head(queryStatements);
        sqls.body(queryStatements);
        sqls.foot(queryStatements);
        this.buildFromEntity(statements, from.idFromEntity);
    }
    buildFromEntity(statements, fromEntity) {
        let { bizPhraseType, bizEntityArr } = fromEntity;
        switch (bizPhraseType) {
            default: break;
            case BizPhraseType_1.BizPhraseType.atom:
                this.buildFromAtom(statements, bizEntityArr);
                break;
            case BizPhraseType_1.BizPhraseType.spec:
                this.buildFromSpec(statements, bizEntityArr);
                break;
        }
    }
    buildInsertAtom() {
        const { factory } = this.context;
        let insertAtom = factory.createInsert();
        insertAtom.ignore = true;
        insertAtom.table = new statementWithFrom_1.VarTable('atoms');
        insertAtom.cols = [
            { col: 'id', val: undefined },
            { col: 'base', val: undefined },
            { col: 'no', val: undefined },
            { col: 'ex', val: undefined },
        ];
        let select = factory.createSelect();
        insertAtom.select = select;
        select.distinct = true;
        select.column(new sql_1.ExpField('id', b));
        select.column(new sql_1.ExpField('base', b));
        select.column(new sql_1.ExpField('no', b));
        select.column(new sql_1.ExpField('ex', b));
        return insertAtom;
    }
    buildInsertAtomDirect() {
        let insert = this.buildInsertAtom();
        const { select } = insert;
        select.from(new statementWithFrom_1.VarTable('ret', a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atom, false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', a), new sql_1.ExpField('id', b)));
        return insert;
    }
    buildInsertAtomOfSpec() {
        let insert = this.buildInsertAtom();
        const { select } = insert;
        select.from(new statementWithFrom_1.VarTable('specs', a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atom, false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('base', a), new sql_1.ExpField('id', b)));
        return insert;
    }
    buildFromAtom(statements, entityArr) {
        let insertAtom = this.buildInsertAtomDirect();
        statements.push(insertAtom);
        let entity = entityArr[0];
        this.buildInsertAtomBuds(statements, entity);
    }
    buildFromSpec(statements, entityArr) {
        const { factory } = this.context;
        let insertSpec = factory.createInsert();
        statements.push(insertSpec);
        insertSpec.ignore = true;
        insertSpec.table = new statementWithFrom_1.VarTable('specs');
        insertSpec.cols = [
            { col: 'spec', val: undefined },
            { col: 'atom', val: undefined },
        ];
        let select = factory.createSelect();
        insertSpec.select = select;
        select.distinct = true;
        select.from(new statementWithFrom_1.VarTable('ret', a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.spec, false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', a), new sql_1.ExpField('id', b)));
        select.column(new sql_1.ExpField('id', b), 'spec');
        select.column(new sql_1.ExpField('base', b), 'atom');
        for (let spec of entityArr) {
            const mapBuds = new Map();
            const buds = [];
            for (let [, bud] of spec.props) {
                buds.push(bud);
            }
            this.buildMapBuds(mapBuds, buds);
            this.buildInsertBuds(statements, 'specs', mapBuds);
        }
        let insertAtomOfSpec = this.buildInsertAtomOfSpec();
        statements.push(insertAtomOfSpec);
        // 暂时只生成第一个spec的atom的所有字段
        let [spec] = entityArr;
        this.buildInsertAtomBuds(statements, spec.base);
    }
    buildInsertAtomBuds(statements, atom) {
        const { titleBuds, primeBuds } = atom;
        const mapBuds = new Map();
        this.buildMapBuds(mapBuds, titleBuds);
        this.buildMapBuds(mapBuds, primeBuds);
        this.buildInsertBuds(statements, 'atoms', mapBuds);
    }
    buildMapBuds(mapBuds, buds) {
        if (buds === undefined)
            return;
        for (let bud of buds) {
            let ixBudTbl = il_1.EnumSysTable.ixBudInt;
            switch (bud.dataType) {
                default:
                    ixBudTbl = il_1.EnumSysTable.ixBudInt;
                    break;
                case BizPhraseType_1.BudDataType.dec:
                    ixBudTbl = il_1.EnumSysTable.ixBudDec;
                    break;
                case BizPhraseType_1.BudDataType.str:
                case BizPhraseType_1.BudDataType.char:
                    ixBudTbl = il_1.EnumSysTable.ixBudStr;
                    break;
            }
            let arr = mapBuds.get(ixBudTbl);
            if (arr === undefined) {
                arr = [];
                mapBuds.set(ixBudTbl, arr);
            }
            arr.push(bud);
        }
    }
    buildInsertBuds(statements, mainTbl, mapBuds) {
        for (let [tbl, arr] of mapBuds) {
            this.buildInsertBud(statements, mainTbl, tbl, arr);
        }
    }
    buildInsertBud(statements, mainTbl, tbl, buds) {
        const { factory } = this.context;
        let insertBud = factory.createInsert();
        statements.push(insertBud);
        insertBud.ignore = true;
        insertBud.table = new statementWithFrom_1.VarTable('props');
        insertBud.cols = [
            { col: 'id', val: undefined },
            { col: 'phrase', val: undefined },
            { col: 'value', val: undefined },
        ];
        let select = factory.createSelect();
        insertBud.select = select;
        select.from(new statementWithFrom_1.VarTable(mainTbl, a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(tbl, false, b))
            .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id', a), new sql_1.ExpField('i', b)), new sql_1.ExpIn(new sql_1.ExpField('x', b), ...buds.map(v => new sql_1.ExpNum(v.id)))));
        select.column(new sql_1.ExpField('id', a), 'id');
        select.column(new sql_1.ExpField('x', b), 'phrase');
        select.column(new sql_1.ExpField('value', b), 'value');
    }
}
exports.BBizQuery = BBizQuery;
//# sourceMappingURL=BizQuery.js.map