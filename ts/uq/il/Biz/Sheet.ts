import { BBizSheet, DbContext } from "../../builder";
import { PBinState, PBinStateAct, PBizSheet, PContext, PElement, PSheetState } from "../../parser";
import { IElement } from "../IElement";
import { UI } from "../UI";
import { BizAct, BizSearch } from "./Base";
import { BizBin, BizBinBase, BizBinBaseAct } from "./Bin";
import { BizPhraseType, BudDataType } from "./BizPhraseType";
import { BizBud } from "./Bud";
import { BizEntity, BizNotID } from "./Entity";
import { UseOut } from "./InOut";
import { BizPrint } from "./Print";

interface Print {
    main: BizPrint;
    details: DetailPrint[];
}

interface DetailPrint {
    detail: BizBin;
    print: BizPrint;
}

export enum EnumDetailOperate {
    default = 0,            // 默认方式
    pend = 1,               // 先上pend，再逐行修改
    direct = 2,             // 直接加入明细，可以不再修改
    scan = 3,               // 扫描逐行操作。暂时不支持。需要前台代码处理
}
export interface Detail {
    caption: string;
    bin: BizBin;
    operate: EnumDetailOperate;
}

export class BizSheet extends BizNotID {
    static ownFields = ['id', 'no', 'operator'];
    protected readonly fields = BizSheet.ownFields; // ['id', 'no'];
    readonly bizPhraseType = BizPhraseType.sheet;
    readonly outs: { [name: string]: UseOut; } = {};
    main: BizBin;
    readonly details: Detail[] = [];
    states: SheetState[];
    io: boolean;
    bizSearch: BizSearch;
    print: Print;
    prints: Print[];

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
        let states: any[];
        if (this.states !== undefined) {
            states = this.states.map(v => v.buildSchema(res));
        }
        ret = {
            ...ret,
            io: this.io,
            main: this.main.id,
            details: this.details.map(v => {
                const { bin, caption, operate } = v;
                return {
                    bin: bin.id,
                    caption,                // 此处暂时不做res翻译
                    operate,
                }
            }),
            search,
            states,
        };
        return ret;
    }

    db(dbContext: DbContext): BBizSheet {
        return new BBizSheet(dbContext, this);
    }

    checkUserProp(prop: string) {

    }

    override buildPhrases(phrases: [string, string, string, string][], prefix: string) {
        super.buildPhrases(phrases, prefix);
        if (this.states !== undefined) {
            for (let state of this.states) {
                state.buildPhrases(phrases, this.name);
            }
        }
    }

    forEachState(callback: (state: SheetState) => void) {
        if (this.states === undefined) return;
        for (let state of this.states) {
            callback(state);
        }
    }
}

export class SheetState extends BizNotID {
    readonly bizPhraseType = BizPhraseType.sheetState;
    readonly sheet: BizSheet;
    main: BinState;
    readonly details: BinState[] = [];

    constructor(sheet: BizSheet) {
        super(sheet.biz);
        this.sheet = sheet;
    }

    parser(context: PContext): PElement {
        return new PSheetState(this, context);
    }

    protected buildPhrase(prefix: string) {
        this.phrase = `${prefix}.${this.name}`;
    }

    buildPhrases(phrases: [string, string, string, string][], prefix: string): void {
        this.buildPhrase(prefix);
        let phrase = this.phrase;
        this.forEachBud(bud => {
            bud.buildPhrases(phrases, phrase)
        });
        phrases.push([this.phrase, this.ui.caption ?? '', this.extendsPhrase, this.typeNum]);
    }
}

export class BinState extends BizBinBase {
    readonly bizPhraseType = BizPhraseType.binState;
    protected readonly fields = ['id'];
    readonly sheetState: SheetState;
    readonly main = undefined;
    bin: BizBin;    // 对应的bin

    constructor(sheetState: SheetState) {
        super(sheetState.biz);
        this.sheetState = sheetState;
    }

    parser(context: PContext): PElement {
        return new PBinState(this, context);
    }
}

export class BinStateAct extends BizBinBaseAct<BinState> {
    readonly binState: BinState;
    constructor(binState: BinState) {
        super(binState.biz, binState);
        this.binState = binState;
    }

    parser(context: PContext): PElement {
        return new PBinStateAct(this, context);
    }
}
