"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizLog = void 0;
const il_1 = require("../../../il");
const bstatement_1 = require("../../bstatement");
const sql_1 = require("../../sql");
class BBizLog extends bstatement_1.BStatement {
    body(sqls) {
        const { factory } = this.context;
        let { val } = this.istatement;
        let setCurrentTime = factory.createSet();
        sqls.push(setCurrentTime);
        setCurrentTime.isAtVar = true;
        setCurrentTime.equ('logcurstamp', new sql_1.ExpFuncCustom(factory.func_unix_timestamp, new sql_1.ExpFunc('current_timestamp', sql_1.ExpNum.num3)));
        let expStamp = new sql_1.ExpFuncCustom(factory.func_cast, new sql_1.ExpMul(new sql_1.ExpNum(1000), new sql_1.ExpSub(new sql_1.ExpAtVar('logcurstamp'), new sql_1.ExpAtVar('logstamp'))), new sql_1.ExpDatePart('signed'));
        let setLog = factory.createSet();
        sqls.push(setLog);
        setLog.isAtVar = true;
        let valJson = new sql_1.ExpFunc('JSON_OBJECT', new sql_1.ExpStr('ms'), expStamp, new sql_1.ExpStr('stamp'), new sql_1.ExpAtVar('logcurstamp'), new sql_1.ExpStr('log'), new sql_1.ExpFunc('JSON_EXTRACT', new sql_1.ExpFunc('JSON_ARRAY', this.buildValue(val)), new sql_1.ExpStr('$[0]')));
        let setStamp = factory.createSet();
        sqls.push(setStamp);
        setStamp.isAtVar = true;
        setStamp.equ('logstamp', new sql_1.ExpAtVar('logcurstamp'));
        setLog.equ('loginact', new sql_1.ExpFunc('JSON_ARRAY_APPEND', new sql_1.ExpAtVar('loginact'), new sql_1.ExpStr('$'), valJson));
    }
    buildValue({ type, value }) {
        switch (type) {
            case il_1.LogType.scalar: return this.buildScalar(value);
            case il_1.LogType.array: return this.buildArray(value);
            case il_1.LogType.object: return this.buildObject(value);
        }
    }
    buildScalar(val) {
        return this.context.expVal(val);
    }
    buildArray(val) {
        return new sql_1.ExpFunc('JSON_ARRAY', ...val.map(v => this.buildValue(v)));
    }
    buildObject(val) {
        const { factory } = this.context;
        let params = [];
        for (let i in val) {
            params.push(new sql_1.ExpStr(i), new sql_1.ExpFunc(factory.func_ifnull, this.buildValue(val[i]), new sql_1.ExpStr('null')));
        }
        return new sql_1.ExpFunc('JSON_OBJECT', ...params);
    }
}
exports.BBizLog = BBizLog;
//# sourceMappingURL=biz.log.js.map