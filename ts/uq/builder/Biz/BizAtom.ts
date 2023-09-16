import { BizAtom } from "../../il";
import { BBizEntity } from "./BizEntity";

export class BBizAtom<T extends BizAtom> extends BBizEntity<T> {
    override async buildProcedures(): Promise<void> {
        const { base, id } = this.bizEntity;
        if (base === undefined) return;
        const proc = this.context.createProcedure(`${id}$test`, true);
        this.context.coreObjs.procedures.push(proc);
    }
}
