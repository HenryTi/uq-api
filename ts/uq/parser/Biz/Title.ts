import { BizBudValue, BizTitle } from "../../il";
// import { Token } from "../tokens";
import { PBizEntity } from "./Base";

export class PBizTitle extends PBizEntity<BizTitle> {
    private parseTitleProp = () => {
        this.parseProp();
    }

    readonly keyColl = {
        prop: this.parseTitleProp,
    };
}
