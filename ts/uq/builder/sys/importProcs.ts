import * as sql from '../sql';
import { SysProcedures } from './sysProcedures';
import { EnumSysTable, charField, bigIntField, intField, JoinType } from '../../il';
import {
    ExpField, ExpEQ, ExpAnd, ExpVar, ExpIsNull
    , SqlEntityTable, ExpFunc, ExpIsNotNull, ExpStr
    , ExpAdd, ExpVal
} from '../sql';
import { EntityTable } from '../sql/statementWithFrom';
import { LockType } from '../sql/select';
import { sysTable } from '../dbContext';

export class ImportProcedures extends SysProcedures {
    build() {
        this.vId(this.sysProc('$import_vid'));
    }

    private vId(p: sql.Procedure) {
        p.addUnitUserParameter();
        let { factory, hasUnit, unitField } = this.context;
        p.parameters.push(
            charField('source', 100),
            charField('entity', 100),
            charField('div', 50),
            charField('no', 50),
        );
        let stats = p.statements;
        let declare = factory.createDeclare();
        stats.push(declare);
        declare.vars(bigIntField('vid'), charField('entityDiv', 100));
        let ifDiv = factory.createIf();
        stats.push(ifDiv);
        ifDiv.cmp = new ExpIsNotNull(new ExpVar('div'));
        let setDiv = factory.createSet();
        ifDiv.then(setDiv);
        setDiv.equ('entityDiv', new ExpFunc(factory.func_concat, new ExpVar('entity'), new ExpStr('_'), new ExpVar('div')));
        let setEntity = factory.createSet();
        ifDiv.else(setEntity);
        setEntity.equ('entityDiv', new ExpVar('entity'));

        let selectVid = factory.createSelect();
        stats.push(selectVid);
        selectVid.toVar = true;
        selectVid.column(new ExpField('id', 'a'), 'vid');
        selectVid.from(new EntityTable(EnumSysTable.importDataMap, hasUnit, 'a'))
            .join(JoinType.join, new EntityTable(EnumSysTable.importDataSourceEntity, hasUnit, 'b'))
            .on(new ExpEQ(new ExpField('source_entity', 'a'), new ExpField('id', 'b')))
        selectVid.where(new ExpAnd(
            new ExpEQ(new ExpField('no', 'a'), new ExpVar('no')),
            new ExpEQ(new ExpField('source', 'b'), new ExpVar('source')),
            new ExpEQ(new ExpField('entity', 'b'), new ExpVar('entityDiv')),
        ));

        let ifVid = factory.createIf();
        stats.push(ifVid);
        ifVid.cmp = new ExpIsNull(new ExpVar('vid'));
        //p.declareRollbackHandler = true;
        let trans = p.createTransaction();
        ifVid.then(trans);

        declare.vars(intField('sourceEntityId'), intField('tuidType'));

        let selectTuidVid = factory.createSelect();
        ifVid.then(selectTuidVid);
        selectTuidVid.toVar = true;
        selectTuidVid.col('id', 'tuidType');
        selectTuidVid.col('tuidVId', 'vid');
        selectTuidVid.from(sysTable(EnumSysTable.entity));
        selectTuidVid.where(new ExpEQ(new ExpField('name'), new ExpVar('entityDiv')));
        selectTuidVid.lock = LockType.update;

        let ifEntityVid = factory.createIf();
        ifVid.then(ifEntityVid);
        ifEntityVid.cmp = new ExpIsNull(new ExpVar('vid'));

        let getTableSeed = factory.createGetTableSeed();
        ifEntityVid.then(getTableSeed);
        getTableSeed.seed = new ExpVar('vid');
        getTableSeed.table = new ExpVar('entityDiv');

        let incVid = factory.createSet();
        ifVid.then(incVid);
        incVid.equ('vid', new ExpAdd(new ExpVar('vid'), ExpVal.num1));

        let updateTuidVid = factory.createUpdate();
        ifVid.then(updateTuidVid);
        updateTuidVid.cols = [{ col: 'tuidVid', val: new ExpVar('vid') }];
        updateTuidVid.table = new SqlEntityTable('$entity', undefined, hasUnit);
        updateTuidVid.where = new ExpEQ(new ExpField('id'), new ExpVar('tuidType'));

        let selectSourceEntity = factory.createSelect();
        ifVid.then(selectSourceEntity);
        selectSourceEntity.toVar = true;
        selectSourceEntity.col('id', 'sourceEntityId');
        selectSourceEntity.from(new EntityTable(EnumSysTable.importDataSourceEntity, hasUnit));
        selectSourceEntity.where(new ExpAnd(
            new ExpEQ(new ExpField('source'), new ExpVar('source')),
            new ExpEQ(new ExpField('entity'), new ExpVar('entity')),
        ));
        selectSourceEntity.lock = LockType.update;
        let iffSource = factory.createIf();
        ifVid.then(iffSource);
        iffSource.cmp = new ExpIsNull(new ExpVar('sourceEntityId'));
        let insertSourceEntity = factory.createInsert();
        iffSource.then(insertSourceEntity);
        insertSourceEntity.table = new SqlEntityTable(EnumSysTable.importDataSourceEntity, undefined, hasUnit);
        insertSourceEntity.cols = [
            { col: 'source', val: new ExpVar('source') },
            { col: 'entity', val: new ExpVar('entity') }
        ];
        let setSourceEntity = factory.createSet();
        iffSource.then(setSourceEntity);
        setSourceEntity.equ('sourceEntityId', new ExpFunc(factory.func_lastinsertid));

        let insertMap = factory.createInsert();
        ifVid.then(insertMap);
        insertMap.table = new SqlEntityTable(EnumSysTable.importDataMap, undefined, hasUnit);
        insertMap.cols = [
            { col: 'source_entity', val: new ExpVar('sourceEntityId') },
            { col: 'no', val: new ExpVar('no') },
            { col: 'id', val: new ExpVar('vid') },
        ];
        if (hasUnit === true) {
            insertSourceEntity.cols.unshift(
                { col: unitField.name, val: new ExpVar(unitField.name) }
            );
            insertMap.cols.unshift(
                { col: unitField.name, val: new ExpVar(unitField.name) }
            );
        }

        let setTableSeed = factory.createSetTableSeed();
        ifVid.then(setTableSeed);
        setTableSeed.seed = new ExpVar('vid');
        setTableSeed.table = new ExpVar('entityDiv');

        let commit = p.createCommit();
        ifVid.then(commit);

        let ret = factory.createSelect();
        ret.column(new ExpVar('vid'), 'vid');
        stats.push(ret);
    }
}

