import { EntityAccessibility } from './entity';
import * as parser from '../../parser';
import { Builder } from '../builder';
import { Field } from '../field';
import { FieldPointer, Pointer } from '../pointer';
import { IDSchemaBuilder } from '../schema';
import { IdBase } from './IdBase';
import { Permit } from './permit';

export enum EnumIdType {
    None = 0
    , UID = 1           // UUID or ULocal or UMinute
    , UUID = 2	        // universally unique identifier (UUID)
    , ULocal = 3	    // unique local identifier
    // , UMinute = 4	    // unique minute identifier
    , Global = 11, Local = 12, Minute = 13
    , MinuteId = 21
} // Minute: unique in uq

// 如果 parent key 字段存在，则是Tree结构ID。另外的key字段只能有一个, key0=parent
export class ID extends IdBase {
    id: Field;
    joins: { ID: ID; field: Field; }[];
    isMinute: boolean = false;
    keys: Field[] = [];
    stars: string[];             // stared property ID will be cached with the Main
    version: Field;
    idIsKey: boolean = false;
    global: boolean = false;
    idType: EnumIdType;
    permit: Permit;
    get defaultAccessibility(): EntityAccessibility { return EntityAccessibility.visible }

    setId(field: Field) { this.id = field; this.fields.push(field); }
    fieldPointer(name: string): Pointer {
        if (name === '$' || this.id.name === name) return new FieldPointer();
        if (this.fields.find(f => f.name === name) !== undefined
            || this.fields.find(f => f.name === name) !== undefined
            || name === '$create' && this.stampCreate === true
            || name === '$update' && this.stampUpdate === true) {
            return new FieldPointer();
        }
    }
    getField(name: string): Field {
        let f = this.fields.find(v => v.name === name);
        if (f === undefined && this.id.name === name) f = this.id;
        return f;
    }
    getFields(): Field[] {
        return this.fields;
    }
    getKeys(): Field[] {
        return [this.id];
    }

    get type(): string { return 'id'; }
    parser(context: parser.PContext) { return new parser.PID(this, context); }
    db(db: Builder): object { return db.ID(this); }
    internalCreateSchema() { new IDSchemaBuilder(this.uq, this).build(this.schema as any); }
}
