"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizEntity = exports.BudIndex = void 0;
const datatype_1 = require("../datatype");
const field_1 = require("../field");
const Base_1 = require("./Base");
var BudIndex;
(function (BudIndex) {
    BudIndex[BudIndex["none"] = 0] = "none";
    BudIndex[BudIndex["index"] = 1] = "index";
})(BudIndex = exports.BudIndex || (exports.BudIndex = {}));
class BizEntity extends Base_1.BizBase {
    constructor() {
        super(...arguments);
        this.props = new Map();
        this.permissions = {};
        this.source = undefined;
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        if (this.props.size > 0) {
            let props = [];
            for (let [, value] of this.props) {
                props.push(value.buildSchema(res));
            }
            Object.assign(ret, { props });
        }
        return ret;
    }
    okToDefineNewName(name) {
        if (super.okToDefineNewName(name) === false)
            return false;
        let bud = this.props.get(name.toLowerCase());
        return (bud === undefined);
    }
    hasField(fieldName) {
        return this.fields.includes(fieldName);
    }
    buildPhrase(prefix) {
        this.phrase = this.name;
    }
    buildPhrases(phrases, prefix) {
        super.buildPhrases(phrases, prefix);
        let phrase = this.phrase;
        this.forEachBud(bud => {
            bud.buildPhrases(phrases, phrase);
        });
    }
    buildIxRoles(ixRoles) {
        for (let role in this.permissions) {
            let bizRole = role === '*' ? undefined : this.biz.bizEntities.get(role);
            // if (bizRole === undefined) debugger;
            this.setIxRoles(ixRoles, bizRole, this.permissions[role]);
        }
    }
    setIxRoles(ixRoles, bizRole, permission) {
        let { a, c, r, u, d, l } = permission;
        let x;
        if (bizRole === undefined) {
            x = -1;
        }
        else {
            x = bizRole.id;
            for (let [, r] of bizRole.roles) {
                this.setIxRoles(ixRoles, r, permission);
            }
        }
        let item = [
            this.id,
            x,
            a === true ? 1 : 0,
            c === true ? 1 : 0,
            r === true ? 1 : 0,
            u === true ? 1 : 0,
            d === true ? 1 : 0,
            l === true ? 1 : 0,
        ];
        ixRoles.push(item);
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
    getBud(name) {
        let bud = this.props.get(name);
        return bud;
    }
    forEachBud(callback) {
        for (let [, bud] of this.props)
            callback(bud);
    }
    db(dbContext) {
        return undefined;
    }
}
exports.BizEntity = BizEntity;
//# sourceMappingURL=Entity.js.map