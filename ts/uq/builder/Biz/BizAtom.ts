import {
    BigInt, Char,
    bigIntField, EnumSysTable, BizBud, BizAtom, IDUnique, JoinType,
    idField, charField
} from "../../il";
import { BudDataType } from "../../il/Biz/BizPhraseType";
import {
    ExpAnd, ExpCmp, ExpEQ, ExpExists, ExpField, ExpFunc, ExpFuncInUq, ExpIsNotNull, ExpIsNull, ExpNE, ExpNot, ExpNull, ExpNum,
    ExpOr, ExpSelect, ExpStr, ExpTableExists, ExpVal, ExpVar, If, Procedure, SqlVarTable, Statement,
} from "../sql";
import { LockType } from "../sql/select";
import { EntityTable, NameTable, VarTable, VarTableWithSchema } from "../sql/statementWithFrom";
import { BBizBud } from "./BizBud";
import { BBizEntity } from "./BizEntity";

const cId = '$id';
const a = 'a', b = 'b';
export class BBizAtom extends BBizEntity<BizAtom> {
    override async buildProcedures(): Promise<void> {
        super.buildProcedures
        const { id, uniques } = this.bizEntity;
        const procTitlePrime = this.createSiteEntityProcedure('tp');
        this.buildProcTitlePrime(procTitlePrime);
        const procGet = this.createSiteEntityProcedure('ag');
        this.buildProcGet(procGet);
        const funcId = this.createSiteEntityFunction(new BigInt(), 'new');
        this.buildFuncNew(funcId);

        if (uniques !== undefined) {
            const budUniques: Map<BizBud, IDUnique[]> = new Map();
            for (let uq of uniques) {
                const { keys, no } = uq;
                if (uq.name === 'no') continue;
                function addBudUniques(bud: BizBud) {
                    let bu = budUniques.get(bud);
                    if (bu === undefined) {
                        bu = [uq];
                        budUniques.set(bud, bu);
                    }
                    else bu.push(uq);
                }
                for (let key of keys) addBudUniques(key);
                addBudUniques(no);
            }
            for (let [bud, uniqueArr] of budUniques) {
                const procBudUnqiue = this.createSiteProcedure(bud.id, 'bu');
                this.buildBudUniqueProc(procBudUnqiue, uniqueArr);
            }
        }

        let uniquesAll = this.bizEntity.getUniques();
        if (uniquesAll.length > 0) {
            const procUnqiue = this.createSiteEntityProcedure('u');
            this.buildUniqueProc(procUnqiue, uniquesAll);
        }
    }

    private buildUniqueProc(proc: Procedure, uniquesAll: IDUnique[]) {
        const { parameters, statements } = proc;
        const { factory } = this.context;
        const cId = '$id';
        parameters.push(
            bigIntField(cId),
        );
        const declare = factory.createDeclare();
        statements.push(declare);
        for (let unique of uniquesAll) {
            const { id: unqiueId, name } = unique;
            if (name === 'no') {
                statements.push(...this.buildUniqueNO(unique))
                continue;
            }
            let vNo = `${name}_no`;
            let vI = `${name}_i`;
            let ifNotDup = factory.createIf();
            let selectExists = factory.createSelect();
            ifNotDup.cmp = new ExpNot(new ExpExists(selectExists));
            selectExists.col('i', a, a);
            selectExists.from(new EntityTable(EnumSysTable.atomUnique, false, a));
            selectExists.where(new ExpAnd(
                new ExpEQ(new ExpField('i', a), new ExpVar(vI)),
                new ExpEQ(new ExpField('x', a), new ExpVar(vNo)),
                new ExpNE(new ExpField('atom', a), new ExpVar(cId)),
            ));
            const dupTable = 'duptable';
            let ifDupTableExists = factory.createIf();
            ifNotDup.else(ifDupTableExists);
            ifDupTableExists.cmp = new ExpTableExists(new ExpStr(this.context.dbName), new ExpStr('_' + dupTable));
            let insertDup = factory.createInsert();
            ifDupTableExists.then(insertDup);
            insertDup.ignore = true;
            insertDup.table = new SqlVarTable(dupTable);
            insertDup.cols = [
                { col: 'unique', val: new ExpNum(unqiueId) },
                { col: 'i', val: new ExpVar(vI) },
                { col: 'x', val: new ExpVar(vNo) },
                { col: 'atom', val: new ExpVar(cId) },
            ];
            statements.push(...this.buildUnique(unique, ifNotDup));
        }
    }

    private buildBudUniqueProc(proc: Procedure, uniqueArr: IDUnique[]) {
        const { parameters, statements } = proc;
        parameters.push(
            bigIntField(cId),
        );
        const { factory } = this.context;
        for (let unique of uniqueArr) {
            let ifNotDup = factory.createIf();
            ifNotDup.cmp = new ExpEQ(ExpNum.num1, ExpNum.num1);
            statements.push(...this.buildUnique(unique, ifNotDup));
        }
    }

