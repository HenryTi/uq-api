import { Act } from "../entity/act";
import { Biz } from "./Biz";

export class BizAct extends Act {
    readonly biz: Biz;
    constructor(biz: Biz) {
        super(biz.uq);
        this.biz = biz;
    }

    get isBiz() { return true }
}
