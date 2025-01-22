import { BizAct, BizStatement, BizStatementError } from "../../../il";
import { ExpAtVar, ExpFunc, ExpStr, ExpVar } from "../../sql";
import { BStatement } from "../../bstatement/bstatement";
import { Sqls } from "../../bstatement/sqls";

export class BBizStatement extends BStatement<BizStatement<BizAct>> {
    override head(sqls: Sqls) {
        let bSub = this.istatement.sub.db(this.context);
        bSub.head(sqls);
    }
    override body(sqls: Sqls) {
        let bSub = this.istatement.sub.db(this.context);
        bSub.body(sqls);
    }
    override foot(sqls: Sqls): void {
        let bSub = this.istatement.sub.db(this.context);
        bSub.foot(sqls);
    }
}


export class BBizStatementError extends BStatement<BizStatementError> {
    override body(sqls: Sqls): void {
        const { factory } = this.context;
        let memo = factory.createMemo();
        sqls.push(memo);
        let setError = factory.createSet();
        sqls.push(setError);
        setError.isAtVar = true;
        const { pendOver, message } = this.istatement;
        let msg: string;
        if (pendOver !== undefined) {
            msg = 'PEND';
            setError.equ('checkPend', new ExpFunc(
                'JSON_ARRAY_APPEND',
                new ExpAtVar('checkPend'),
                new ExpStr('$'),
                new ExpFunc('JSON_OBJECT'
                    , new ExpStr('pend'), new ExpVar('$pend')
                    , new ExpStr('overValue'), this.context.expVal(pendOver)
                )
            ));
        }
        else {
            msg = 'BIN';
            setError.equ('checkBin', new ExpFunc(
                'JSON_ARRAY_APPEND',
                new ExpAtVar('checkBin'),
                new ExpStr('$'),
                new ExpFunc('JSON_OBJECT'
                    , new ExpStr('bin'), new ExpVar('$bin')
                    , new ExpStr('message'), this.context.expVal(message)
                )
            ));
        }
        memo.text = 'ERROR ' + msg;
    }
}
