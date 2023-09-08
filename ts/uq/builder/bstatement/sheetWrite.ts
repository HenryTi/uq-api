import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { SheetWrite, Field, Int, Text, Char } from '../../il';
import { ExpVar, convertExp, ExpVal, ExpFunc, SqlVarTable, ExpStr } from '../sql';
import { BuildSheetStateTo } from "./stateTo";

export class BSheetWrite extends BStatement {
    protected istatement: SheetWrite;
    head(sqls: Sqls) {
    }
    body(sqls: Sqls) {
        let context = this.context;
        let factory = context.factory;
        let {no, sheet, into, intoPointer, arrName, set, idExp } = this.istatement;
		let {name:sheetName, arrs} = sheet;
		if (idExp) {
			let idVal = convertExp(context, idExp) as ExpVal;
			let buildSheetStateTo = new BuildSheetStateTo(sqls, this.context, no, idVal, this.istatement.sheetState);
			buildSheetStateTo.build();
			return;
		}
        let memo = factory.createMemo();
        sqls.push(memo);
        memo.text = 'SHEET create ' + sheetName;

        let vtn = '$sheet';
        let tblMain = factory.createVarTable()
        sqls.varTables[vtn] = tblMain;
        sqls.sheets[sheetName] = sheet;
        tblMain.name = vtn;
        let tmSheetId = new Field();
        tmSheetId.name = 'sid';
        tmSheetId.dataType = new Int;
        tmSheetId.nullable = false;
        let tmArr = new Field();
        tmArr.name = 'arr';
        tmArr.dataType = new Char(50);
        tmArr.nullable = false;
        let tmId = new Field();
        tmId.name = 'id'
        tmId.dataType = new Int();
        tmId.autoInc = true;
        let tmText = new Field();
        tmText.name = 'text';
        tmText.dataType = new Text();
        tblMain.fields = [tmSheetId, tmArr, tmId, tmText];
        tblMain.keys = [tmSheetId, tmArr, tmId];

        let insert = factory.createInsert();
        sqls.push(insert);
        insert.table = new SqlVarTable(vtn);
        let fields:Field[];
        if (arrName === undefined) {
            fields = sheet.fields;
            let set = factory.createSet();
            sqls.push(set);
            set.equ(intoPointer.varName(into), new ExpFunc(factory.func_lastinsertid));
        }
        else {
            let arr = sheet.arrs.find(v => v.name === arrName);
            fields = arr.fields;
        }

        let {hasUnit, unitField} = this.context;
        let {global} = sheet;
        if (global === true) hasUnit = false;

        let vals:ExpVal[] = [];
        for (let field of fields) {
            let s = set.find(v => v.col === field.name);
            if (s === undefined) {
                vals.push(new ExpStr(''));
                continue;
            }
            vals.push(new ExpFunc(
                factory.func_ifnull, 
                convertExp(this.context, s.value) as ExpVal,
                new ExpStr('')
            ));
        }
        let textCol = {col: 'text', val: new ExpFunc(
            factory.func_concat_ws, 
            new ExpStr('\\t'), 
            ...vals
        )};

        insert.cols = [];
        if (arrName === undefined) {
            insert.cols.push({
                col: 'sid',
                val: ExpVal.num0
            }, {
                col: 'arr',
                val: new ExpStr('$')
            });
        }
        else {
            insert.cols.push({
                col: 'sid',
                val: new ExpVar(intoPointer.varName(into))
            }, {
                col: 'arr',
                val: new ExpStr(arrName)
            });
        }
        insert.cols.push(textCol);
    }
}
