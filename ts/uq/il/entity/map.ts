import * as _ from 'lodash';
import * as parser from '../../parser';
import { Builder } from '../builder';
import { Field } from "../field";
import { FieldPointer, Pointer } from '../pointer';
import { MapSchemaBuilder } from '../schema';
import { ActionStatement } from '../statement';
import { BookBase, Bus, Busable, BusFace, ImportFrom, useBusFace, EntityAccessibility } from "./entity";

export interface MapQueries {
    all: string;
    page: string;
    query: string;
    //slavePage: string;
}
export interface MapActions {
    sync: string;
    add: string;
    del: string;
}

export class Map extends BookBase implements Busable {
    get type(): string { return 'map'; }
    isOpen: boolean;
    from: ImportFrom;
    orderField: Field;
    get defaultAccessibility(): EntityAccessibility { return EntityAccessibility.visible }
    parser(context: parser.PContext) { return new parser.PMap(this, context); }
    db(db: Builder): object { return db.map(this); }
    internalCreateSchema() { new MapSchemaBuilder(this.uq, this).build(this.schema as any) }
    fieldPointer(name: string): Pointer {
        if (this.orderField !== undefined && this.orderField.name === name)
            return new FieldPointer();
        return super.fieldPointer(name);
    }
    getFields(): Field[] { return [...super.getFields(), this.orderField]; }
    onAddStatement: ActionStatement;
    buses: BusFace[] = [];

    queries: MapQueries = {
        all: undefined,
        page: undefined,
        query: undefined,
    };
    actions: MapActions = {
        sync: undefined,
        add: undefined,
        del: undefined,
    };

    useBusFace(bus: Bus, face: string, arr: string, local: boolean) {
        useBusFace(this.buses, bus, face, arr, local);
    }
}

