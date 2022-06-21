import { logger } from '../../tool';
import {
    DbCaller, ParamID, ParamIX, ParamIXSum
    , ParamActs, ParamActDetail, ParamIDDetailGet, ParamIDinIX
    , ParamIDLog, ParamIDSum, ParamKeyID, ParamKeyIX
    , ParamKeyIXSum, ParamKeyIDSum, ParamSum, TableSchema
    , ParamIDxID, ParamIDTree, ParamIDNO, ParamActIX, ParamActIXSort, ParamQueryID, ParamIXValues
} from '../dbCaller';
import { EntityRunner } from "./entityRunner";

export class IDRunner {
    private readonly entityRunner: EntityRunner;
    private readonly dbCaller: DbCaller;
    constructor(entityRunner: EntityRunner, dbCaller: DbCaller) {
        this.entityRunner = entityRunner;
        this.dbCaller = dbCaller;
    }

    Acts(unit: number, user: number, param: ParamActs): Promise<any[]> {
        for (let i in param) {
            if (i === '$') continue;
            let ts = this.getTableSchema(i, ['id', 'idx', 'ix']);
            let values = (param[i] as unknown) as any[];
            if (values) {
                ts.values = values;
                param[i] = ts;
            }
        }
        return this.dbCaller.Acts(unit, user, param);
    }

    ActIX(unit: number, user: number, param: ParamActIX): Promise<any[]> {
        let { IX, ID: ID, IXs } = param;
        param.IX = this.getTableSchema(IX as unknown as string, ['ix']);
        param.ID = this.getTableSchema(ID as unknown as string, ['id']);
        if (IXs) {
            param.IXs = IXs.map(v => {
                let { IX, ix } = v;
                return { IX: this.getTableSchema(IX as unknown as string, ['ix']), ix }
            })
        }
        return this.dbCaller.ActIX(unit, user, param);
    }

    ActIXSort(unit: number, user: number, param: ParamActIXSort): Promise<any[]> {
        let { IX } = param;
        param.IX = this.getTableSchema(IX as unknown as string, ['ix']);
        return this.dbCaller.ActIXSort(unit, user, param);
    }

    ActIDProp(unit: number, user: number, param: { ID: string; id: number; name: string; value: any }): Promise<void> {
        return this.dbCaller.ActIDProp(unit, user, param);
    }

    ActDetail(unit: number, user: number, param: ParamActDetail): Promise<any[]> {
        let { main, detail, detail2, detail3 } = param;
        let types = ['id'];
        param.main = this.getTableSchema(main.name as unknown as string, types, [(main as any).value as any]);
        param.detail = this.getTableSchema(detail.name as unknown as string, types, detail.values);
        if (detail2) {
            param.detail2 = this.getTableSchema(detail2.name as unknown as string, types, detail2.values);
        }
        if (detail3) {
            param.detail3 = this.getTableSchema(detail3.name as unknown as string, types, detail3.values);
        }
        return this.dbCaller.ActDetail(unit, user, param);
    }

    QueryID(unit: number, user: number, param: ParamQueryID): Promise<any[]> {
        let { ID, IDX, IX } = param;
        param.ID = this.getTableSchema(ID as unknown as string, ['id']);
        param.IDX = this.getTableSchemaArray(IDX as unknown as any, ['id', 'idx']);
        param.IX = this.getTableSchemaArray(IX as unknown as any, ['ix']);
        return this.dbCaller.QueryID(unit, user, param);
    }

    IDNO(unit: number, user: number, param: ParamIDNO): Promise<string> {
        let { ID } = param;
        let types = ['id'];
        param.ID = this.getTableSchema(ID as unknown as string, types);
        return this.dbCaller.IDNO(unit, user, param);
    }

