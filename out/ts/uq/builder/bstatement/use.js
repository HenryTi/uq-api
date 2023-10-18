"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUseTimeSpan = exports.BUseYearZone = exports.BUseMonthZone = exports.BUseTimeZone = exports.BUseSetting = exports.BUseBase = exports.BUseStatement = void 0;
const il_1 = require("../../il");
const sql_1 = require("../sql");
const bstatement_1 = require("./bstatement");
class BUseStatement extends bstatement_1.BStatement {
    constructor(context, stat) {
        super(context, stat);
        this.singleKey = '$use';
        const { useBase } = stat;
        this.bUse = useBase.db(context);
        this.bUse.setStatement(stat);
    }
    singleHead(sqls) {
        this.bUse.singleHead(sqls);
    }
    head(sqls) {
        this.bUse.head(sqls);
    }
    body(sqls) {
        this.bUse.body(sqls);
    }
}
exports.BUseStatement = BUseStatement;
class BUseBase {
    constructor(useObj, context) {
        this.useObj = useObj;
        this.context = context;
    }
    setStatement(statement) { this.statement = statement; }
    singleHead(sqls) { }
    head(sqls) { }
    body(sqls) { }
}
exports.BUseBase = BUseBase;
class BUseSetting extends BUseBase {
}
exports.BUseSetting = BUseSetting;
class BUseTimeZone extends BUseSetting {
    head(sqls) {
    }
}
exports.BUseTimeZone = BUseTimeZone;
class BUseMonthZone extends BUseSetting {
}
exports.BUseMonthZone = BUseMonthZone;
class BUseYearZone extends BUseSetting {
}
exports.BUseYearZone = BUseYearZone;
class BUseTimeSpan extends BUseBase {
    singleHead(sqls) {
        const { factory } = this.context;
        let declare = factory.createDeclare();
        sqls.push(declare);
        declare.var('$timezone', new il_1.BigInt());
        declare.var('$weekzone', new il_1.BigInt());
        declare.var('$monthzone', new il_1.BigInt());
        declare.var('$yearzone', new il_1.BigInt());
        let setTimeZone = factory.createSet();
        sqls.push(setTimeZone);
        setTimeZone.equ('$timezone', new sql_1.ExpNum(8));
        let setWeekZone = factory.createSet();
        sqls.push(setWeekZone);
        setWeekZone.equ('$weekzone', new sql_1.ExpNum(0));
        let setMonthZone = factory.createSet();
        sqls.push(setMonthZone);
        setMonthZone.equ('$monthzone', new sql_1.ExpNum(1));
        let setYearZone = factory.createSet();
        sqls.push(setYearZone);
        setYearZone.equ('$yearzone', new sql_1.ExpNum(1));
    }
    head(sqls) {
    }
    body(sqls) {
        const { factory } = this.context;
        const { varName } = this.useObj;
        const { no } = this.statement;
        let declare = factory.createDeclare();
        sqls.push(declare);
        declare.var(`${varName}_${no}$start`, new il_1.BigInt());
        declare.var(`${varName}_${no}$end`, new il_1.BigInt());
    }
}
exports.BUseTimeSpan = BUseTimeSpan;
//# sourceMappingURL=use.js.map