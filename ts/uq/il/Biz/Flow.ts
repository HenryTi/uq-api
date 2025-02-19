import { PContext, PElement, PFlow } from "../../parser";
import { BizPhraseType } from "./BizPhraseType";
import { BizEntity } from "./Entity";
import { BizSheet } from "./Sheet";

export class Flow extends BizEntity {
    readonly bizPhraseType = BizPhraseType.flow;
    protected readonly fields = [];
    readonly isIDScan = false;
    readonly sheets: BizSheet[] = [];
    parser(context: PContext): PElement {
        return new PFlow(this, context);
    }

    override buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        ret.sheets = this.sheets.map(v => v.id);
        this.schema = ret;
        return ret;
    }
}
