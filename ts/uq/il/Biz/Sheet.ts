import { BBizSheet, DbContext } from "../../builder";
import { PBizSheet, PContext, PElement } from "../../parser";
import { IElement } from "../IElement";
import { BizSearch } from "./Base";
import { BizBin } from "./Bin";
import { BizPhraseType } from "./BizPhraseType";
import { BizNotID } from "./Entity";
import { UseOut } from "./InOut";

export class BizSheet extends BizNotID {
    protected readonly fields = ['id', 'no'];
    readonly bizPhraseType = BizPhraseType.sheet;
    readonly outs: { [name: string]: UseOut; } = {};
    main: BizBin;
    readonly details: { bin: BizBin; caption: string; }[] = [];
    io: boolean;
    bizSearch: BizSearch;

    parser(context: PContext): PElement<IElement> {
        return new PBizSheet(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        if (this.main === undefined) debugger;
        let search: any;
        if (this.bizSearch !== undefined) {
            search = {};
            for (let { entity, buds } of this.bizSearch.params) {
                const { id } = entity;
                for (let bud of buds) {
                    if (bud === undefined) debugger;
                    search[id] = bud.id;
                }
            }
        }
        ret = {
            ...ret,
            io: this.io,
            main: this.main.name,
            details: this.details.map(v => {
                const { bin, caption } = v;
                return {
                    bin: bin.name,
                    caption,                // 此处暂时不做res翻译
                }
            }),
            search,
        };
        return ret;
    }

    db(dbContext: DbContext): BBizSheet {
        return new BBizSheet(dbContext, this);
    }

    checkUserProp(prop: string) {

    }
}