    IDDetailGet(unit: number, user: number, param: ParamIDDetailGet): Promise<any[]> {
        let { main, detail, detail2, detail3 } = param;
        let types = ['id'];
        param.main = this.getTableSchema(main as unknown as string, types);
        param.detail = this.getTableSchema(detail as unknown as string, types);
        if (detail2) {
            param.detail2 = this.getTableSchema(detail2 as unknown as string, types);
        }
        if (detail3) {
            param.detail3 = this.getTableSchema(detail3 as unknown as string, types);
        }
        return this.dbCaller.IDDetailGet(unit, user, param);
    }

    async ID(unit: number, user: number, param: ParamID): Promise<any[]> {
        let { id, IDX } = param;
        let types = ['id', 'idx'];
        let IDTypes: string | (string[]);
        IDTypes = IDX as unknown as any;
        let idTypes: string[];
        if (IDTypes === undefined) {
            let retIdTypes = await this.dbCaller.idTypes(unit, user, id);
            let coll: { [id: number]: string } = {};
            for (let r of retIdTypes) {
                let { id, $type } = r;
                coll[id] = $type;
            }
            if (typeof (id) === 'number') {
                IDTypes = coll[id];
                idTypes = [IDTypes];
            }
            else {
                IDTypes = idTypes = [];
                for (let v of id as number[]) {
                    idTypes.push(coll[v]);
                }
            }
        }
        param.IDX = this.getTableSchemaArray(IDTypes, types);
        let ret = await this.dbCaller.ID(unit, user, param);
        if (idTypes) {
            let len = ret.length;
            for (let i = 0; i < len; i++) {
                ret[i]['$type'] = idTypes[i];
            }
        }
        return ret;
    }

    IDTv(unit: number, user: number, ids: number[]): Promise<any[]> {
        return this.dbCaller.IDTv(unit, user, ids);
    }

    KeyID(unit: number, user: number, param: ParamKeyID): Promise<any[]> {
        let { ID, IDX } = param;
        let types = ['id', 'idx'];
        param.ID = this.getTableSchema(ID as unknown as string, ['id']);
        param.IDX = this.getTableSchemaArray(IDX as unknown as any, types);
        return this.dbCaller.KeyID(unit, user, param);
    }

    IX(unit: number, user: number, param: ParamIX): Promise<any[]> {
        let { IX, IX1, IDX } = param;
        param.IX = this.getTableSchema((IX as unknown) as string, ['ix']) as TableSchema;
        param.IX1 = this.getTableSchema((IX1 as unknown) as string, ['ix']) as TableSchema;
        let types = ['id', 'idx'];
        param.IDX = this.getTableSchemaArray(IDX as unknown as any, types);
        return this.dbCaller.IX(unit, user, param);
    }

    IXr(unit: number, user: number, param: ParamIX): Promise<any[]> {
        let { IX, IX1, IDX } = param;
        param.IX = this.getTableSchema((IX as unknown) as string, ['ix']) as TableSchema;
        param.IX1 = this.getTableSchema((IX1 as unknown) as string, ['ix']) as TableSchema;
        let types = ['id', 'idx'];
        param.IDX = this.getTableSchemaArray(IDX as unknown as any, types);
        return this.dbCaller.IXr(unit, user, param);
    }

    IXValues(unit: number, user: number, param: ParamIXValues): Promise<any[]> {
        let { IX } = param;
        param.IX = this.getTableSchema((IX as unknown) as string, ['ix']) as TableSchema;
        return this.dbCaller.IXValues(unit, user, param);
    }

    KeyIX(unit: number, user: number, param: ParamKeyIX): Promise<any[]> {
        let { ID, IX, IDX } = param;
        param.ID = this.getTableSchema((ID as unknown) as string, ['id']);
        param.IX = this.getTableSchema((IX as unknown) as string, ['ix']);
        param.IDX = this.getTableSchemaArray(IDX as unknown as any, ['id', 'idx']);
        return this.dbCaller.KeyIX(unit, user, param);
    }

