"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BSendAppStatement = exports.BSendMsgStatement = void 0;
const bstatement_1 = require("./bstatement");
const il_1 = require("../../il");
const sql_1 = require("../sql");
const consts_1 = require("../consts");
const dbContext_1 = require("../dbContext");
// send email or sms
class BSendMsgStatement extends bstatement_1.BStatement {
    body(sqls) {
        let { factory, hasUnit } = this.context;
        let { templet, isUser, method, to, cc, bcc, with: withSend, importing } = this.istatement;
        let parts = [];
        function pushVal(col, val) {
            parts.push(new sql_1.ExpStr(col + '\\n'), val, new sql_1.ExpStr('\\n\\t\\n'));
        }
        function pushNullableVal(col, val) {
            parts.push(new sql_1.ExpStr(col + '\\n'), new sql_1.ExpFunc(factory.func_ifnull, val, new sql_1.ExpStr('null')), new sql_1.ExpStr('\\n\\t\\n'));
        }
        pushVal('$isUser', new sql_1.ExpNum(isUser === true ? 1 : 0));
        pushVal('$templet', new sql_1.ExpStr(templet));
        pushNullableVal('$to', (0, sql_1.convertExp)(this.context, to));
        if (cc !== undefined) {
            pushNullableVal('$cc', (0, sql_1.convertExp)(this.context, cc));
        }
        if (bcc !== undefined) {
            pushNullableVal('$bcc', (0, sql_1.convertExp)(this.context, bcc));
        }
        if (withSend !== undefined) {
            for (let i in withSend) {
                pushNullableVal(i, (0, sql_1.convertExp)(this.context, withSend[i]));
            }
        }
        let statements = [];
        statements.push(...this.context.tableSeed(consts_1.settingQueueSeed, consts_1.settingQueueSeed));
        let content = new sql_1.ExpFunc(factory.func_concat, ...parts);
        let insert = factory.createInsert();
        insert.table = new sql_1.SqlSysTable(dbContext_1.EnumSysTable.messageQueue);
        let cols = insert.cols = [
            { col: 'id', val: new sql_1.ExpVar(consts_1.settingQueueSeed) },
            { col: 'action', val: new sql_1.ExpStr(method) },
            { col: 'content', val: content },
            { col: 'defer', val: sql_1.ExpNum.num1 },
            { col: 'create_time', val: new sql_1.ExpFuncCustom(factory.func_utc_timestamp) },
            { col: 'update_time', val: new sql_1.ExpFuncCustom(factory.func_utc_timestamp) },
        ];
        if (hasUnit === true)
            cols.unshift({ col: '$unit', val: new sql_1.ExpVar('$unit') });
        statements.push(insert);
        let insertDefer = factory.createInsert();
        statements.push(insertDefer);
        insertDefer.ignore = true;
        insertDefer.table = new sql_1.SqlSysTable('$queue_defer');
        insertDefer.cols = [
            { col: 'defer', val: sql_1.ExpNum.num1 },
            { col: 'id', val: new sql_1.ExpVar(consts_1.settingQueueSeed) },
        ];
        if (!importing) {
            sqls.push(...statements);
        }
        else {
            let ifImporting = factory.createIf();
            sqls.push(ifImporting);
            ifImporting.cmp = new sql_1.ExpEQ((0, sql_1.convertExp)(this.context, importing), sql_1.ExpNum.num0);
            ifImporting.then(...statements);
        }
    }
}
exports.BSendMsgStatement = BSendMsgStatement;
const vSendApp = '$send_app';
class BSendAppStatement extends bstatement_1.BStatement {
    constructor() {
        super(...arguments);
        this.singleKey = vSendApp;
    }
    singleHead(sqls) {
        let { factory } = this.context;
        let declare = factory.createDeclare();
        sqls.push(declare);
        declare.var(vSendApp, new il_1.Text());
        let set = factory.createSet();
        sqls.push(set);
        set.equ(vSendApp, new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpVar('$user'), new sql_1.ExpStr('\\n')));
    }
    singleFoot(sqls) {
        let { factory, hasUnit } = this.context;
        let insert = factory.createInsert();
        insert.table = new sql_1.SqlSysTable(dbContext_1.EnumSysTable.messageQueue);
        let cols = insert.cols = [
            { col: 'id', val: new sql_1.ExpVar(consts_1.settingQueueSeed) },
            { col: 'action', val: new sql_1.ExpStr('app') },
            { col: 'content', val: new sql_1.ExpVar(vSendApp) },
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
    body(sqls) {
        let { factory } = this.context;
        let { user, app, action } = this.istatement;
        let set = factory.createSet();
        sqls.push(set);
        let tAction;
        switch (action) {
            case 'add':
                tAction = '+';
                break;
            case 'remove':
                tAction = '-';
                break;
        }
        set.equ(vSendApp, new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpVar(vSendApp), (0, sql_1.convertExp)(this.context, app), new sql_1.ExpStr(tAction), (0, sql_1.convertExp)(this.context, user), new sql_1.ExpStr('\\n')));
    }
}
exports.BSendAppStatement = BSendAppStatement;
//# sourceMappingURL=send.js.map