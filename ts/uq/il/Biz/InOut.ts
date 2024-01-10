import { PBizIn, PBizOut, PContext, PElement } from "../../parser";
import { IElement } from "../IElement";
import { BizAct } from "./Base";
import { BizPhraseType } from "./BizPhraseType";
import { BizBudValue } from "./Bud";
import { BizEntity } from "./Entity";

export class BizInAct extends BizAct {
    override parser(context: PContext): PElement<IElement> {
        return;
    }
}

export interface InOutArr {
    name: string;
    props: Map<string, BizBudValue>;
    act: BizInAct;
}

export abstract class BizInOut extends BizEntity {
    protected readonly fields = [];
    act: BizInAct;
    readonly arrs: { [name: string]: InOutArr; } = {};
}

export class BizIn extends BizInOut {
    readonly bizPhraseType = BizPhraseType.in;

    parser(context: PContext): PElement<IElement> {
        return new PBizIn(this, context);
    }
}

export class BizOut extends BizInOut {
    readonly bizPhraseType = BizPhraseType.out;

    parser(context: PContext): PElement<IElement> {
        return new PBizOut(this, context);
    }
}
