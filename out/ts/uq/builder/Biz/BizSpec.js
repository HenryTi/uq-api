"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizSpec = void 0;
const il_1 = require("../../il");
const BizEntity_1 = require("./BizEntity");
class BBizSpec extends BizEntity_1.BBizEntity {
    async buildTables() {
        let { appObjs } = this.context;
        let { tables } = appObjs;
        let table = this.context.createTable(`spec$${this.bizEntity.name}`);
        tables.push(table);
        // let { keyFields, propFields } = this.base;
        /*
        let idField = bigIntField('id');
        table.keys = [idField];
        let baseField = bigIntField('base');
        let indexFields: Field[] = [baseField];
        let fields = table.fields = [
            idField,
            baseField,
        ];
        fields.push(...keyFields);
        indexFields.push(...keyFields);
        fields.push(...propFields);
        let index = new Index('base_keys', true);
        index.fields.push(...indexFields);
        table.indexes.push(index);
        */
    }
    async buildProcedures() {
        let { appObjs } = this.context;
        let { procedures } = appObjs;
        let func = this.context.createFunction(`spec$${this.bizEntity.name}$id`, new il_1.BigInt());
        procedures.push(func);
        this.buildIdFunc(func);
    }
    buildIdFunc(func) {
        /*
        let { factory } = this.context;
        let { parameters, statements } = func;
        parameters.push(
            tinyIntField('$new'),
            bigIntField('$atom'),
        );
        let { name, keys, keyFields } = this.base;
        parameters.push(...keyFields);
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.vars(
            bigIntField('$id'),
        );

        let varAtom = new ExpVar('$atom');

        let ret$Id = factory.createReturn();
        ret$Id.returnVar = '$id';

        let entityTable = new EntityTable(`spec$${name}`, false);
        let selectId = factory.createSelect();
        statements.push(selectId);
        selectId.toVar = true;
        selectId.col('id', '$id');
        selectId.from(entityTable);
        let wheres: ExpCmp[] = [];
        for (let [, value] of keys) {
            let { name } = value;
            wheres.push(new ExpEQ(new ExpField(name), new ExpVar(name)));
        }
        selectId.where(
            new ExpAnd(
                new ExpEQ(new ExpField('base'), varAtom),
                ...wheres
            )
        );

        let ifNew0 = factory.createIf();
        statements.push(ifNew0);
        ifNew0.cmp = new ExpEQ(new ExpVar('$new'), ExpNum.num0);
        ifNew0.then(ret$Id);

        let if$Id = factory.createIf();
        statements.push(if$Id);
        if$Id.cmp = new ExpIsNotNull(new ExpVar('$id'));
        if$Id.then(ret$Id);

        let selectEntity = factory.createSelect();
        selectEntity.col('id');
        selectEntity.from(sysTable(EnumSysTable.entity));
        selectEntity.where(new ExpEQ(new ExpField('name'), new ExpStr(name)));
        selectEntity.lock = LockType.update;

        let set$Id = factory.createSet();
        statements.push(set$Id);
        set$Id.equ('$id', new ExpFuncInUq('$IDNU', [new ExpSelect(selectEntity)], true));

        let insert = factory.createInsert();
        statements.push(insert);
        insert.table = entityTable;
        insert.cols = [
            { col: 'id', val: new ExpVar('$id') },
            { col: 'base', val: varAtom },
        ];
        let { cols } = insert;
        for (let [, value] of keys) {
            let { name: kName } = value;
            cols.push({ col: kName, val: new ExpVar(kName) });
        }
        statements.push(ret$Id);
        */
    }
}
exports.BBizSpec = BBizSpec;
//# sourceMappingURL=BizSpec.js.map