    private buildUnique(unique: IDUnique, ifNotDup: If) {
        let statements: Statement[] = [];
        const { name } = unique;
        const { id, keys, no } = unique;
        const { factory } = this.context;
        let vNo = `${name}_no`;
        let vI = `${name}_i`;
        let varUniquePhrase = new ExpNum(id);
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var(vNo, new Char(400));
        declare.var(vI, new BigInt());
        let noNullCmp: ExpCmp;
        let valKey: ExpVal;
        let len = keys.length;
        let keyStatements: Statement[] = [];
        if (len > 0) {
            const noNullCmpAnds: ExpCmp[] = [new ExpIsNotNull(new ExpVar(vNo))];
            const vKey = `${name}_key`;
            declare.var(vKey, new BigInt());
            for (let i = 0; i < len; i++) {
                let key = keys[i];
                let vKeyI = vKey + i;
                declare.var(vKeyI, new BigInt());
                let selectKey = factory.createSelect();
                statements.push(selectKey);
                selectKey.toVar = true;
                switch (key.dataType) {
                    case BudDataType.radio:
                        selectKey.column(new ExpField('ext', b), vKeyI);
                        selectKey.from(new EntityTable(EnumSysTable.ix, false, a))
                            .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, b))
                            .on(new ExpEQ(new ExpField('id', b), new ExpField('x', a)));
                        selectKey.where(new ExpAnd(
                            new ExpEQ(new ExpField('i', a), new ExpVar(cId)),
                            new ExpEQ(new ExpField('base', b), new ExpNum(key.id)),
                        ))
                        break;
                    default:
                        selectKey.col('value', vKeyI);
                        selectKey.from(new EntityTable(EnumSysTable.ixInt, false));
                        selectKey.where(new ExpAnd(
                            new ExpEQ(new ExpField('i'), new ExpVar(cId)),
                            new ExpEQ(new ExpField('x'), new ExpNum(key.id)),
                        ));
                        break;
                }
                noNullCmpAnds.push(new ExpIsNotNull(new ExpVar(vKeyI)));
            }

            let setKey = factory.createSet();
            keyStatements.push(setKey);
            setKey.equ(vKey, varUniquePhrase);
            for (let i = 0; i < len; i++) {
                let setKeyi = factory.createSet();
                keyStatements.push(setKeyi);
                setKeyi.equ(vKey, new ExpFuncInUq('bud$id',
                    [
                        ExpNum.num0, ExpNum.num0, ExpNum.num1, ExpNull.null,
                        new ExpVar(vKey), new ExpVar(vKey + i),
                    ],
                    true
                ));
            }

