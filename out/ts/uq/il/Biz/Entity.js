"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizEntity = exports.BudFlag = void 0;
const datatype_1 = require("../datatype");
const field_1 = require("../field");
const Base_1 = require("./Base");
var BudFlag;
(function (BudFlag) {
    BudFlag[BudFlag["none"] = 0] = "none";
    BudFlag[BudFlag["index"] = 1] = "index";
})(BudFlag = exports.BudFlag || (exports.BudFlag = {}));
class BizEntity extends Base_1.BizBase {
    constructor(biz) {
        super();
        this.props = new Map();
        this.source = undefined;
        this.biz = biz;
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        let props = []; //, assigns = [];
        for (let [, value] of this.props) {
            props.push(value.buildSchema(res));
        }
        if (props.length > 0) {
            Object.assign(ret, { props });
        }
        return ret;
    }
    checkName(name) {
        if (super.checkName(name) === false)
            return false;
        if (this.props.has(name) === true)
            return false;
        return true; // this.assigns.has(name) === false;
    }
    buildPhrase(prefix) {
        this.phrase = this.name;
    }
    buildPhrases(phrases, prefix) {
        super.buildPhrases(phrases, prefix);
        let phrase = this.phrase;
        for (let [, value] of this.props) {
            value.buildPhrases(phrases, phrase);
        }
    }
    getBizBase1(bizName) {
        let ret = super.getBizBase1(bizName);
        if (ret !== undefined)
            return ret;
        ret = this.props.get(bizName);
        if (ret !== undefined)
            return ret;
        //ret = this.assigns.get(bizName);
        // if (ret !== undefined) return ret;
    }
    getBizBase(bizName) {
        let ret = super.getBizBase(bizName);
        if (ret !== undefined)
            return ret;
        let { bizEntities: bizes } = this.biz;
        let [n0] = bizName;
        ret = bizes.get(n0);
        if (ret === undefined) {
            throw Error('not found');
        }
        ;
        return ret.getBizBase(bizName);
    }
    buildField(bud) {
        let { name, dataType } = bud;
        let field = new field_1.Field();
        field.name = name;
        let fieldDataType;
        switch (dataType) {
            default:
                debugger;
                throw new Error(`unknown BizBud ${dataType}`);
            case Base_1.BudDataType.int:
            case Base_1.BudDataType.ID:
                fieldDataType = new datatype_1.BigInt();
                break;
            case Base_1.BudDataType.date:
                fieldDataType = new datatype_1.DDate();
                break;
            case Base_1.BudDataType.dec:
                fieldDataType = new datatype_1.Dec(20, 6);
                break;
            case Base_1.BudDataType.char:
                fieldDataType = new datatype_1.Char(50);
                break;
        }
        field.dataType = fieldDataType;
        return field;
    }
    // buildFields() { }
    getBud(name) {
        let bud = this.props.get(name);
        // if (bud !== undefined) return bud;
        // bud = this.assigns.get(name);
        return bud;
    }
    getAllBuds() {
        let buds = [];
        for (let [, bud] of this.props)
            buds.push(bud);
        return buds;
    }
    db(dbContext) {
        return undefined;
    }
}
exports.BizEntity = BizEntity;
//# sourceMappingURL=Entity.js.map