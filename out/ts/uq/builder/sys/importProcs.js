"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportProcedures = void 0;
const sysProcedures_1 = require("./sysProcedures");
const il_1 = require("../../il");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const select_1 = require("../sql/select");
const dbContext_1 = require("../dbContext");
class ImportProcedures extends sysProcedures_1.SysProcedures {
    build() {
        this.vId(this.sysProc('$import_vid'));
    }
    vId(p) {
        p.addUnitUserParameter();
        let { factory, hasUnit, unitField } = this.context;
        p.parameters.push((0, il_1.charField)('source', 100), (0, il_1.charField)('entity', 100), (0, il_1.charField)('div', 50), (0, il_1.charField)('no', 50));
        let stats = p.statements;
        let declare = factory.createDeclare();
        stats.push(declare);
        declare.vars((0, il_1.bigIntField)('vid'), (0, il_1.charField)('entityDiv', 100));
        let ifDiv = factory.createIf();
        stats.push(ifDiv);
        ifDiv.cmp = new sql_1.ExpIsNotNull(new sql_1.ExpVar('div'));
        let setDiv = factory.createSet();
        ifDiv.then(setDiv);
        setDiv.equ('entityDiv', new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpVar('entity'), new sql_1.ExpStr('_'), new sql_1.ExpVar('div')));
        let setEntity = factory.createSet();
        ifDiv.else(setEntity);
        setEntity.equ('entityDiv', new sql_1.ExpVar('entity'));
        let selectVid = factory.createSelect();
        stats.push(selectVid);
        selectVid.toVar = true;
        selectVid.column(new sql_1.ExpField('id', 'a'), 'vid');
        selectVid.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.importDataMap, hasUnit, 'a'))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.importDataSourceEntity, hasUnit, 'b'))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('source_entity', 'a'), new sql_1.ExpField('id', 'b')));
        selectVid.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('no', 'a'), new sql_1.ExpVar('no')), new sql_1.ExpEQ(new sql_1.ExpField('source', 'b'), new sql_1.ExpVar('source')), new sql_1.ExpEQ(new sql_1.ExpField('entity', 'b'), new sql_1.ExpVar('entityDiv'))));
        let ifVid = factory.createIf();
        stats.push(ifVid);
        ifVid.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar('vid'));
        //p.declareRollbackHandler = true;
        let trans = p.createTransaction();
        ifVid.then(trans);
        declare.vars((0, il_1.intField)('sourceEntityId'), (0, il_1.intField)('tuidType'));
        let selectTuidVid = factory.createSelect();
        ifVid.then(selectTuidVid);
        selectTuidVid.toVar = true;
        selectTuidVid.col('id', 'tuidType');
        selectTuidVid.col('tuidVId', 'vid');
        selectTuidVid.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.entity));
        selectTuidVid.where(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpVar('entityDiv')));
        selectTuidVid.lock = select_1.LockType.update;
        let ifEntityVid = factory.createIf();
        ifVid.then(ifEntityVid);
        ifEntityVid.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar('vid'));
        let getTableSeed = factory.createGetTableSeed();
        ifEntityVid.then(getTableSeed);
        getTableSeed.seed = new sql_1.ExpVar('vid');
        getTableSeed.table = new sql_1.ExpVar('entityDiv');
        let incVid = factory.createSet();
        ifVid.then(incVid);
        incVid.equ('vid', new sql_1.ExpAdd(new sql_1.ExpVar('vid'), sql_1.ExpVal.num1));
        let updateTuidVid = factory.createUpdate();
        ifVid.then(updateTuidVid);
        updateTuidVid.cols = [{ col: 'tuidVid', val: new sql_1.ExpVar('vid') }];
        updateTuidVid.table = new sql_1.SqlEntityTable('$entity', undefined, hasUnit);
        updateTuidVid.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar('tuidType'));
        let selectSourceEntity = factory.createSelect();
        ifVid.then(selectSourceEntity);
        selectSourceEntity.toVar = true;
        selectSourceEntity.col('id', 'sourceEntityId');
        selectSourceEntity.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.importDataSourceEntity, hasUnit));
        selectSourceEntity.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('source'), new sql_1.ExpVar('source')), new sql_1.ExpEQ(new sql_1.ExpField('entity'), new sql_1.ExpVar('entity'))));
        selectSourceEntity.lock = select_1.LockType.update;
        let iffSource = factory.createIf();
        ifVid.then(iffSource);
        iffSource.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar('sourceEntityId'));
        let insertSourceEntity = factory.createInsert();
        iffSource.then(insertSourceEntity);
        insertSourceEntity.table = new sql_1.SqlEntityTable(il_1.EnumSysTable.importDataSourceEntity, undefined, hasUnit);
        insertSourceEntity.cols = [
            { col: 'source', val: new sql_1.ExpVar('source') },
            { col: 'entity', val: new sql_1.ExpVar('entity') }
        ];
        let setSourceEntity = factory.createSet();
        iffSource.then(setSourceEntity);
        setSourceEntity.equ('sourceEntityId', new sql_1.ExpFunc(factory.func_lastinsertid));
        let insertMap = factory.createInsert();
        ifVid.then(insertMap);
        insertMap.table = new sql_1.SqlEntityTable(il_1.EnumSysTable.importDataMap, undefined, hasUnit);
        insertMap.cols = [
            { col: 'source_entity', val: new sql_1.ExpVar('sourceEntityId') },
            { col: 'no', val: new sql_1.ExpVar('no') },
            { col: 'id', val: new sql_1.ExpVar('vid') },
        ];
        if (hasUnit === true) {
            insertSourceEntity.cols.unshift({ col: unitField.name, val: new sql_1.ExpVar(unitField.name) });
            insertMap.cols.unshift({ col: unitField.name, val: new sql_1.ExpVar(unitField.name) });
        }
        let setTableSeed = factory.createSetTableSeed();
        ifVid.then(setTableSeed);
        setTableSeed.seed = new sql_1.ExpVar('vid');
        setTableSeed.table = new sql_1.ExpVar('entityDiv');
        let commit = p.createCommit();
        ifVid.then(commit);
        let ret = factory.createSelect();
        ret.column(new sql_1.ExpVar('vid'), 'vid');
        stats.push(ret);
    }
}
exports.ImportProcedures = ImportProcedures;
//# sourceMappingURL=importProcs.js.map