import { HistoryBase } from '../../il';
import { BEntity } from './entity';

export abstract class BHistoryBase<E extends HistoryBase> extends BEntity<E> {
    buildTables() {
        let table = this.context.createTable(this.entity.name);
        table.keys = this.entity.getKeys();
        table.fields = this.entity.getFields();
        let indexes = this.entity.indexes;
        if (indexes !== undefined) table.indexes.push(...indexes);
        this.context.appObjs.tables.push(table);
    }
}
