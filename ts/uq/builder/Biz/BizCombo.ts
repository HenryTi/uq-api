import { BizCombo, bigIntField } from "../../il";
import { BBizEntity } from "./BizEntity";

export class BBizCombo extends BBizEntity<BizCombo> {
    override async buildTables(): Promise<void> {
        const { id, keys, indexes } = this.bizEntity;
        let table = this.createTable(`${this.context.site}.${id}`);
        let keyFields = keys.map(v => bigIntField(v.name));
        let idField = bigIntField('id');
        table.keys = [idField];
        table.fields = [idField, ...keyFields];
    }
}
