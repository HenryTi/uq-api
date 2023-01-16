import {
    ParamID, ParamIX, ParamIXSum, ParamActs
    , ParamActDetail, ParamIDinIX, ParamIDLog, ParamIDSum
    , ParamKeyID, ParamKeyIX, ParamKeyIXSum
    , ParamKeyIDSum, ParamIDxID, ParamIDTree, ParamIDNO, ParamActIX, ParamActIXSort, ParamQueryID, ParamIXValues, ParamActID
} from "../dbCaller";

export interface ISqlBuilder {
    build(): string;
    buildCall(): { proc: string; params: any[] };
}

export abstract class Builder {
    readonly dbName: string;
    readonly hasUnit: boolean;
    readonly twProfix: string;
    constructor(dbName: string, hasUnit: boolean, twProfix: string) {
        this.dbName = dbName;
        this.hasUnit = hasUnit;
        this.twProfix = twProfix;
    }

    Acts(param: ParamActs): ISqlBuilder {
        return
    }

    ActIX(param: ParamActIX): ISqlBuilder {
        return
    }

    ActIXSort(param: ParamActIXSort): ISqlBuilder {
        return;
    }

    ActID(param: ParamActID): ISqlBuilder {
        return;
    }

    ActDetail(param: ParamActDetail): ISqlBuilder {
        return
    }

    QueryID(param: ParamQueryID): ISqlBuilder {
        return;
    }

    IDNO(param: ParamIDNO): ISqlBuilder {
        return
    }

    IDDetailGet(param: ParamActDetail): ISqlBuilder {
        return
    }

    ID(param: ParamID): ISqlBuilder {
        return;
    }

    idTypes(id: number | (number[])): ISqlBuilder {
        return;
    }

    IDTv(ids: number[]): ISqlBuilder {
        return;
    }

    KeyID(param: ParamKeyID): ISqlBuilder {
        return
    }

    IX(param: ParamIX): ISqlBuilder {
        return
    }

    IXr(param: ParamIX): ISqlBuilder {
        return
    }

    IXValues(param: ParamIXValues): ISqlBuilder {
        return
    }

    KeyIX(param: ParamKeyIX): ISqlBuilder {
        return
    }

    IDLog(param: ParamIDLog): ISqlBuilder {
        return
    }

    IDSum(param: ParamIDSum): ISqlBuilder {
        return
    }

    KeyIDSum(param: ParamKeyIDSum): ISqlBuilder {
        return
    }

    IXSum(param: ParamIXSum): ISqlBuilder {
        return
    }

    KeyIXSum(param: ParamKeyIXSum): ISqlBuilder {
        return
    }

    IDinIX(param: ParamIDinIX): ISqlBuilder {
        return;
    }

    IDxID(param: ParamIDxID): ISqlBuilder {
        return;
    }

    IDTree(param: ParamIDTree): ISqlBuilder {
        return;
    }
}
