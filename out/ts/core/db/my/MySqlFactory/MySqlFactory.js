"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlFactory = void 0;
const SqlFactory_1 = require("../../SqlFactory");
// import { Builder, ISqlBuilder } from "../Builder";
const SqlActDetail_1 = require("./SqlActDetail");
const SqlActIX_1 = require("./SqlActIX");
const SqlActID_1 = require("./SqlActID");
const SqlActs_1 = require("./SqlActs");
const SqlKeyID_1 = require("./SqlKeyID");
const SqlID_1 = require("./SqlID");
const SqlIDDetail_1 = require("./SqlIDDetail");
const SqlIDNO_1 = require("./SqlIDNO");
const SqlIX_1 = require("./SqlIX");
const SqlIXr_1 = require("./SqlIXr");
const SqlIDLog_1 = require("./SqlIDLog");
const SqlIDTree_1 = require("./SqlIDTree");
const SqlIDxID_1 = require("./SqlIDxID");
const SqlIDinIX_1 = require("./SqlIDinIX");
const SqlKeyIX_1 = require("./SqlKeyIX");
const SqlIDSum_1 = require("./SqlIDSum");
const SqlKeyIXSum_1 = require("./SqlKeyIXSum");
const SqlIXSum_1 = require("./SqlIXSum");
const SqlKeyIDSum_1 = require("./SqlKeyIDSum");
const SqlActIXSort_1 = require("./SqlActIXSort");
const SqlQueryID_1 = require("./SqlQueryID");
const SqlIDTv_1 = require("./SqlIDTv");
const SqlIXValues_1 = require("./SqlIXValues");
class MySqlFactory extends SqlFactory_1.SqlFactory {
    Acts(param) {
        return new SqlActs_1.SqlActs(this, param);
    }
    ActIX(param) {
        return new SqlActIX_1.SqlActIX(this, param);
    }
    ActIXSort(param) {
        return new SqlActIXSort_1.SqlActIXSort(this, param);
    }
    ActID(param) {
        return new SqlActID_1.SqlActID(this, param);
    }
    ActDetail(param) {
        return new SqlActDetail_1.SqlActDetail(this, param);
    }
    QueryID(param) {
        return new SqlQueryID_1.SqlQueryID(this, param);
    }
    IDNO(param) {
        return new SqlIDNO_1.SqlIDNO(this, param);
    }
    IDDetailGet(param) {
        return new SqlIDDetail_1.SqlIDDetail(this, param);
    }
    ID(param) {
        return new SqlID_1.SqlID(this, param);
    }
    idTypes(id) {
        return new SqlID_1.SqlIdTypes(this, id);
    }
    IDTv(ids) {
        return new SqlIDTv_1.SqlIDTv(this, ids);
    }
    KeyID(param) {
        return new SqlKeyID_1.SqlKeyID(this, param);
    }
    IX(param) {
        return new SqlIX_1.SqlIX(this, param);
    }
    IXr(param) {
        return new SqlIXr_1.SqlIXr(this, param);
    }
    IXValues(param) {
        return new SqlIXValues_1.SqlIXValues(this, param);
    }
    KeyIX(param) {
        return new SqlKeyIX_1.SqlKeyIX(this, param);
    }
    IDLog(param) {
        return new SqlIDLog_1.SqlIDLog(this, param);
    }
    IDSum(param) {
        return new SqlIDSum_1.SqlIDSum(this, param);
    }
    KeyIDSum(param) {
        return new SqlKeyIDSum_1.SqlKeyIDSum(this, param);
    }
    IXSum(param) {
        return new SqlIXSum_1.SqlIXSum(this, param);
    }
    KeyIXSum(param) {
        return new SqlKeyIXSum_1.SqlKeyIXSum(this, param);
    }
    IDinIX(param) {
        return new SqlIDinIX_1.SqlIDinIX(this, param);
    }
    IDxID(param) {
        return new SqlIDxID_1.SqlIDxID(this, param);
    }
    IDTree(param) {
        return new SqlIDTree_1.SqlIDTree(this, param);
    }
}
exports.MySqlFactory = MySqlFactory;
//# sourceMappingURL=MySqlFactory.js.map