    IDLog(unit: number, user: number, param: ParamIDLog): Promise<any[]> {
        let { IDX, field } = param;
        let ts = this.getTableSchema((IDX as unknown) as string, ['idx']);
        param.IDX = ts;
        let fLower = field.toLowerCase();
        if (ts.schema.fields.findIndex(v => v.name.toLowerCase() === fLower) < 0) {
            this.throwErr(`ID ${IDX} has no Field ${field}`);
        }
        return this.dbCaller.IDLog(unit, user, param);
    }

    private checkIDXSumField(param: ParamSum) {
        let { IDX, field } = param;
        let ts = this.getTableSchema((IDX as unknown) as string, ['idx']);
        param.IDX = ts;
        for (let f of field) {
            let fLower = f.toLowerCase();
            if (ts.schema.fields.findIndex(v => v.name.toLowerCase() === fLower) < 0) {
                this.throwErr(`ID ${IDX} has no Field ${f}`);
            }
        }
    }

    IDSum(unit: number, user: number, param: ParamIDSum): Promise<any[]> {
        this.checkIDXSumField(param);
        return this.dbCaller.IDSum(unit, user, param);
    }

    KeyIDSum(unit: number, user: number, param: ParamKeyIDSum): Promise<any[]> {
        this.checkIDXSumField(param);
        return this.dbCaller.KeyIDSum(unit, user, param);
    }

    IXSum(unit: number, user: number, param: ParamIXSum): Promise<any[]> {
        this.checkIDXSumField(param);
        return this.dbCaller.IXSum(unit, user, param);
    }

    KeyIXSum(unit: number, user: number, param: ParamKeyIXSum): Promise<any[]> {
        this.checkIDXSumField(param);
        return this.dbCaller.KeyIXSum(unit, user, param);
    }

    IDinIX(unit: number, user: number, param: ParamIDinIX): Promise<any[]> {
        let { IX, ID } = param;
        param.IX = this.getTableSchema((IX as unknown) as string, ['ix']);
        param.ID = this.getTableSchema((ID as unknown) as string, ['id']);
        return this.dbCaller.IDinIX(unit, user, param);
    }

    IDxID(unit: number, user: number, param: ParamIDxID): Promise<any[]> {
        let { ID, IX, ID2 } = param;
        param.ID = this.getTableSchema((ID as unknown) as string, ['id']);
        param.IX = this.getTableSchema((IX as unknown) as string, ['ix']);
        param.ID2 = this.getTableSchema((ID2 as unknown) as string, ['id']);
        return this.dbCaller.IDxID(unit, user, param);
    }

    IDTree(unit: number, user: number, param: ParamIDTree): Promise<any[]> {
        let { ID } = param;
        param.ID = this.getTableSchema((ID as unknown) as string, ['id']);
        return this.dbCaller.IDTree(unit, user, param);
    }

    private getTableSchema(name: string, types: string[], values?: any[]): TableSchema {
        if (name === undefined) return undefined;
        let isXi: boolean;
        if (name[0] === '!') {
            isXi = true;
            name = name.substr(1);
        }
        let lowerName = name.toLowerCase();
        let ts = this.entityRunner.schemas[lowerName]?.call;
        if (ts === undefined) {
            this.throwErr(`${name} is not a valid Entity`);
        }
        let { type } = ts;
        if (types.indexOf(type) < 0) {
            this.throwErr(`TableSchema only support ${types.map(v => v.toUpperCase()).join(', ')}`);
        }
        return { name: lowerName, schema: ts, values, isXi };
    }
    private getTableSchemas(names: string[], types: string[]): TableSchema[] {
        return names.map(v => this.getTableSchema(v, types));
    }

    private getTableSchemaArray(names: string | string[], types: string[]): TableSchema[] {
        if (names === undefined) return;
        return Array.isArray(names) === true ?
            this.getTableSchemas(names as string[], types)
            :
            [this.getTableSchema(names as string, types)];
    }

    private throwErr(err: string) {
        logger.error(err);
        throw new Error(err);
    }
}
