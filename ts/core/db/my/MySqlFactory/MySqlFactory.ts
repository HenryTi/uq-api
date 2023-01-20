import {
    ParamID, ParamIX, ParamActs, ParamActDetail
    , ParamIDDetailGet, ParamIDLog, ParamKeyID, ParamKeyIX
    , ParamIDxID, ParamIDSum, ParamKeyIDSum, ParamIXSum
    , ParamKeyIXSum
    , ParamIDinIX, ParamIDTree, ParamIDNO, ParamActIX, ParamActIXSort, ParamActID, ParamQueryID, ParamIXValues
} from "../../IDDefines";
import { SqlFactory } from "../../SqlFactory";
import { SqlBuilder } from "../../SqlBuilder";

// import { Builder, ISqlBuilder } from "../Builder";
import { SqlActDetail } from "./SqlActDetail";
import { SqlActIX } from "./SqlActIX";
import { SqlActID } from "./SqlActID";
import { SqlActs } from "./SqlActs";
import { SqlKeyID } from "./SqlKeyID";
import { SqlID, SqlIdTypes } from "./SqlID";
import { SqlIDDetail } from "./SqlIDDetail";
import { SqlIDNO } from "./SqlIDNO";
import { SqlIX } from "./SqlIX";
import { SqlIXr } from "./SqlIXr";
import { SqlIDLog } from "./SqlIDLog";
import { SqlIDTree } from "./SqlIDTree";
import { SqlIDxID } from "./SqlIDxID";
import { SqlIDinIX } from "./SqlIDinIX";
import { SqlKeyIX } from "./SqlKeyIX";
import { SqlIDSum } from "./SqlIDSum";
import { SqlKeyIXSum } from "./SqlKeyIXSum";
import { SqlIXSum } from "./SqlIXSum";
import { SqlKeyIDSum } from "./SqlKeyIDSum";
import { SqlActIXSort } from "./SqlActIXSort";
import { SqlQueryID } from "./SqlQueryID";
import { SqlIDTv } from "./SqlIDTv";
import { SqlIXValues } from "./SqlIXValues";

export class MySqlFactory extends SqlFactory {
    Acts(param: ParamActs): SqlBuilder {
        return new SqlActs(this, param);
    }

    ActIX(param: ParamActIX): SqlBuilder {
        return new SqlActIX(this, param);
    }

    ActIXSort(param: ParamActIXSort): SqlBuilder {
        return new SqlActIXSort(this, param);
    }

    ActID(param: ParamActID): SqlBuilder {
        return new SqlActID(this, param);
    }

    ActDetail(param: ParamActDetail): SqlBuilder {
        return new SqlActDetail(this, param);
    }

    QueryID(param: ParamQueryID): SqlBuilder {
        return new SqlQueryID(this, param);
    }

    IDNO(param: ParamIDNO): SqlBuilder {
        return new SqlIDNO(this, param);
    }

    IDDetailGet(param: ParamIDDetailGet): SqlBuilder {
        return new SqlIDDetail(this, param);
    }

    ID(param: ParamID): SqlBuilder {
        return new SqlID(this, param);
    }

    idTypes(id: number | (number[])): SqlBuilder {
        return new SqlIdTypes(this, id);
    }

    IDTv(ids: number[]): SqlBuilder {
        return new SqlIDTv(this, ids);
    }

    KeyID(param: ParamKeyID): SqlBuilder {
        return new SqlKeyID(this, param);
    }

    IX(param: ParamIX): SqlBuilder {
        return new SqlIX(this, param);
    }

    IXr(param: ParamIX): SqlBuilder {
        return new SqlIXr(this, param);
    }

    IXValues(param: ParamIXValues): SqlBuilder {
        return new SqlIXValues(this, param);
    }

    KeyIX(param: ParamKeyIX): SqlBuilder {
        return new SqlKeyIX(this, param);
    }

    IDLog(param: ParamIDLog): SqlBuilder {
        return new SqlIDLog(this, param);
    }

    IDSum(param: ParamIDSum): SqlBuilder {
        return new SqlIDSum(this, param);
    }

    KeyIDSum(param: ParamKeyIDSum): SqlBuilder {
        return new SqlKeyIDSum(this, param);
    }

    IXSum(param: ParamIXSum): SqlBuilder {
        return new SqlIXSum(this, param);
    }

    KeyIXSum(param: ParamKeyIXSum): SqlBuilder {
        return new SqlKeyIXSum(this, param);
    }

    IDinIX(param: ParamIDinIX): SqlBuilder {
        return new SqlIDinIX(this, param);
    }

    IDxID(param: ParamIDxID): SqlBuilder {
        return new SqlIDxID(this, param);
    }

    IDTree(param: ParamIDTree): SqlBuilder {
        return new SqlIDTree(this, param);
    }
}
