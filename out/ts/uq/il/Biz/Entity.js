"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizEntity = exports.BudIndex = void 0;
const datatype_1 = require("../datatype");
const field_1 = require("../field");
const Base_1 = require("./Base");
const BizPhraseType_1 = require("./BizPhraseType");
const Bud_1 = require("./Bud");
var BudIndex;
(function (BudIndex) {
    BudIndex[BudIndex["none"] = 0] = "none";
    BudIndex[BudIndex["index"] = 1] = "index";
})(BudIndex || (exports.BudIndex = BudIndex = {}));
class BizEntity extends Base_1.BizBase {
    constructor(biz) {
        super(biz);
        this.props = new Map();
        this.budGroups = new Map();
        this.permissions = {};
        this.source = undefined;
        this.group0 = new Bud_1.BudGroup(biz, '-');
        this.group1 = new Bud_1.BudGroup(biz, '+');
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
        let hasGroup = false;
        let groups = [];
        this.forEachGroup((group) => {
            const { buds } = group;
            if (buds.length === 0)
                return;
            hasGroup = true;
            groups.push(group.buildSchema(res));
        });
        if (hasGroup === true) {
            groups.push(this.group0.buildSchema(res));
            ret.groups = groups;
        }
        this.schema = ret;
        return ret;
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
        this.group1.buildPhrases(phrases, phrase);
        for (let [, group] of this.budGroups) {
            group.buildPhrases(phrases, phrase);
        }
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
            case BizPhraseType_1.BudDataType.int:
            case BizPhraseType_1.BudDataType.ID:
                fieldDataType = new datatype_1.BigInt();
                break;
            case BizPhraseType_1.BudDataType.date:
                fieldDataType = new datatype_1.DDate();
                break;
            case BizPhraseType_1.BudDataType.dec:
                fieldDataType = new datatype_1.Dec(20, 6);
                break;
            case BizPhraseType_1.BudDataType.char:
                fieldDataType = new datatype_1.Char(50);
                break;
        }
        field.dataType = fieldDataType;
        return field;
    }
    ixFieldSchema(tieField) {
        const { caption, atoms } = tieField;
        let ret = {
            caption,
            atoms: atoms === null || atoms === void 0 ? void 0 : atoms.map(v => v.id),
        };
        return ret;
    }
    getBud(name) {
        let bud = this.props.get(name);
        return bud;
    }
    forEachBud(callback) {
        for (let [, bud] of this.props)
            callback(bud);
    }
    forEachGroup(callback) {
        callback(this.group1);
        for (let [, group] of this.budGroups) {
            callback(group);
        }
    }
    db(dbContext) {
        return undefined;
    }
    allShowBuds() {
        let has = this.showBuds !== undefined;
        let ret = { ...this.showBuds };
        let n = 0;
        this.forEachBud(v => {
            let shows = v.getFieldShows();
            if (shows === undefined)
                return;
            has = true;
            for (let show of shows)
                ret[v.name + '.' + n++] = show;
        });
        if (has === true)
            return ret;
    }
}
exports.BizEntity = BizEntity;
//# sourceMappingURL=Entity.js.map