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
exports.BBizCombo = void 0;
const il_1 = require("../../il");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const BizEntity_1 = require("./BizEntity");
const a = 'a', b = 'b', c = 'c';
class BBizCombo extends BizEntity_1.BBizEntity {
    buildTables() {
        return __awaiter(this, void 0, void 0, function* () {
            const { id, keys, indexes } = this.bizEntity;
            let table = this.createSiteTable(id);
            let keyFields = keys.map(v => {
                let ret = (0, il_1.bigIntField)(String(v.id));
                ret.nullable = false;
                return ret;
            });
            let idField = (0, il_1.bigIntField)('id');
            table.keys = [idField];
            table.fields = [idField, ...keyFields];
            let keyIndex = new il_1.Index('$key', true);
            keyIndex.fields.push(...keyFields);
            table.indexes.push(keyIndex);
        });
    }
    buildProcedures() {
        return __awaiter(this, void 0, void 0, function* () {
            // const { id } = this.bizEntity;
            const funcId = this.createSiteEntityFunction(new il_1.BigInt(), '.ID');
            this.buildFuncId(funcId);
            const toIdTable = this.createSiteEntityProcedure('ids');
            this.buildIdTable(toIdTable);
        });
    }
    buildFuncId(funcId) {
        const { factory, dbName } = this.context;
        const { parameters, statements } = funcId;
        const { id, keys } = this.bizEntity;
        parameters.push((0, il_1.tinyIntField)('new'), ...keys.map(v => v.createField()));
        const vId = '$id';
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var(vId, new il_1.BigInt());
        let tbl = new statementWithFrom_1.GlobalSiteTable(this.context.site, id);
        const select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.column(new sql_1.ExpField('id'), vId);
        select.from(tbl);
        select.where(new sql_1.ExpAnd(...keys.map(v => {
            const { id } = v;
            const name = String(id);
            return new sql_1.ExpEQ(new sql_1.ExpField(name), new sql_1.ExpVar(name));
        })));
        const iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new sql_1.ExpAnd(new sql_1.ExpIsNull(new sql_1.ExpVar(vId)), new sql_1.ExpNE(new sql_1.ExpVar('new'), sql_1.ExpNum.num0));
        const newId = factory.createSet();
        iff.then(newId);
        let selectEntity = factory.createSelect();
        selectEntity.col('id');
        selectEntity.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.entity, false));
        // selectEntity.where(new ExpEQ(new ExpField('name'), new ExpStr('combo')));
        selectEntity.where(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr('spec'))); // 没有combo表,存放spec $id_u
        newId.equ(vId, new sql_1.ExpFuncDb(dbName, '$IDMU', new sql_1.ExpSelect(selectEntity), sql_1.ExpNull.null));
        const insert = factory.createInsert();
        iff.then(insert);
        insert.table = tbl;
        insert.cols = [
            { col: 'id', val: new sql_1.ExpVar(vId) },
            ...keys.map(v => {
                const name = String(v.id);
                return {
                    col: name,
                    val: new sql_1.ExpVar(name),
                };
            }),
        ];
        const insertIDU = factory.createInsert();
        iff.then(insertIDU);
        insertIDU.ignore = true;
        insertIDU.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.idu, false);
        insertIDU.cols = [
            { col: 'id', val: new sql_1.ExpVar(vId) },
            { col: 'base', val: new sql_1.ExpNum(id) },
        ];
        const ret = factory.createReturn();
        statements.push(ret);
        ret.returnVar = vId;
    }
    buildIdTable(proc) {
        const { keys } = this.bizEntity;
        const { statements } = proc;
        for (let key of keys) {
            statements.push(this.buildInsertProp(key));
            statements.push(this.buildInsertKey(key));
        }
    }
    buildInsertProp(key) {
        const { factory } = this.context;
        const insert = factory.createInsert();
        insert.ignore = true;
        insert.table = new statementWithFrom_1.VarTable('props');
        insert.cols = [
            { col: 'id', val: undefined },
            { col: 'phrase', val: undefined },
            { col: 'value', val: undefined },
        ];
        const { id: keyId } = key;
        const expValue = new sql_1.ExpField(String(keyId), a);
        const select = factory.createSelect();
        insert.select = select;
        select.column(new sql_1.ExpField('id', a), 'id');
        select.column(new sql_1.ExpNum(keyId), 'phrase');
        select.column(new sql_1.ExpFuncCustom(factory.func_cast, expValue, new sql_1.ExpDatePart('JSON')), 'value');
        select.from(new statementWithFrom_1.GlobalSiteTable(this.context.site, this.bizEntity.id, a))
            .join(il_1.JoinType.join, new statementWithFrom_1.VarTable('$page', b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('i', b), new sql_1.ExpField('id', a)));
        return insert;
    }
    buildInsertKey(key) {
        const { factory } = this.context;
        const insert = factory.createInsert();
        insert.ignore = true;
        insert.table = new statementWithFrom_1.VarTable('idtable');
        insert.cols = [
            { col: 'id', val: undefined },
            { col: 'phrase', val: undefined },
        ];
        const expId = new sql_1.ExpField(String(key.id), a);
        const select = factory.createSelect();
        insert.select = select;
        select.column(expId, 'id');
        select.column(new sql_1.ExpField('base', c), 'phrase');
        select.from(new statementWithFrom_1.GlobalSiteTable(this.context.site, this.bizEntity.id, a))
            .join(il_1.JoinType.join, new statementWithFrom_1.VarTable('$page', b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('i', b), new sql_1.ExpField('id', a)))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.idu, false, c))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', c), expId));
        return insert;
    }
}
exports.BBizCombo = BBizCombo;
//# sourceMappingURL=BizCombo.js.map