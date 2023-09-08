import * as parser from '../../parser';
import { Builder } from '../builder';
import { DataType } from '../datatype';
import { ActSchemaBuilder } from '../schema';
import { ActionStatement, FunctionStatement } from "../statement";
import { EntityAccessibility, ActionBase, ActionHasInBus, Bus, Busable, BusFace, Returns, useBusFace } from "./entity";

export interface ActionParamConvert {
    type: string;
    name: string;
    to: string[];
}
export class Act extends ActionHasInBus implements Busable {
    buses: BusFace[] = [];
    paramConvert: ActionParamConvert;
    get type(): string { return 'action'; }
    get defaultAccessibility(): EntityAccessibility { return EntityAccessibility.visible }
    returns: Returns;
    statement: ActionStatement;

    parser(context: parser.PContext) { return new parser.PAct(this, context); }
    db(db: Builder): object { return db.action(this); }
    internalCreateSchema() { new ActSchemaBuilder(this.uq, this).build(this.schema as any); }
    useBusFace(bus: Bus, face: string, arr: string, local: boolean): void {
        useBusFace(this.buses, bus, face, arr, local);
    }
    getReturns(): Returns { return this.returns; }
}

export class Function extends ActionBase {
    dataType: DataType;
    get type(): string { return 'function'; }
    statement: FunctionStatement;
    parser(context: parser.PContext) { return new parser.PFunction(this, context); }
    db(db: Builder): object { return db.func(this); }
    protected internalCreateSchema() { };
}

// uq 中普通被调用的子程序。如果需要返回表，有调用方提供临时表
export class Proc extends Act {
    isScheduled: boolean = false;
    logError: boolean = false;
    get type(): string { return 'proc'; }
    db(db: Builder): object {
        return db.proc(this);
    }
    parser(context: parser.PContext) { return new parser.PProc(this, context); }
}

export class SysProc extends Proc {
    get type(): string { return 'sysproc'; }
    parser(context: parser.PContext) { return new parser.PSysProc(this, context); }
    db(db: Builder): object {
        return db.sysproc(this);
    }
}
