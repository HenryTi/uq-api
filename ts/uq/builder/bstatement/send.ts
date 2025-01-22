import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { EnumSysTable, SendMsgStatement, SendAppStatement, Text } from "../../il";
import {
    ExpVal, convertExp, ExpStr, ExpNum, SqlSysTable
    , ExpVar, ExpEQ, ExpFunc, ExpFuncCustom, Statement as SqlStatement
} from "../sql";
import { settingQueueSeed } from "../consts";

// send email or sms
export class BSendMsgStatement extends BStatement<SendMsgStatement> {
    override body(sqls: Sqls) {
        let { factory, hasUnit } = this.context;
        let { templet, isUser, method, to, cc, bcc, with: withSend, importing } = this.istatement;
        let parts: ExpVal[] = [];
        function pushVal(col: string, val: ExpVal) {
            parts.push(new ExpStr(col + '\\n'),
                val,
                new ExpStr('\\n\\t\\n')
            );
        }
        function pushNullableVal(col: string, val: ExpVal) {
            parts.push(new ExpStr(col + '\\n'),
                new ExpFunc(factory.func_ifnull, val, new ExpStr('null')),
                new ExpStr('\\n\\t\\n')
            );
        }
        pushVal('$isUser', new ExpNum(isUser === true ? 1 : 0));
        pushVal('$templet', new ExpStr(templet));
        pushNullableVal('$to', convertExp(this.context, to) as ExpVal);
        if (cc !== undefined) {
            pushNullableVal('$cc', convertExp(this.context, cc) as ExpVal);
        }
        if (bcc !== undefined) {
            pushNullableVal('$bcc', convertExp(this.context, bcc) as ExpVal);
        }
        if (withSend !== undefined) {
            for (let i in withSend) {
                pushNullableVal(i, convertExp(this.context, withSend[i]) as ExpVal);
            }
        }

        let statements: SqlStatement[] = []
        statements.push(...this.context.tableSeed(settingQueueSeed, settingQueueSeed));

        let content: ExpVal = new ExpFunc(factory.func_concat, ...parts);
        let insert = factory.createInsert();
        insert.table = new SqlSysTable(EnumSysTable.messageQueue);
        let cols = insert.cols = [
            { col: 'id', val: new ExpVar(settingQueueSeed) },
            { col: 'action', val: new ExpStr(method) },
            { col: 'content', val: content },
            { col: 'defer', val: ExpNum.num1 },
            { col: 'create_time', val: new ExpFuncCustom(factory.func_utc_timestamp) },
            { col: 'update_time', val: new ExpFuncCustom(factory.func_utc_timestamp) },
        ];
        if (hasUnit === true) cols.unshift({ col: '$unit', val: new ExpVar('$unit') });
        statements.push(insert);

        let insertDefer = factory.createInsert();
        statements.push(insertDefer);
        insertDefer.ignore = true;
        insertDefer.table = new SqlSysTable('$queue_defer');
        insertDefer.cols = [
            { col: 'defer', val: ExpNum.num1 },
            { col: 'id', val: new ExpVar(settingQueueSeed) },
        ];

        if (!importing) {
            sqls.push(...statements);
        }
        else {
            let ifImporting = factory.createIf();
            sqls.push(ifImporting);
            ifImporting.cmp = new ExpEQ(convertExp(this.context, importing) as ExpVal, ExpNum.num0);
            ifImporting.then(...statements);
        }
    }
}

const vSendApp = '$send_app';
export class BSendAppStatement extends BStatement<SendAppStatement> {
    singleKey = vSendApp;
    singleHead(sqls: Sqls): void {
        let { factory } = this.context;
        let declare = factory.createDeclare();
        sqls.push(declare);
        declare.var(vSendApp, new Text());
        let set = factory.createSet();
        sqls.push(set);
        set.equ(vSendApp, new ExpFunc(factory.func_concat, new ExpVar('$user'), new ExpStr('\\n')));
    }
    singleFoot(sqls: Sqls): void {
        let { factory, hasUnit } = this.context;
        let insert = factory.createInsert();
        insert.table = new SqlSysTable(EnumSysTable.messageQueue);
        let cols = insert.cols = [
            { col: 'id', val: new ExpVar(settingQueueSeed) },
            { col: 'action', val: new ExpStr('app') },
            { col: 'content', val: new ExpVar(vSendApp) },
            { col: 'defer', val: ExpNum.num0 },
            { col: 'create_time', val: new ExpFuncCustom(factory.func_utc_timestamp) },
            { col: 'update_time', val: new ExpFuncCustom(factory.func_utc_timestamp) },
        ];
        if (hasUnit === true) cols.unshift({ col: '$unit', val: new ExpVar('$unit') });
        sqls.push(insert);

        let insertDefer = factory.createInsert();
        sqls.push(insertDefer);
        insertDefer.ignore = true;
        insertDefer.table = new SqlSysTable('$queue_defer');
        insertDefer.cols = [
            { col: 'defer', val: ExpNum.num0 },
            { col: 'id', val: new ExpVar(settingQueueSeed) },
        ];
    }
    override body(sqls: Sqls) {
        let { factory } = this.context;
        let { user, app, action } = this.istatement;
        let set = factory.createSet();
        sqls.push(set);
        let tAction: string;
        switch (action) {
            case 'add': tAction = '+'; break;
            case 'remove': tAction = '-'; break;
        }

        set.equ(vSendApp, new ExpFunc(factory.func_concat,
            new ExpVar(vSendApp),
            convertExp(this.context, app) as ExpVal,
            new ExpStr(tAction),
            convertExp(this.context, user) as ExpVal,
            new ExpStr('\\n')
        ));
    }
}
