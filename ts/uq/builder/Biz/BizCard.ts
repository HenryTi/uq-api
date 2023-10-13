import { BizCard } from "../../il";
import { BBizEntity } from "./BizEntity";

export class BBizCard extends BBizEntity<BizCard> {
    override async buildProcedures(): Promise<void> {
        // const { id } = this.bizEntity;
        // const procSubmit = this.createProcedure(`${this.context.site}.${id}`);
        // this.buildSubmitProc(procSubmit);
    }
}
