import { PBizOptions, PContext, PElement } from "../../parser";
import { IElement } from "../element";
import { BizPhraseType, BudDataType } from "./Base";
import { BizBud } from "./Bud";
import { BizEntity } from "./Entity";

export enum OptionsItemValueType {
    none = 0,
    int = 1,
    dec = 2,
    str = 3,
}
export class OptionsItem extends BizBud {
    id: number;
    name: string;
    caption: string;
    // value: string | number;
    itemValue: string | number;
    _itemType: OptionsItemValueType;
    get optionsItemType(): OptionsItemValueType { return this._itemType; }

    parser(context: PContext): PElement<IElement> {
        debugger;
        return;
    }
    get dataType(): BudDataType {
        debugger;
        return;
    }
    get canIndex(): boolean {
        return false;
    }
}

export class BizOptions extends BizEntity {
    readonly bizPhraseType = BizPhraseType.options;
    readonly items: OptionsItem[] = [];
    parser(context: PContext): PElement<IElement> {
        return new PBizOptions(this, context);
    }
    buildPhrases(phrases: [string, string, string, string][], prefix: string) {
        super.buildPhrases(phrases, prefix);
        for (const item of this.items) {
            const { name, caption } = item;
            phrases.push([`${this.phrase}`, caption, this.basePhrase, this.typeNum]);
        }
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        let items = [];
        for (let item of this.items) {
            const { id, name, caption, phrase, itemValue: value, optionsItemType } = item;
            items.push({
                id, name, caption, value, phrase, optionsItemType
            });
        }
        Object.assign(ret, { items });
        return ret;
    }

    forEachBud(callback: (bud: BizBud) => void) {
        super.forEachBud(callback);
        for (let item of this.items) callback(item as unknown as BizBud);
    }
    /*
    getAllBuds(): BizBud[] {
        const buds: BizBud[] = [];
        for (let item of this.items) {
            buds.push(item as any as BizBud);
        };
        return buds;
    }
    */
}
