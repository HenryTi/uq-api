"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BSheetWrite = void 0;
const bstatement_1 = require("./bstatement");
const il_1 = require("../../il");
const sql_1 = require("../sql");
const stateTo_1 = require("./stateTo");
class BSheetWrite extends bstatement_1.BStatement {
    head(sqls) {
    }
    body(sqls) {
        let context = this.context;
        let factory = context.factory;
        let { no, sheet, into, intoPointer, arrName, set, idExp } = this.istatement;
        let { name: sheetName, arrs } = sheet;
        if (idExp) {
            let idVal = (0, sql_1.convertExp)(context, idExp);
            let buildSheetStateTo = new stateTo_1.BuildSheetStateTo(sqls, this.context, no, idVal, this.istatement.sheetState);
            buildSheetStateTo.build();
            return;
        }
        let memo = factory.createMemo();
        sqls.push(memo);
        memo.text = 'SHEET create ' + sheetName;
        let vtn = '$sheet';
        let tblMain = factory.createVarTable();
        sqls.varTables[vtn] = tblMain;
        sqls.sheets[sheetName] = sheet;
        tblMain.name = vtn;
        let tmSheetId = new il_1.Field();
        tmSheetId.name = 'sid';
        tmSheetId.dataType = new il_1.Int;
        tmSheetId.nullable = false;
        let tmArr = new il_1.Field();
        tmArr.name = 'arr';
        tmArr.dataType = new il_1.Char(50);
        tmArr.nullable = false;
        let tmId = new il_1.Field();
        tmId.name = 'id';
        tmId.dataType = new il_1.Int();
        tmId.autoInc = true;
        let tmText = new il_1.Field();
        tmText.name = 'text';
        tmText.dataType = new il_1.Text();
        tblMain.fields = [tmSheetId, tmArr, tmId, tmText];
        tblMain.keys = [tmSheetId, tmArr, tmId];
        let insert = factory.createInsert();
        sqls.push(insert);
        insert.table = new sql_1.SqlVarTable(vtn);
        let fields;
        if (arrName === undefined) {
            fields = sheet.fields;
            let set = factory.createSet();
            sqls.push(set);
            set.equ(intoPointer.varName(into), new sql_1.ExpFunc(factory.func_lastinsertid));
        }
        else {
            let arr = sheet.arrs.find(v => v.name === arrName);
            fields = arr.fields;
        }
        let { hasUnit, unitField } = this.context;
        let { global } = sheet;
        if (global === true)
            hasUnit = false;
        let vals = [];
        for (let field of fields) {
            let s = set.find(v => v.col === field.name);
            if (s === undefined) {
                vals.push(new sql_1.ExpStr(''));
                continue;
            }
            vals.push(new sql_1.ExpFunc(factory.func_ifnull, (0, sql_1.convertExp)(this.context, s.value), new sql_1.ExpStr('')));
        }
        let textCol = { col: 'text', val: new sql_1.ExpFunc(factory.func_concat_ws, new sql_1.ExpStr('\\t'), ...vals) };
        insert.cols = [];
        if (arrName === undefined) {
            insert.cols.push({
                col: 'sid',
                val: sql_1.ExpVal.num0
            }, {
                col: 'arr',
                val: new sql_1.ExpStr('$')
            });
        }
        else {
            insert.cols.push({
                col: 'sid',
                val: new sql_1.ExpVar(intoPointer.varName(into))
            }, {
                col: 'arr',
                val: new sql_1.ExpStr(arrName)
            });
        }
        insert.cols.push(textCol);
    }
}
exports.BSheetWrite = BSheetWrite;
//# sourceMappingURL=sheetWrite.js.map