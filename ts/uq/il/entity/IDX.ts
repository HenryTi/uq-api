import * as parser from '../../parser';
import { Builder } from '../builder';
import { Field } from '../field';
import { FieldPointer, Pointer } from '../pointer';
import { IDXSchemaBuilder } from '../schema';
import { EntityWithTable } from "./entity";
import { Permit } from './permit';

export class IDX extends EntityWithTable {
    id: Field;
    //keys: Field[] = [];
    fields: Field[] = [];
    permit: Permit;

    setId(field: Field) { this.id = field; /*this.keys.push(field);*/ this.fields.push(field); }

    get global(): boolean { return true; }
    get type(): string { return 'idx'; }
    parser(context: parser.PContext) { return new parser.PIDX(this, context); }
    db(db: Builder): object { return db.IDX(this); }
    internalCreateSchema() { new IDXSchemaBuilder(this.uq, this).build(this.schema as any); }

    getKeys(): Field[] { return [this.id]/*this.keys;*/ }
    getFields(): Field[] { return this.fields; }
    getField(name: string): Field {
        return this.fields.find(f => f.name === name);
    }
    fieldPointer(name: string): Pointer {
        let f = this.getField(name);
        if (f !== undefined) return new FieldPointer();
    }
}
