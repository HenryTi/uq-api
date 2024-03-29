import { logger } from '../tool';
import { EntityRunner } from "./runner";
import { packParam } from "./packParam";

interface SchemaField {
    name: string;
    type: string;
    fields: any[];
}

interface ParamBus {
    bus: any;       // schema
    busOwner: string;
    busName: string;
    face: string;
    param: SchemaField[],
    returns: { fields: SchemaField[]; arrs: { name: string; fields: SchemaField[] }[] },
}

export abstract class ParametersBus {
    protected runner: EntityRunner;
    protected entityName: string;
    protected schema: any;
    private paramBuses: ParamBus[];

    constructor(runner: EntityRunner, entityName: string) {
        this.runner = runner;
        this.entityName = entityName;
    }

    init(): boolean {
        let ret = this.initSchema();
        this.initInBuses();
        return ret;
    }

    protected abstract initSchema(): boolean;
    protected getQueryProc(bus: string, face: string): string {
        return `${this.entityName}$bus$${bus}_${face}`;
    }

    private initInBuses() {
        let { inBuses } = this.schema;
        if (inBuses === undefined) return;
        this.paramBuses = (inBuses as string[]).map(v => {
            let parts = v.split('/');
            let schema = this.runner.getSchema(parts[0]);
            if (schema === undefined) return;
            let bus = schema.call;
            let { busOwner, busName } = bus;
            let face = parts[1];
            let { param, returns } = bus.schema[face];
            return {
                bus: bus,
                busOwner: busOwner,
                busName: busName,
                face: face,
                param: param,
                returns: returns,
            }
        });
    }

    async busQueryAll(unit: number, user: number, data: any): Promise<string> {
        if (this.paramBuses === undefined) return '';

        let retBusQuery: any[] = [];
        for (let inBus of this.paramBuses) {
            let ret = await this.busQuery(inBus, unit, user, data);
            retBusQuery.push(ret);
        }
        let ret = retBusQuery.join('\n\n') + '\n\n';
        return ret;
    }

    async buildDataFromObj(unit: number, user: number, obj: any): Promise<string> {
        let data = packParam(this.schema, obj);
        let ret = await this.busQueryAll(unit, user, data);
        return data + ret;
    }

    private async busQuery(inBus: ParamBus, unit: number, user: number, data: string): Promise<any> {
        let { bus, face, busOwner, busName, param, returns } = inBus;
        //let {busOwner, busName} = bus;
        let openApi = await this.runner.net.openApiUnitFace(this.runner, unit, busOwner, busName, face);
        if (openApi === undefined) {
            throw 'error await this.runner.net.openApiUnitFace nothing returned';
        }
        let params: any[] = [];
        let proc = this.getQueryProc(bus.name, face);
        let retParam: any[][] = await this.runner.tablesFromProc(proc, [unit, user, data]);
        let retParamMain = retParam[0][0];
        if (param !== undefined) {
            let retIndex = 1;
            for (let qp of param) {
                let { name, type, fields } = qp;
                let value: any;
                if (type === 'array') {
                    value = this.buildTextFromRet(fields, retParam[retIndex++]);
                }
                else {
                    value = retParamMain[name] || retParamMain[name.toLowerCase()];
                }
                params.push(value);
            }
        }
        let ret = await openApi.busQuery(unit, busOwner, busName, face, params);
        let results: any[] = [];
        let { fields, arrs } = returns;
        let retMain: any[] = ret[0];
        let text = this.buildTextFromRet(fields, retMain);
        results.push(text);
        if (arrs !== undefined) {
            let len = arrs.length;
            for (let i = 0; i < len; i++) {
                let text = this.buildTextFromRet(arrs[i].fields, ret[i + 1]);
                results.push(text);
            }
        }
        return results.join('\n\n');
    }

    private buildTextFromRet(fields: any[], values: any[]): string {
        let ret: string[] = [];
        for (let row of values) {
            let items: any[] = [];
            for (let f of fields) {
                let fn = f.name;
                let v = row[fn];
                items.push(v);
            }
            ret.push(items.join('\t'));
        }
        return ret.join('\n');
    }
}

export class ActionParametersBus extends ParametersBus {
    protected initSchema(): boolean {
        let schema = this.runner.getSchema(this.entityName);
        this.schema = schema.call;
        return true;
    }
}

export class AcceptParametersBus extends ParametersBus {
    private faceName: string;
    constructor(runner: EntityRunner, busName: string, faceName: string) {
        super(runner, busName);
        this.faceName = faceName;
    }
    protected getQueryProc(busName: string, face: string): string {
        let ret = `${this.entityName}_${this.faceName}$bus$${busName}_${face}`
        return ret;
    }
    protected initSchema(): boolean {
        let schema = this.runner.getSchema(this.entityName);
        this.schema = schema.call.schema[this.faceName];
        let { accept } = this.schema;
        if (accept) {
            this.schema.inBuses = accept.inBuses;
        }
        return true;
    }
}

export class SheetVerifyParametersBus extends ParametersBus {
    protected initSchema(): boolean {
        let schema = this.runner.getSchema(this.entityName);
        this.schema = schema.call.verify;
        return true;
    }
    protected getQueryProc(bus: string, face: string): string { return `${this.entityName}$verify$bus$${bus}_${face}` }
}

export class SheetActionParametersBus extends ParametersBus {
    private stateName: string;
    private actionName: string;
    constructor(runner: EntityRunner, sheetName: string, stateName: string, actionName: string) {
        super(runner, sheetName);
        this.stateName = stateName.toLowerCase();
        this.actionName = actionName.toLowerCase();
    }

    protected initSchema(): boolean {
        let schema = this.runner.getSchema(this.entityName);
        this.schema = schema.call;
        // 2021-01-04：inBuses 在schema中，而不是在run中。
        //this.run = schema.run?.run;
        let state = (this.schema.states as any[]).find(v => v.name === this.stateName);
        //let state = this.run?.[this.stateName];
        if (state === undefined) {
            logger.error('Sheet %s 没有定义 State %s', this.entityName, this.stateName);
            return false;
        }
        //let action = state[this.actionName]; 
        let action = (state.actions as any[]).find(v => v.name === this.actionName);
        if (action === undefined) {
            logger.error('Sheet %s State %s 没有定义 Action %s', this.entityName, this.stateName, this.actionName);
            return false;
        }
        this.schema.inBuses = action.inBuses;
        return true;
    }
    protected getQueryProc(bus: string, face: string): string {
        let ret = this.entityName + '_';
        if (this.stateName !== '$') ret += this.stateName + '_';
        return ret + `${this.actionName}$bus$${bus}_${face}`;
    }
}
