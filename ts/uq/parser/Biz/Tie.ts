import { BizBudValue, BizBudInt, BizTie, UI } from "../../il";
import { PBizEntity } from "./Base";

export class PBizTie extends PBizEntity<BizTie> {
    readonly keyColl = {
        prop: this.parseProp,
    };

    // bud 有没有type。Tie里面的bud，不需要type，都是bigint
    protected override parseBud(name: string, ui: UI): BizBudValue {
        return new BizBudInt(this.element.biz, name, ui);
    }
}
