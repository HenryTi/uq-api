import { SqlType } from "../../tool";
import {
    ParamID, ParamIX, ParamIXSum, ParamActs
    , ParamActDetail, ParamIDinIX, ParamIDLog, ParamIDSum
    , ParamKeyID, ParamKeyIX, ParamKeyIXSum
    , ParamKeyIDSum, ParamIDxID, ParamIDTree, ParamIDNO, ParamActIX, ParamActIXSort, ParamQueryID, ParamIXValues, ParamActID
} from "./IDDefines";
import { SqlBuilder } from "./SqlBuilder";

export interface SqlFactoryProps {
    getTableSchema: (name: string) => any;
    sqlType: SqlType;
    dbName: string;
    hasUnit: boolean;
    twProfix: string;
}

export abstract class SqlFactory {
    readonly dbName: string;
    readonly hasUnit: boolean;
    readonly twProfix: string;
    readonly getTableSchema: (name: string) => any;
    constructor(props: SqlFactoryProps) {
        let { getTableSchema, dbName, hasUnit, twProfix } = props;
        this.getTableSchema = getTableSchema;
        this.dbName = dbName;
        this.hasUnit = hasUnit;
        this.twProfix = twProfix;
    }

    abstract Acts(param: ParamActs): SqlBuilder;
    abstract ActIX(param: ParamActIX): SqlBuilder;
    abstract ActIXSort(param: ParamActIXSort): SqlBuilder;
    abstract ActID(param: ParamActID): SqlBuilder;
    abstract ActDetail(param: ParamActDetail): SqlBuilder;
    abstract QueryID(param: ParamQueryID): SqlBuilder;
    abstract IDNO(param: ParamIDNO): SqlBuilder;
    abstract IDDetailGet(param: ParamActDetail): SqlBuilder;
    abstract ID(param: ParamID): SqlBuilder;
    abstract idTypes(id: number | (number[])): SqlBuilder;
    abstract IDTv(ids: number[]): SqlBuilder;
    abstract KeyID(param: ParamKeyID): SqlBuilder;
    abstract IX(param: ParamIX): SqlBuilder;
    abstract IXr(param: ParamIX): SqlBuilder;
    abstract IXValues(param: ParamIXValues): SqlBuilder;
    abstract KeyIX(param: ParamKeyIX): SqlBuilder;
    abstract IDLog(param: ParamIDLog): SqlBuilder;
    abstract IDSum(param: ParamIDSum): SqlBuilder;
    abstract KeyIDSum(param: ParamKeyIDSum): SqlBuilder;
    abstract IXSum(param: ParamIXSum): SqlBuilder;
    abstract KeyIXSum(param: ParamKeyIXSum): SqlBuilder;
    abstract IDinIX(param: ParamIDinIX): SqlBuilder;
    abstract IDxID(param: ParamIDxID): SqlBuilder;
    abstract IDTree(param: ParamIDTree): SqlBuilder;
}
