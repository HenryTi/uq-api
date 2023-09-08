import * as parser from '../../parser';
import { Builder } from '../builder';
import { Field } from '../field';
import { FieldPointer, Pointer } from '../pointer';
import { IXSchemaBuilder } from '../schema';
import { EntityWithTable } from "./entity";
import { Permit } from './permit';

// 一对多关系 i-x
export class IX extends EntityWithTable {
    ixx: Field;
    i: Field;
    x: Field;
    prev: Field;
    twoWayIndex: boolean;
    keys: Field[] = [];
    fields: Field[] = [];
    xType: number;
    permit: Permit;

    setXField(x: 'ixx' | 'ix' | 'i' | 'xi' | 'x', field: Field) {
        switch (x) {
            case 'ixx': this.ixx = field; break;
            case 'ix':
            case 'i':
                this.i = field; break;
            case 'xi':
            case 'x':
                this.x = field; break;
            default: throw Error('undefined x');
        }
        this.keys.unshift(field);
        this.fields.unshift(field);
    }

    get global(): boolean { return true; }
    get type(): string { return 'ix'; }
    parser(context: parser.PContext) { return new parser.PIX(this, context); }
    db(db: Builder): object { return db.IX(this); }
    internalCreateSchema() { new IXSchemaBuilder(this.uq, this).build(this.schema as any); }

    getKeys(): Field[] { return this.keys; }
    getFields(): Field[] { return this.fields; }
    getField(name: string): Field {
        return this.fields.find(f => f.name === name);
    }
    fieldPointer(name: string): Pointer {
        let f = this.getField(name);
        if (f !== undefined) return new FieldPointer();
        let xField: Field;
        switch (name) {
            default: return;
            case 'ix':
            case 'i':
                xField = this.i;
                break;
            case 'xi':
            case 'x':
                xField = this.x;
                break;
        }
        if (name === xField.name) return new FieldPointer();
    }
}
