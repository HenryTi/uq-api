import { BizLog, LogArray, LogObject, LogScalar, LogType, LogValue } from "../../../il";
import { BStatement, Sqls } from "../../bstatement";
import { ExpAtVar, ExpFunc, ExpStr, ExpVal } from "../../sql";

export class BBizLog extends BStatement<BizLog> {
    override body(sqls: Sqls): void {
        const { factory, userParam } = this.context;
        let { no, val } = this.istatement;
        /*
        let declare = factory.createDeclare();
        sqls.push(declare);
        let logId = 'logid_' + no;
        declare.vars(bigIntField(logId));
        let setId = factory.createSet();
        sqls.push(setId);
        const varSite = new ExpVar('$site');
        setId.equ(logId, new ExpFuncInUq('log$id', [varSite, new ExpVar(userParam.name), ExpNum.num1, ExpNull.null, varSite], true));

        const update = factory.createUpdate();
        sqls.push(update);
        update.table = new EntityTable(EnumSysTable.log, false);
        let valJson = new ExpFunc(
            'JSON_EXTRACT',
            new ExpFunc('JSON_ARRAY', this.buildValue(val)),
            new ExpStr('$[0]'),
        );
        update.cols.push(
            { col: 'value', val: valJson },
        );
        update.where = new ExpEQ(new ExpField('id'), new ExpVar(logId));
        */
        let setLog = factory.createSet();
        sqls.push(setLog);
        setLog.isAtVar = true;
        let valJson = new ExpFunc(
            'JSON_EXTRACT',
            new ExpFunc('JSON_ARRAY', this.buildValue(val)),
            new ExpStr('$[0]'),
        );
        setLog.equ('loginact', new ExpFunc('JSON_ARRAY_APPEND', new ExpAtVar('loginact'), new ExpStr('$'), valJson));
    }

    private buildValue({ type, value }: LogValue): ExpVal {
        switch (type) {
            case LogType.scalar: return this.buildScalar(value as LogScalar);
            case LogType.array: return this.buildArray(value as LogArray);
            case LogType.object: return this.buildObject(value as LogObject);
        }
    }

    private buildScalar(val: LogScalar): ExpVal {
        return this.context.expVal(val);
    }

    private buildArray(val: LogArray): ExpVal {
        return new ExpFunc('JSON_ARRAY', ...val.map(v => this.buildValue(v)));
    }

    private buildObject(val: LogObject): ExpVal {
        let params: ExpVal[] = [];
        for (let i in val) {
            params.push(new ExpStr(i), this.buildValue(val[i]));
        }
        return new ExpFunc('JSON_OBJECT', ...params);
    }
}
