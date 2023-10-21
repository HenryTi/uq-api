import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { EnumSysTable, BusStatement, BusAction, ValueExpression, FaceDataType } from "../../il";
import { ExpVar, ExpVal, ExpFunc, ExpStr, convertExp, SqlSysTable, ExpNum, ExpFuncCustom } from "../sql";
import { settingQueueSeed } from '../consts';

export class BBusStatement extends BStatement {
    protected istatement: BusStatement;
    body(sqls: Sqls) {
        let text: string;
        let memo = this.context.factory.createMemo();
        sqls.push(memo);
        let { action } = this.istatement;
        switch (action) {
            case BusAction.Stamp:
                this.buildStamp(sqls);
                break;
            case BusAction.Set:
                text = 'set';
                this.buildSet(sqls);
                break;
            case BusAction.Into:
                text = 'into';
                this.buildAdd(sqls);
                break;
            case BusAction.To:
                text = 'to';
                this.buildTo(sqls);
                break;
            case BusAction.Local:
                text = 'local';
                this.buildLocal(sqls);
                break;
            case BusAction.Query:
                text = 'query';
                this.buildQuery(sqls);
                break;
            case BusAction.Defer:
                text = 'defer';
                this.buildDefer(sqls);
                break;
        }
        memo.text = 'bus statement ' + text;
    }

    private fieldVals(fields: { name: string; type: FaceDataType, value: ValueExpression }[]): ExpVal[] {
        let { factory } = this.context;
        let ret: ExpVal[] = [];
        let expEmpty = new ExpStr('');
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
                        ret.push(new ExpStr('\\t'));
                    }
                    let exp: ExpVal;
                    if (value === undefined) {
                        exp = expEmpty;
                    }
                    else {
                        exp = convertExp(this.context, value) as ExpVal;
                        /*
                        // 现在date类型不要了，但是这个地方的逻辑肯定是错误的，应该是if else
                        if (type === 'date') {
                            exp = new ExpMul(new ExpFunc(factory.func_unix_timestamp, exp), new ExpNum(1000));
                        }
                        */
                        exp = new ExpFunc(factory.func_ifnull, exp, expEmpty);
                    }
                    ret.push(exp);
                    break;
            }
        }
        return ret;
    }

    private buildStamp(sqls: Sqls) {
        let { busName, faceName, stamp } = this.istatement;
        let { factory } = this.context;
        let vStamp = `$bus_${busName}_${faceName}_stamp`;
        let set = factory.createSet();
        sqls.push(set);
        set.equ(vStamp, convertExp(this.context, stamp) as ExpVal);
    }

    private buildDefer(sqls: Sqls) {
        let { busName, faceName, defer } = this.istatement;
        let { factory } = this.context;
        let vDefer = `$bus_${busName}_${faceName}_defer`;
        let set = factory.createSet();
        sqls.push(set);
        set.equ(vDefer, new ExpNum(defer));
    }

    private buildSet(sqls: Sqls) {
        let { busName, faceName, fields, toUser } = this.istatement;
        let { factory } = this.context;
        let vFace = '$bus_' + busName + '_' + faceName;
        let set = factory.createSet();
        sqls.push(set);
        set.equ(vFace, new ExpFunc(factory.func_concat,
            new ExpVar(vFace),
            new ExpStr('$\\t'),
            ...this.fieldVals(fields),
            new ExpStr('\\n')));
        if (toUser !== undefined) {
            let setToUser = factory.createSet();
            sqls.push(setToUser);
            setToUser.equ(vFace + '_to', convertExp(this.context, toUser) as ExpVal);
        }
    }

    private buildAdd(sqls: Sqls) {
        let { busName, faceName, arrName, fields } = this.istatement;
        let { factory } = this.context;
        let vFace = '$bus_' + busName + '_' + faceName;
        let set = factory.createSet();
        sqls.push(set);
        set.equ(vFace, new ExpFunc(factory.func_concat,
            new ExpVar(vFace),
            new ExpStr(arrName + '\\t'),
            ...this.fieldVals(fields),
            new ExpStr('\\n')));
    }

    private buildTo(sqls: Sqls) {
        let { busName, faceName, toUser/*, defer*/ } = this.istatement;
        let vFace = `$bus_${busName}_${faceName}`;
        let { factory, hasUnit } = this.context;
        sqls.push(...this.context.tableSeed(settingQueueSeed, settingQueueSeed));
        let insert = factory.createInsert();
        insert.table = new SqlSysTable(EnumSysTable.messageQueue);
        let cols = insert.cols = [
            { col: 'id', val: new ExpVar(settingQueueSeed) },
            { col: 'to', val: convertExp(this.context, toUser) as ExpVal },
            { col: 'action', val: new ExpStr('bus') },
            { col: 'subject', val: new ExpStr(busName + '/' + faceName) },
            { col: 'content', val: new ExpVar(vFace) },
            { col: 'stamp', val: new ExpVar(vFace + '_stamp') },
            { col: 'defer', val: new ExpVar('defer') },
        ];
        if (hasUnit === true) cols.unshift({ col: '$unit', val: new ExpVar('$unit') });
        sqls.push(insert);

        let insertDefer = factory.createInsert();
        sqls.push(insertDefer);
        insertDefer.ignore = true;
        insertDefer.table = new SqlSysTable('$queue_defer');
        insertDefer.cols = [
            { col: 'defer', val: new ExpVar('defer') },
            { col: 'id', val: new ExpVar(settingQueueSeed) },
        ];

        // 每一个bus to user语句，会产生insert message queue
        // 加上下面一句，整个存储过程结束的时候，insert message queue会跳过。
        let set = factory.createSet();
        sqls.push(set);
        set.equ(vFace, new ExpVar(vFace + '_init'));
    }

    private buildQuery(sqls: Sqls) {
        let { busName, faceName, fields } = this.istatement;
        let { factory, hasUnit } = this.context;
        sqls.push(...this.context.tableSeed(settingQueueSeed, settingQueueSeed));

        let content: ExpVal = new ExpFunc(factory.func_concat,
            //new ExpVar('$bus_' + busName + '_' + faceName), 
            //new ExpStr('$\\t'), 
            ...this.fieldVals(fields),
            new ExpStr('\\n'));
        let insert = factory.createInsert();
        insert.table = new SqlSysTable(EnumSysTable.messageQueue);
        let cols = insert.cols = [
            { col: 'id', val: new ExpVar(settingQueueSeed) },
            { col: 'action', val: new ExpStr('bus-query') },
            { col: 'content', val: content },
            { col: 'subject', val: new ExpStr(busName + '/' + faceName) },
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

    private buildLocal(sqls: Sqls) {
        // 不需要这段代码。直接在uq-api里面，发现local bus，直接写本地了
        // Bus Local 只是生成标志
    }
}
