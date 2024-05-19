import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { SleepStatement } from "../../il";
import { convertExp, ExpNum, ExpVal } from "../sql";

export class BSleepStatement extends BStatement<SleepStatement> {
    body(sqls: Sqls) {
        let { value } = this.istatement;
        let { factory } = this.context;
        let sleep = factory.createSleep();
        sqls.push(sleep);
        let val: ExpVal;
        if (value) {
            val = convertExp(this.context, value) as ExpVal;
        }
        else {
            val = ExpNum.num0;
        }
        sleep.value = val;
    }
}
