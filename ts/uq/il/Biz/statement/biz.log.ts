import { BBizLog, DbContext } from "../../../builder";
import { PBizLog, PContext, PElement } from "../../../parser";
import { ValueExpression } from "../../Exp";
import { Statement } from "../../statement";

export enum LogType { scalar, array, object };
export type LogScalar = ValueExpression;
export type LogArray = LogValue[];
export type LogObject = { [name: string]: LogValue };
export interface LogValue {
    type: LogType;
    value: LogScalar | LogArray | LogObject;
}

export class BizLog extends Statement {
    // val: ValueExpression;
    val: LogValue;

    db(db: DbContext): object {
        return new BBizLog(db, this);
    }
    parser(context: PContext): PElement {
        return new PBizLog(this, context);
    }
}
