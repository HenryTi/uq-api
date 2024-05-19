import * as _ from 'lodash';
import * as parser from '../../parser';
import { EntityAccessibility, Busable, ImportFrom, Index, BusFace, Bus, IArr, useBusFace } from "./entity";
import { Field, smallIntField, Table } from "../field";
import { ActionStatement } from "../statement";
import { TuidSchemaBuilder } from "../schema";
import { Builder } from "../builder";
import { Pointer, FieldPointer } from "../pointer";
import { IdBase } from './IdBase';

export class Tuid extends IdBase implements Busable {
    get type(): string { return 'tuid'; }
    id: Field;
    owner: Tuid;            // only arr has owner
    global: boolean = false;		// no unit for the Tuid
    sync: boolean = false;       	// 不会自增，内容从其它uq里面拉取过来
    from: ImportFrom;				// 仅仅引用外部Tuid
    other: string;              	// import uq里面的Tuid名，同名则undefined
    //id: Field;
    main: Field[] = [];
    //fields: Field[] = [];
    unique: Index;
    search: string[];
    arrs: TuidArr[];                // tuid的数组属性
    //stampCreate: boolean;
    //stampUpdate: boolean;
    stampOnMain: boolean;			// ids查询时，是否自动带stamp
    onSaveStatement: ActionStatement;
    buses: BusFace[] = [];
    get defaultAccessibility(): EntityAccessibility { return EntityAccessibility.visible }

    parser(context: parser.PContext) { return new parser.PTuid(this, context); }
    db(db: Builder): object { return db.tuid(this); }
    internalCreateSchema() { new TuidSchemaBuilder(this.uq, this).build(this.schema as any); }

    addMain(field: Field) {
        this.main.push(field);
    }

    addField(field: Field) {
        this.fields.push(field);
    }

    getArrTable(arr: string): Table {
        return this.arrs.find(v => v.name === arr);
    }

    fieldPointer(name: string): Pointer {
        if (this.id.name === name) {
            return new FieldPointer();
        }
        if (this.main.find(f => f.name === name) !== undefined
            || this.fields.find(f => f.name === name) !== undefined
            || name === '$create' && this.stampCreate === true
            || name === '$update' && this.stampUpdate === true) {
            return new FieldPointer();
        }
    }
    getKeys(): Field[] {
        return [this.id];
    }
    getFields(): Field[] {
        let ret = _.concat([], /*this.base, */this.id, this.main, this.fields);
        return ret;
    }
    getField(name: string): Field {
        let f = this.main.find(v => v.name === name);
        if (f === undefined) f = this.fields.find(v => v.name === name);
        if (f === undefined && this.id.name === name) f = this.id;
        return f;
    }
    getArr(name: string): TuidArr {
        if (this.arrs === undefined) return;
        return this.arrs.find(v => v.name === name);

    }
    getTableAlias(): string { return; }
    getTableName(): string { return this.name; }

    useBusFace(bus: Bus, face: string, arr: string, local: boolean) {
        useBusFace(this.buses, bus, face, arr, local);
    }
}

export class TuidArr extends Tuid implements IArr {
    constructor(owner: Tuid) {
        super(owner.uq);
        this.owner = owner;
        this.orderField = smallIntField('$order');
    }
    ownerField: Field;
    orderField: Field;
    getTableName(): string { return this.owner.name + '_' + this.name }
    fieldPointer(name: string): Pointer {
        if (name === this.id.name
            || name === this.ownerField.name
            || name === this.orderField.name
            || this.fields.find(v => v.name === name) !== undefined
            || this.main.find(f => f.name === name) !== undefined
        ) {
            return new FieldPointer();
        }
    }
    getKeys(): Field[] { return [this.ownerField, this.id] }
    getFields(): Field[] {
        //let ret = _.concat([this.ownerField, this.id], this.fields, this.main, [this.orderField]);
        //return ret;
        return [...this.main, ...this.fields];
    }
    getField(name: string): Field {
        let f = this.main.find(v => v.name === name);
        if (f === undefined) f = this.fields.find(v => v.name === name);
        return f;
    }
}
