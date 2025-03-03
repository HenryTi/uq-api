import {
    BinStateAct, BizStatementState,
    EnumStateTo
} from '../../../il';
import { Space } from '../../space';
import { PBizStatementSub } from './biz.statement.sub';

export class PBizStatementState extends PBizStatementSub<BinStateAct, BizStatementState> {
    private to: string;
    protected _parse(): void {
        let key = this.ts.passKey();
        switch (key) {
            case 'end':
                this.element.to = EnumStateTo.end;
                break;
            case 'start':
                this.element.to = EnumStateTo.start;
                break;
            case 'back':
                this.element.to = EnumStateTo.back;
                break;
            case 'discard':
                this.to = '$' + key;
                break;
            case 'to':
                this.to = this.ts.passVar();
                break;
            default:
                this.ts.expect('to', 'end', 'discard', 'start', 'back');
                break;
        }
    }

    override scan(space: Space): boolean {
        let ok = true;
        if (this.to !== undefined) {
            const { bizStatement } = this.element;
            const { bizAct } = bizStatement;
            const { sheet } = bizAct.binState.sheetState;
            if (this.element.to === undefined) {
                let state = sheet.states.find(v => v.name === this.to);
                if (state === undefined) {
                    ok = false;
                    this.log(`SHEET ${sheet.getJName()} has not STATE ${this.to}`);
                }
                else {
                    this.element.to = state;
                }
            }
        }
        return ok;
    }
}
