import { PBizOptions, PContext, PElement } from "../../parser";
import { IElement } from "../IElement";
import { BizPhraseType, BudDataType } from "./BizPhraseType";
import { BizBud, BizBudValue } from "./Bud";
import { BizEntity } from "./Entity";

export enum OptionsItemValueType {
    none = 0,
    int = 1,
    dec = 2,
    str = 3,
}
export class OptionsItem extends BizBudValue {
    get bizPhraseType() { return BizPhraseType.optionsitem; }
    name: string;
    caption: string;
    itemValue: string | number;
    _itemType: OptionsItemValueType;
    get optionsItemType(): OptionsItemValueType { return this._itemType; }

    parser(context: PContext): PElement<IElement> {
        debugger;
        return;
    }
    get dataType(): BudDataType {
        return;
    }
    get canIndex(): boolean {
        return false;
    }
}

export class BizOptions extends BizEntity {
    readonly bizPhraseType = BizPhraseType.options;
    protected readonly fields = [];
    readonly items: OptionsItem[] = [];
    parser(context: PContext): PElement<IElement> {
        return new PBizOptions(this, context);
    }
    buildPhrases(phrases: [string, string, string, string][], prefix: string) {
        super.buildPhrases(phrases, prefix);
        for (const item of this.items) {
            const { name, caption } = item;
            phrases.push([`${this.phrase}`, caption, this.extendsPhrase, this.typeNum]);
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

    override forEachBud(callback: (bud: BizBud) => void) {
        super.forEachBud(callback);
        for (let item of this.items) callback(item as unknown as BizBudValue);
    }

    override getBud(name: string): BizBud {
        let bud = super.getBud(name);
        if (bud !== undefined) return bud;
        for (let item of this.items) {
            if (item.name === name) return item;
        }
        return;
    }
}
