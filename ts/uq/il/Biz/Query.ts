import { Query } from "../entity/entity";
import { Biz } from "./Biz";

export class BizQuery extends Query {
    readonly biz: Biz;
    constructor(biz: Biz) {
        super(biz.uq);
        this.biz = biz;
    }

    get isBiz() { return true }
}
