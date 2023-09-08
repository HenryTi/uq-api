import * as il from '../../il';
import { BigInt, DataType, Field, IField, intField } from '../../il';
import { DbContext } from "../dbContext";
import * as sql from '../sql';
import { ExpAdd, ExpLE, ExpNum, ExpVar, Procedure, Statement } from "../sql";

export abstract class SysProcedures {
    protected context: DbContext;
    constructor(context: DbContext) {
        this.context = context;
    }

    protected sysProc(name: string): Procedure {
        let p = this.context.createProcedure(name);
        this.context.sysObjs.procedures.push(p);
        return p;
    }

    protected coreProc(name: string): Procedure {
        let p = this.context.createProcedure(name, true);
        this.context.coreObjs.procedures.push(p);
        return p;
    }

    protected func(name: string, dataType: DataType): Procedure {
        let p = this.context.createFunction(name, dataType);
        this.context.sysObjs.procedures.push(p);
        return p;
    }

    protected coreFunc(name: string, dataType: DataType): Procedure {
        let p = this.context.createFunction(name, dataType);
        this.context.coreObjs.procedures.push(p);
        return p;
    }

    abstract build(): void;

    protected splitIdsTable(stats: Statement[], ids: string, sep: string, dataType?: il.DataType) {
        let factory = this.context.factory;
        let c = '$c', p = '$p', len = '$len', int = new il.Int;
        let declare = factory.createDeclare();
        stats.push(declare);
        declare.var(c, int);
        declare.var(p, int);
        declare.var(len, int);
        let varTable = factory.createVarTable()
        stats.push(varTable);
        varTable.name = 'ids$tbl';
        let vtId = new il.Field();
        vtId.name = 'id'
        vtId.dataType = dataType || new il.BigInt();
        varTable.fields = [vtId];
        varTable.keys = [vtId];

        let set = factory.createSet();
        stats.push(set);
        set.equ(c, new sql.ExpNum(1));
        set = factory.createSet();
        stats.push(set);
        set.equ(len, new sql.ExpFunc(factory.func_length, new sql.ExpVar(ids)));

        let loop = factory.createWhile();
        stats.push(loop);
        loop.no = 1;
        loop.cmp = new sql.ExpGT(new sql.ExpVar(len), new sql.ExpNum(0));
        let lstats = loop.statements;
        set = factory.createSet();
        lstats.add(set);
        set.equ(p, new sql.ExpFunc(factory.func_charindex, new sql.ExpStr(sep), new sql.ExpVar(ids), new sql.ExpVar(c)));
        let iff = factory.createIf();
        lstats.add(iff);
        iff.cmp = new sql.ExpLE(new sql.ExpVar(p), new sql.ExpNum(0));
        set = factory.createSet();
        iff.then(set);
        set.equ(p, new sql.ExpAdd(new sql.ExpVar(len), new sql.ExpNum(1)));

        let insert = factory.createInsert();
        insert.ignore = true;
        lstats.add(insert);
        insert.table = new sql.SqlVarTable(varTable.name);
        insert.cols.push({
            col: vtId.name,
            val: new sql.ExpFunc('SUBSTRING', new sql.ExpVar(ids), new sql.ExpVar(c), new sql.ExpSub(
                new sql.ExpVar(p), new sql.ExpVar(c)
            ))
        });

        iff = factory.createIf();
        lstats.add(iff);
        iff.cmp = new sql.ExpGT(new sql.ExpVar(p), new sql.ExpVar(len));
        let leave = factory.createBreak();
        iff.then(leave);
        leave.no = loop.no;
        set = factory.createSet();
        lstats.add(set);
        set.equ(c, new sql.ExpAdd(new sql.ExpVar(p), new sql.ExpNum(1)));
        return varTable;
    }

    protected strToTable(stats: Statement[], str: string, sepLn: string, sepField: string, fields: Field[]) {
        let factory = this.context.factory;
        let c = '$c', p = '$p', ln = '$ln', len = '$len', int = new il.Int;
        let declare = factory.createDeclare();
        stats.push(declare);
        declare.var(c, int);
        declare.var(p, int);
        declare.var(len, int);
        declare.var(ln, int);

        for (let f of fields) {
            let { name, dataType } = f;
            declare.var('$' + name, dataType);
        }
        let field0 = fields[0];
        let varTable = factory.createVarTable()
        stats.push(varTable);
        varTable.name = 'ids$tbl';
        varTable.fields = fields;
        varTable.keys = [field0];

        let set = factory.createSet();
        stats.push(set);
        set.equ(c, new sql.ExpNum(1));
        set = factory.createSet();
        stats.push(set);
        set.equ(len, new sql.ExpFunc(factory.func_length, new sql.ExpVar(str)));

        let loop = factory.createWhile();
        stats.push(loop);
        loop.no = 1;
        loop.cmp = new sql.ExpGT(new sql.ExpVar(len), new sql.ExpNum(0));
        let lstats = loop.statements;
        let setLn = factory.createSet();
        lstats.add(setLn);
        setLn.equ(ln,
            new sql.ExpFunc(factory.func_charindex, new sql.ExpStr(sepLn), new sql.ExpVar(str), new sql.ExpVar(c))
        );
        let ifLn = factory.createIf();
        lstats.add(ifLn);
        ifLn.cmp = new ExpLE(new ExpVar(ln), ExpNum.num0);
        let setLnLen = factory.createSet();
        ifLn.then(setLnLen);
        setLnLen.equ(ln, new ExpAdd(new ExpVar(len), ExpNum.num1));

        let insert = factory.createInsert();
        insert.ignore = true;
        insert.table = new sql.SqlVarTable(varTable.name);

        let fieldsLen = fields.length;
        for (let i = field0.name === '$id' ? 1 : 0; i < fieldsLen; i++) {
            let f = fields[i];
            let fn = f.name;
            let $fn = '$' + fn;
            let pc: string;
            if (i < fieldsLen - 1) {
                set = factory.createSet();
                lstats.add(set);
                set.equ(p, new sql.ExpFunc(factory.func_charindex, new sql.ExpStr(sepField), new sql.ExpVar(str), new sql.ExpVar(c)));
                pc = p;
            }
            else {
                pc = ln;
            }
            insert.cols.push({
                col: fn,
                val: new ExpVar($fn)
            });
            let setField = factory.createSet();
            lstats.add(setField);
            setField.equ($fn, new sql.ExpFunc(
                'SUBSTRING',
                new sql.ExpVar(str), new sql.ExpVar(c), new sql.ExpSub(
                    new sql.ExpVar(pc), new sql.ExpVar(c)
                ))
            );

            if (i < fieldsLen - 1) {
                let setC = factory.createSet();
                lstats.add(setC);
                setC.equ(c, new ExpAdd(new ExpVar(p), ExpNum.num1));
            }
            else {
                let setP = factory.createSet();
                lstats.add(setP);
                setP.equ(p, new ExpVar(ln));
            }
        }
        lstats.add(insert);

        let iffLeave = factory.createIf();
        lstats.add(iffLeave);
        iffLeave.cmp = new sql.ExpGE(new sql.ExpVar(p), new sql.ExpVar(len));
        let leave = factory.createBreak();
        iffLeave.then(leave);
        leave.no = loop.no;
        set = factory.createSet();
        lstats.add(set);
        set.equ(c, new sql.ExpAdd(new sql.ExpVar(p), new sql.ExpNum(1)));
        return varTable;
    }
}
