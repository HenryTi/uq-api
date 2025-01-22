import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { TextStatement, intField } from "../../il";
import { ExpVal, ExpFunc, ExpVar, ExpAdd, ExpGT, ExpLT, ExpStr, ExpSub, If } from "../sql";
import { VarTable } from "../sql/statementWithFrom";

export class BTextStatement extends BStatement<TextStatement> {

    override body(sqls: Sqls) {
        let { textVar, tableVar, sep, ln } = this.istatement;
        let { name, fields } = tableVar;
        let factory = this.context.factory;
        let dec = factory.createDeclare();
        sqls.push(dec);
        let vp = name + '#p';
        let vc = name + '#c';
        let vLen = name + '#len';
        dec.vars(intField(vp), intField(vc), intField(vLen), intField('$row'));
        for (let f of fields) {
            dec.var(name + '##' + f.name, f.dataType);
        }

        let setP = factory.createSet();
        sqls.push(setP);
        setP.equ(vp, ExpVal.num1);
        let setLen = factory.createSet();
        sqls.push(setLen);
        setLen.equ(vLen, new ExpFunc(factory.func_length, new ExpVar(textVar)));

        let loop = factory.createWhile();
        sqls.push(loop);
        loop.no = this.istatement.no;
        loop.cmp = new ExpGT(new ExpVar(vLen), ExpVal.num0);

        let len = fields.length;
        for (let i = 0; i < len; i++) {
            let delimiter: string;
            let iff: If = undefined;
            if (i === len - 1) {
                delimiter = ln || '\\n';
                iff = factory.createIf();
                iff.cmp = new ExpLT(new ExpVar(vc), ExpVal.num1);
                let setPC = factory.createSet()
                iff.then(setPC);
                setPC.equ(vc, new ExpAdd(new ExpVar(vLen), ExpVal.num1));
            }
            else {
                delimiter = sep || '\\t';
            }
            let setC = factory.createSet();
            loop.statements.add(setC);
            setC.equ(vc,
                new ExpFunc(factory.func_charindex, new ExpStr(delimiter), new ExpVar(textVar), new ExpVar(vp)));
            if (iff !== undefined) loop.statements.add(iff);
            let setF = factory.createSet();
            loop.statements.add(setF);
            let field = fields[i];
            setF.equ(name + '##' + field.name,
                new ExpFunc(
                    'NULLIF',
                    new ExpFunc(factory.func_substr, new ExpVar(textVar), new ExpVar(vp), new ExpSub(new ExpVar(vc), new ExpVar(vp))),
                    new ExpStr('')
                )
            );
            let setPAhead = factory.createSet();
            loop.statements.add(setPAhead);
            setPAhead.equ(vp, new ExpAdd(new ExpVar(vc), ExpVal.num1));
        }
        let insert = factory.createInsert();
        loop.statements.add(insert);
        insert.table = new VarTable(name);
        for (let f of fields) {
            insert.cols.push({
                col: f.name,
                val: new ExpVar(name + '##' + f.name)
            });
        }

        let iffExit = factory.createIf();
        loop.statements.add(iffExit);
        iffExit.cmp = new ExpGT(new ExpVar(vc), new ExpVar(vLen));
        let leave = factory.createBreak();
        iffExit.then(leave);
        leave.no = this.istatement.no;
    }
}

