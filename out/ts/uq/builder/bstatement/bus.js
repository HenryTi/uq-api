"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBusStatement = void 0;
const bstatement_1 = require("./bstatement");
const il_1 = require("../../il");
const sql_1 = require("../sql");
const consts_1 = require("../consts");
const dbContext_1 = require("../dbContext");
class BBusStatement extends bstatement_1.BStatement {
    body(sqls) {
        let text;
        let memo = this.context.factory.createMemo();
        sqls.push(memo);
        let { action } = this.istatement;
        switch (action) {
            case il_1.BusAction.Stamp:
                this.buildStamp(sqls);
                break;
            case il_1.BusAction.Set:
                text = 'set';
                this.buildSet(sqls);
                break;
            case il_1.BusAction.Into:
                text = 'into';
                this.buildAdd(sqls);
                break;
            case il_1.BusAction.To:
                text = 'to';
                this.buildTo(sqls);
                break;
            case il_1.BusAction.Local:
                text = 'local';
                this.buildLocal(sqls);
                break;
            case il_1.BusAction.Query:
                text = 'query';
                this.buildQuery(sqls);
                break;
            case il_1.BusAction.Defer:
                text = 'defer';
                this.buildDefer(sqls);
                break;
        }
        memo.text = 'bus statement ' + text;
    }
    fieldVals(fields) {
        let { factory } = this.context;
        let ret = [];
        let expEmpty = new sql_1.ExpStr('');
        let len = fields.length;
        let first = true;
        for (let i = 0; i < len; i++) {
            let { type, value } = fields[i];
            switch (type) {
                default: break;
                case 'id':
                case 'number':
                case 'string':
                    if (first === true) {
                        first = false;
                    }
                    else {
                        ret.push(new sql_1.ExpStr('\\t'));
                    }
                    let exp;
                    if (value === undefined) {
                        exp = expEmpty;
                    }
                    else {
                        exp = (0, sql_1.convertExp)(this.context, value);
                        /*
                        // 现在date类型不要了，但是这个地方的逻辑肯定是错误的，应该是if else
                        if (type === 'date') {
                            exp = new ExpMul(new ExpFunc(factory.func_unix_timestamp, exp), new ExpNum(1000));
                        }
                        */
                        exp = new sql_1.ExpFunc(factory.func_ifnull, exp, expEmpty);
                    }
                    ret.push(exp);
                    break;
            }
        }
        return ret;
    }
    buildStamp(sqls) {
        let { busName, faceName, stamp } = this.istatement;
        let { factory } = this.context;
        let vStamp = `$bus_${busName}_${faceName}_stamp`;
        let set = factory.createSet();
        sqls.push(set);
        set.equ(vStamp, (0, sql_1.convertExp)(this.context, stamp));
    }
    buildDefer(sqls) {
        let { busName, faceName, defer } = this.istatement;
        let { factory } = this.context;
        let vDefer = `$bus_${busName}_${faceName}_defer`;
        let set = factory.createSet();
        sqls.push(set);
        set.equ(vDefer, new sql_1.ExpNum(defer));
    }
    buildSet(sqls) {
        let { busName, faceName, fields, toUser } = this.istatement;
        let { factory } = this.context;
        let vFace = '$bus_' + busName + '_' + faceName;
        let set = factory.createSet();
        sqls.push(set);
        set.equ(vFace, new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpVar(vFace), new sql_1.ExpStr('$\\t'), ...this.fieldVals(fields), new sql_1.ExpStr('\\n')));
        if (toUser !== undefined) {
            let setToUser = factory.createSet();
            sqls.push(setToUser);
            setToUser.equ(vFace + '_to', (0, sql_1.convertExp)(this.context, toUser));
        }
    }
    buildAdd(sqls) {
        let { busName, faceName, arrName, fields } = this.istatement;
        let { factory } = this.context;
        let vFace = '$bus_' + busName + '_' + faceName;
        let set = factory.createSet();
        sqls.push(set);
        set.equ(vFace, new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpVar(vFace), new sql_1.ExpStr(arrName + '\\t'), ...this.fieldVals(fields), new sql_1.ExpStr('\\n')));
    }
    buildTo(sqls) {
        let { busName, faceName, toUser /*, defer*/ } = this.istatement;
        let vFace = `$bus_${busName}_${faceName}`;
        let { factory, hasUnit } = this.context;
        sqls.push(...this.context.tableSeed(consts_1.settingQueueSeed, consts_1.settingQueueSeed));
        let insert = factory.createInsert();
        insert.table = new sql_1.SqlSysTable(dbContext_1.EnumSysTable.messageQueue);
        let cols = insert.cols = [
            { col: 'id', val: new sql_1.ExpVar(consts_1.settingQueueSeed) },
            { col: 'to', val: (0, sql_1.convertExp)(this.context, toUser) },
            { col: 'action', val: new sql_1.ExpStr('bus') },
            { col: 'subject', val: new sql_1.ExpStr(busName + '/' + faceName) },
            { col: 'content', val: new sql_1.ExpVar(vFace) },
            { col: 'stamp', val: new sql_1.ExpVar(vFace + '_stamp') },
            { col: 'defer', val: new sql_1.ExpVar('defer') },
        ];
        if (hasUnit === true)
            cols.unshift({ col: '$unit', val: new sql_1.ExpVar('$unit') });
        sqls.push(insert);
        let insertDefer = factory.createInsert();
        sqls.push(insertDefer);
        insertDefer.ignore = true;
        insertDefer.table = new sql_1.SqlSysTable('$queue_defer');
        insertDefer.cols = [
            { col: 'defer', val: new sql_1.ExpVar('defer') },
            { col: 'id', val: new sql_1.ExpVar(consts_1.settingQueueSeed) },
        ];
        // 每一个bus to user语句，会产生insert message queue
        // 加上下面一句，整个存储过程结束的时候，insert message queue会跳过。
        let set = factory.createSet();
        sqls.push(set);
        set.equ(vFace, new sql_1.ExpVar(vFace + '_init'));
    }
    buildQuery(sqls) {
        let { busName, faceName, fields } = this.istatement;
        let { factory, hasUnit } = this.context;
        sqls.push(...this.context.tableSeed(consts_1.settingQueueSeed, consts_1.settingQueueSeed));
        let content = new sql_1.ExpFunc(factory.func_concat, 
        //new ExpVar('$bus_' + busName + '_' + faceName), 
        //new ExpStr('$\\t'), 
        ...this.fieldVals(fields), new sql_1.ExpStr('\\n'));
        let insert = factory.createInsert();
        insert.table = new sql_1.SqlSysTable(dbContext_1.EnumSysTable.messageQueue);
        let cols = insert.cols = [
            { col: 'id', val: new sql_1.ExpVar(consts_1.settingQueueSeed) },
            { col: 'action', val: new sql_1.ExpStr('bus-query') },
            { col: 'content', val: content },
            { col: 'subject', val: new sql_1.ExpStr(busName + '/' + faceName) },
            { col: 'defer', val: sql_1.ExpNum.num0 },
            { col: 'create_time', val: new sql_1.ExpFuncCustom(factory.func_utc_timestamp) },
            { col: 'update_time', val: new sql_1.ExpFuncCustom(factory.func_utc_timestamp) },
        ];
        if (hasUnit === true)
            cols.unshift({ col: '$unit', val: new sql_1.ExpVar('$unit') });
        sqls.push(insert);
        let insertDefer = factory.createInsert();
        sqls.push(insertDefer);
        insertDefer.ignore = true;
        insertDefer.table = new sql_1.SqlSysTable('$queue_defer');
        insertDefer.cols = [
            { col: 'defer', val: sql_1.ExpNum.num0 },
            { col: 'id', val: new sql_1.ExpVar(consts_1.settingQueueSeed) },
        ];
    }
    buildLocal(sqls) {
        // 不需要这段代码。直接在uq-api里面，发现local bus，直接写本地了
        // Bus Local 只是生成标志
    }
}
exports.BBusStatement = BBusStatement;
//# sourceMappingURL=bus.js.map