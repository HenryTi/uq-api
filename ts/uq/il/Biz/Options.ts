import { PBizOptions, PContext, PElement } from "../../parser";
import { IElement } from "../element";
import { BizPhraseType } from "./Base";
import { BizEntity, IBud } from "./Entity";

export enum OptionsItemValueType {
    none = 0,
    int = 1,
    dec = 2,
    str = 3,
}
export interface OptionsItem {
    name: string;
    caption: string;
    value: string | number;
    type: OptionsItemValueType;
}

export class BizOptions extends BizEntity {
    readonly type = 'options';
    readonly items: OptionsItem[] = [];
    parser(context: PContext): PElement<IElement> {
        return new PBizOptions(this, context);
    }
    buildPhrases(phrases: [string, string, string, string][], prefix: string) {
        super.buildPhrases(phrases, prefix);
        for (const item of this.items) {
            const { name, caption } = item;
            phrases.push([`${this.basePhrase}`, caption, this.basePhrase, this.typeNum]);
        }
    }

    buildSchema() {
        let ret = super.buildSchema();
        let items = [];
        for (let item of this.items) {
            items.push(item);
        }
        Object.assign(ret, { items });
        return ret;
    }

    getAllBuds(): IBud[] {
        const buds: IBud[] = [];
        const typeNum = BizPhraseType['optionsitem'];
        for (let item of this.items) {
            const { name, caption, value, type } = item;
            buds.push({
                phrase: `${this.name}.${name}`,
                caption,
                memo: undefined,
                dataTypeNum: undefined,
                objName: undefined,
                typeNum: String(typeNum),
                optionsItemType: type,
                value,
            });
        };
        return buds;
    }
}
