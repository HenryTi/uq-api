"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizFromEntity = exports.EnumEntitySys = exports.BizNotID = exports.BizID = exports.BizEntity = exports.BudIndex = void 0;
const builder_1 = require("../../builder");
const EnumSysTable_1 = require("../EnumSysTable");
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
    get theEntity() {
        return this;
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
        if (this.user !== undefined) {
            ret.user = this.user.defaults.map(v => v.buildSchema(res));
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
        if (this.user !== undefined) {
            callback(this.user);
            for (let ub of this.user.defaults) {
                callback(ub);
            }
        }
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
        let ret = [];
        function pushRet(arr) {
            if (arr === undefined)
                return;
            ret.push(...arr);
        }
        if (this.showBuds !== undefined)
            pushRet(this.showBuds);
        this.forEachBud(v => {
            let shows = v.getFieldShows();
            if (shows === undefined)
                return;
            for (let s of shows)
                pushRet(s);
        });
        if (ret.length === 0)
            return;
        return ret;
    }
    internalCheckUserDefault(prop) {
        if (this.user === undefined)
            return false;
        const { defaults } = this.user;
        prop = ':user.' + prop;
        return (defaults.findIndex(v => v.name === prop) >= 0);
    }
    checkUserDefault(prop) {
        let ret = this.internalCheckUserDefault(prop);
        if (ret === true)
            return true;
        let bizConsole = this.biz.bizEntities.get('$console');
        if (bizConsole !== this) {
            return bizConsole.internalCheckUserDefault(prop);
        }
        return ret;
    }
    getEnumSysTable() {
        let bizEntityTable;
        switch (this.bizPhraseType) {
            default: break;
            case BizPhraseType_1.BizPhraseType.query: break;
            case BizPhraseType_1.BizPhraseType.atom:
                bizEntityTable = EnumSysTable_1.EnumSysTable.idu;
                break;
            case BizPhraseType_1.BizPhraseType.fork:
                bizEntityTable = EnumSysTable_1.EnumSysTable.idu;
                break;
            /*
            case BizPhraseType.duo:
                bizEntityTable = EnumSysTable.duo; break;
            */
            case BizPhraseType_1.BizPhraseType.bin:
                bizEntityTable = EnumSysTable_1.EnumSysTable.bizBin;
                break;
            case BizPhraseType_1.BizPhraseType.sheet:
                bizEntityTable = EnumSysTable_1.EnumSysTable.sheet;
                break;
            case BizPhraseType_1.BizPhraseType.pend:
                bizEntityTable = EnumSysTable_1.EnumSysTable.pend;
                break;
        }
        return bizEntityTable;
    }
}
exports.BizEntity = BizEntity;
class BizID extends BizEntity {
    constructor() {
        super(...arguments);
        this.isID = true;
    }
}
exports.BizID = BizID;
class BizNotID extends BizEntity {
    constructor() {
        super(...arguments);
        this.isID = false;
        this.fields = [];
    }
}
exports.BizNotID = BizNotID;
var EnumEntitySys;
(function (EnumEntitySys) {
    EnumEntitySys[EnumEntitySys["fork"] = 1] = "fork";
    EnumEntitySys[EnumEntitySys["bin"] = 2] = "bin";
})(EnumEntitySys || (exports.EnumEntitySys = EnumEntitySys = {}));
class BizFromEntity {
    constructor(parent) {
        this.bizEntityArr = [];
        this.ofIXs = [];
        this.parent = parent;
    }
    get isForkBase() {
        const { parent } = this;
        if (parent !== undefined) {
            // is fork base
            const { subs, bizEntityArr, bizPhraseType } = parent;
            if (subs.length === 1) {
                if (bizEntityArr.length === 0) {
                    return true;
                }
                if (bizPhraseType === BizPhraseType_1.BizPhraseType.fork) {
                    return true;
                }
            }
        }
        return false;
    }
    expIdCol() {
        const $idu = '$idu';
        const { parent } = this;
        if (this.isForkBase === true) {
            return new builder_1.ExpFunc('ifnull', new builder_1.ExpField('id', this.alias + $idu), new builder_1.ExpField('id', parent.alias + $idu));
        }
        switch (this.bizPhraseType) {
            default:
                return new builder_1.ExpField('id', this.alias);
            case BizPhraseType_1.BizPhraseType.atom:
            case BizPhraseType_1.BizPhraseType.fork:
                return new builder_1.ExpField('id', this.alias + $idu);
        }
    }
    isExtended() {
        let ret = false;
        if (this.bizPhraseType === BizPhraseType_1.BizPhraseType.atom) {
            for (let bizEntity of this.bizEntityArr) {
                const { extendeds } = bizEntity;
                if (extendeds !== undefined) {
                    ret = true;
                    break;
                }
            }
        }
        return ret;
    }
}
exports.BizFromEntity = BizFromEntity;
//# sourceMappingURL=Entity.js.map