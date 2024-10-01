import { Space } from '../space';
import { EnumTransaction, TransactionStatement } from '../../il';
import { PStatement } from './statement';
import { PContext } from '../pContext';

export class PTransactionStatement extends PStatement {
    private stat: TransactionStatement;
    constructor(stat: TransactionStatement, context: PContext) {
        super(stat, context);
        this.stat = stat;
    }

    protected _parse() {
        const keys = ['start', 'commit', 'off'];
        if (this.ts.varBrace === true) {
            this.ts.expect(...keys);
        }
        switch (this.ts.lowerVar) {
            default: this.ts.expect(...keys); break;
            case 'off': this.stat.act = EnumTransaction.off; break;
            case 'start': this.stat.act = EnumTransaction.start; break;
            case 'commit': this.stat.act = EnumTransaction.commit; break;
        }
        this.ts.readToken();
    }

    scan(space: Space): boolean {
        let ok = true;
        switch (this.stat.act) {
            case EnumTransaction.off:
                space.setTransactionOff(true);
                break;
            case EnumTransaction.start:
                space.setTransactionOff(false);
                break;
        }
        return ok;
    }
}
