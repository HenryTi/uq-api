// import { Act } from "../entity/act";
import { PContext, PElement } from "../../parser";
import { IElement } from "../element";
import { BizBase, BizPhraseType } from "./Base";

export abstract class BizAct<T extends BizBase> extends IElement {
    protected readonly owner: T;
    readonly bizPhraseType = BizPhraseType.detailAct;

    constructor(owner: T) {
        super();
        this.owner = owner;
    }

    abstract parser(context: PContext): PElement<IElement>;
}