            noNullCmp = new ExpAnd(...noNullCmpAnds);
            valKey = new ExpVar(vKey);
        }
        else {
            noNullCmp = new ExpIsNotNull(new ExpVar(vNo));
            valKey = varUniquePhrase;
        }
        let setNo = factory.createSet();
        statements.push(setNo);
        let selectNO = factory.createSelect();
        selectNO.col('value');
        selectNO.from(new EntityTable(EnumSysTable.ixStr, false));
        selectNO.where(new ExpAnd(
            new ExpEQ(new ExpField('i'), new ExpVar(cId)),
            new ExpEQ(new ExpField('x'), new ExpNum(no.id)),
        ));
        setNo.equ(vNo, new ExpSelect(selectNO));

        let ifNoNull = factory.createIf();
        statements.push(ifNoNull);
        ifNoNull.cmp = noNullCmp;
        ifNoNull.then(...keyStatements);
        let setI = factory.createSet();
        ifNoNull.then(setI);
        setI.equ(vI, valKey);

        ifNoNull.then(ifNotDup);

        let del = factory.createDelete();
        ifNotDup.then(del);
        del.tables = [a];
        del.from(new EntityTable(EnumSysTable.atomUnique, false, a));
        del.where(new ExpAnd(
            new ExpEQ(new ExpField('i', a), new ExpVar(vI)),
            new ExpOr(
                new ExpEQ(new ExpField('atom', a), new ExpVar(cId)),
                new ExpEQ(new ExpField('x', a), new ExpVar(vNo)),
            ),
        ));
        let insert = factory.createInsert();
        ifNotDup.then(insert);
        insert.table = new EntityTable(EnumSysTable.atomUnique, false);
        insert.ignore = true;
        insert.cols = [
            { col: 'i', val: new ExpVar(vI) },
            { col: 'x', val: new ExpVar(vNo) },
            { col: 'atom', val: new ExpVar(cId) },
        ];
        return statements;
    }

    private buildUniqueNO(unique: IDUnique) {
        const { factory } = this.context;
        let statements: Statement[] = [];
        let selectNo = factory.createSelect();
        selectNo.lock = LockType.none;
        selectNo.from(new EntityTable(EnumSysTable.atom, false));
        selectNo.col('no');
        selectNo.where(new ExpEQ(new ExpField('id'), new ExpVar(cId)));
        let insert = factory.createInsert();
        insert.table = new EntityTable(EnumSysTable.atomUnique, false);
        insert.ignore = true;
        insert.cols = [
            { col: 'i', val: new ExpNum(unique.id) },
            { col: 'x', val: new ExpSelect(selectNo) },
            { col: 'atom', val: new ExpVar(cId) },
        ];
        statements.push(insert);
        return statements;
    }

    private buildProcTitlePrime(procTitlePrime: Procedure) {
        let buds = this.bizEntity.getTitlePrimeBuds();
        let { statements, parameters } = procTitlePrime;
        const atomId = 'atomId';
        parameters.push(idField('atomId', 'big'));
        let { factory } = this.context;
        for (let bud of buds) {
            // let select = this.buildBudSelect(bud);
            const expPhrase = new ExpNum(bud.id);
            let select = BBizBud.createBBizBud(this.context, bud).buildBudSelectWithIdCol(expPhrase, new ExpVar(atomId));
            let insert = factory.createInsert();
            statements.push(insert);
            insert.ignore = true;
            insert.table = new VarTableWithSchema('props');
            insert.cols = [
                { col: 'phrase', val: undefined },
                { col: 'value', val: undefined },
                { col: 'id', val: undefined },
            ];
            insert.select = select;
        }
    }

    private buildFuncNew(proc: Procedure) {
        const { parameters, statements } = proc;
        const { factory } = this.context;
        parameters.push(bigIntField('$site'));
        parameters.push(charField('no', 100));
        parameters.push(bigIntField('base'));
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var('id', new BigInt());
        declare.var('root', new BigInt());
        const setId = factory.createSet();
        statements.push(setId);
        const selectEntity = factory.createSelect();
        setId.equ('id', new ExpFuncInUq('$idnu', [new ExpSelect(selectEntity)], true));
        selectEntity.col('id');
        selectEntity.from(new EntityTable(EnumSysTable.entity, false));
        selectEntity.where(new ExpEQ(new ExpField('name'), new ExpStr('atom')));

        const ifNoNull = factory.createIf();
        statements.push(ifNoNull);
        ifNoNull.cmp = new ExpIsNull(new ExpVar('no'));
        const setNo = factory.createSet();
        ifNoNull.then(setNo);
        setNo.equ(
            'no',
            new ExpFuncInUq('$no', [new ExpVar('$site'), new ExpStr('atom'), ExpNull.null], true)
        );
        const selectRoot = factory.createSelect();
        statements.push(selectRoot);
        selectRoot.toVar = true;
        const cte = 'cte';
        const selectCte = factory.createSelect();
        selectCte.col('i');
        selectCte.col('x');
        selectCte.from(new EntityTable(EnumSysTable.ixPhrase, false));
        selectCte.where(new ExpEQ(new ExpField('x'), new ExpVar('base')));
        selectCte.unionsAll = true;
        const selectCteR = factory.createSelect();
        selectCte.unions = [
            selectCteR,
        ];
        selectCteR.col('i', undefined, a);
        selectCteR.col('x', undefined, a);
        selectCteR.from(new EntityTable(EnumSysTable.ixPhrase, false, a))
            .join(JoinType.join, new NameTable(cte))
            .on(new ExpEQ(new ExpField('x', a), new ExpField('i', cte)));
        selectRoot.cte = {
            alias: cte,
            recursive: true,
            select: selectCte,
        };
        selectRoot.col('x', 'root');
        selectRoot.from(new NameTable(cte));
        selectRoot.where(new ExpEQ(new ExpField('i'), ExpNum.num0));

        const upsert = factory.createUpsert();
        statements.push(upsert);
        upsert.table = new EntityTable(EnumSysTable.atom, false);
        upsert.cols = [
            { col: 'base', val: new ExpVar('root') },
            { col: 'no', val: new ExpVar('no') },
        ];
        upsert.keys = [{ col: 'id', val: new ExpVar('id') }];

        const upsertIDU = factory.createUpsert();
        statements.push(upsertIDU);
        upsertIDU.table = new EntityTable(EnumSysTable.idu, false);
        upsertIDU.cols = [{ col: 'base', val: new ExpVar('base') }];
        upsertIDU.keys = [{ col: 'id', val: new ExpVar('id') }];

        const ret = factory.createReturn();
        statements.push(ret);
        ret.returnVar = 'id';
    }

    private buildProcGet(proc: Procedure) {
        const { parameters, statements } = proc;
        const { factory } = this.context;
        parameters.push(bigIntField('id'));
        const memo = factory.createMemo();
        statements.push(memo);
        memo.text = 'get atom ' + this.bizEntity.name;
        const varTable = factory.createVarTable();
        statements.push(varTable);
        varTable.name = 'arrProps';
        const phraseField = charField('phrase', 200);
        const valueField = charField('value', 200);
        varTable.keys = [phraseField];
        varTable.fields = [phraseField, valueField];
        const varId = new ExpVar('id');
        this.bizEntity.forEachBud(bud => {
            const insert = factory.createInsert(); +
                statements.push(insert);
            insert.ignore = true;
            insert.table = new VarTableWithSchema(varTable.name);
            insert.cols = [
                { col: 'phrase', val: undefined },
                { col: 'value', val: undefined },
            ];
            const expPhrase = new ExpStr(bud.name);
            insert.select = BBizBud.createBBizBud(this.context, bud).buildBudSelectWithoutIdCol(expPhrase, varId);
        });
    }
}
