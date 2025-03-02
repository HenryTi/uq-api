import {
    BinStateAct, BizStatementState
} from '../../../il';
import { Space } from '../../space';
import { PBizStatementSub } from './biz.statement.sub';

export class PBizStatementState extends PBizStatementSub<BinStateAct, BizStatementState> {
    private to: string;
    protected _parse(): void {
        let key = this.ts.passKey();
        switch (key) {
            case 'end':
                break;
            case 'discard':
                this.to = '$' + key;
                break;
            case 'to':
                this.to = this.ts.passVar();
                break;
            default:
                this.ts.expect('to', 'end', 'discard');
                break;
        }
    }

    override scan(space: Space): boolean {
        let ok = true;
        if (this.to !== undefined) {
            const { bizStatement } = this.element;
            const { bizAct } = bizStatement;
            const { sheet } = bizAct.binState.sheetState;
            let state = sheet.states.find(v => v.name === this.to);
            if (state === undefined) {
                ok = false;
                this.log(`SHEET ${sheet.getJName()} has not STATE ${this.to}`);
            }
            else {
                this.element.to = state;
            }
        }
        return ok;
    }
}
