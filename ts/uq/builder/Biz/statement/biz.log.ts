import { BizLog, LogArray, LogObject, LogScalar, LogType, LogValue } from "../../../il";
import { BStatement, Sqls } from "../../bstatement";
import { ExpAtVar, ExpDatePart, ExpFunc, ExpFuncCustom, ExpMul, ExpNum, ExpStr, ExpSub, ExpVal } from "../../sql";

export class BBizLog extends BStatement<BizLog> {
    override body(sqls: Sqls): void {
        const { factory } = this.context;
        let { val } = this.istatement;
        let setCurrentTime = factory.createSet();
        sqls.push(setCurrentTime);
        setCurrentTime.isAtVar = true;
        setCurrentTime.equ('logcurstamp', new ExpFuncCustom(factory.func_unix_timestamp, new ExpFunc('current_timestamp', ExpNum.num3)));
        let expStamp = new ExpFuncCustom(factory.func_cast,
            new ExpMul(
                new ExpNum(1000),
                new ExpSub(new ExpAtVar('logcurstamp'), new ExpAtVar('logstamp'))
            ),
            new ExpDatePart('signed')
        );
        let setLog = factory.createSet();
        sqls.push(setLog);
        setLog.isAtVar = true;
        let valJson = new ExpFunc(
            'JSON_OBJECT',
            new ExpStr('ms'), expStamp,
            new ExpStr('stamp'), new ExpAtVar('logcurstamp'),
            new ExpStr('log'),
            new ExpFunc(
                'JSON_EXTRACT',
                new ExpFunc('JSON_ARRAY', this.buildValue(val)),
                new ExpStr('$[0]'),
            )
        );
        let setStamp = factory.createSet();
        sqls.push(setStamp);
        setStamp.isAtVar = true;
        setStamp.equ('logstamp', new ExpAtVar('logcurstamp'));
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
        const { factory } = this.context;
        let params: ExpVal[] = [];
        for (let i in val) {
            params.push(new ExpStr(i), new ExpFunc(factory.func_ifnull, this.buildValue(val[i]), new ExpStr('null')));
        }
        return new ExpFunc('JSON_OBJECT', ...params);
    }
}
