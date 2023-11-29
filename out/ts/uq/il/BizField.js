"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizBinActFieldSpace = exports.FromInPendFieldSpace = exports.FromInQueryFieldSpace = exports.FromFieldSpace = exports.BizFieldSpace = exports.BizFieldVar = exports.BizFieldJsonProp = exports.BizFieldField = exports.BizFieldBud = exports.BizField = void 0;
const builder_1 = require("../builder");
const BizPhraseType_1 = require("./Biz/BizPhraseType");
// in FROM statement, columns use BizField
// and in Where, BizField is used.
class BizField {
    constructor(space, tableAlias) {
        this.space = space;
        this.tableAlias = tableAlias;
    }
    getBud() {
        return undefined;
    }
}
exports.BizField = BizField;
class BizFieldBud extends BizField {
    constructor(space, tableAlias, entity, bud) {
        super(space, tableAlias);
        this.entity = entity;
        this.bud = bud;
    }
    getBud() {
        return this.bud;
    }
    db(dbContext) {
        return this.space.createBBud(dbContext, this);
    }
    buildSchema() { var _a; return [(_a = this.entity) === null || _a === void 0 ? void 0 : _a.id, this.bud.id]; }
    buildColArr() {
        let ret = [];
        const { entity, bud } = this;
        if (entity !== undefined) {
            ret.push(new builder_1.ExpNum(entity.id));
        }
        ret.push(new builder_1.ExpNum(bud.id));
        return ret;
    }
}
exports.BizFieldBud = BizFieldBud;
class BizFieldField extends BizField {
    constructor(space, tableAlias, name) {
        super(space, tableAlias);
        this.name = name;
    }
    db(dbContext) {
        return this.space.createBField(dbContext, this);
    }
    buildSchema() { return []; }
    buildColArr() {
        return [new builder_1.ExpStr(this.name)];
    }
}
exports.BizFieldField = BizFieldField;
class BizFieldJsonProp extends BizFieldBud {
    db(dbContext) {
        return this.space.createBJson(dbContext, this);
    }
}
exports.BizFieldJsonProp = BizFieldJsonProp;
class BizFieldVar extends BizFieldField {
    db(dbContext) {
        return this.space.createBVar(dbContext, this);
    }
}
exports.BizFieldVar = BizFieldVar;
// col = field | bud;
var ColType;
(function (ColType) {
    ColType[ColType["bud"] = 0] = "bud";
    ColType[ColType["json"] = 1] = "json";
    ColType[ColType["var"] = 2] = "var";
})(ColType || (ColType = {}));
const binFieldArr = ['i', 'x', 'value', 'price', 'amount'];
const sheetFieldArr = ['no'];
const atomFieldArr = ['id', 'no', 'ex'];
const pendFieldArr = ['pendvalue'];
class BizFieldSpace {
    constructor() {
        this.buds = {};
    }
    init() {
    }
    arrFromBuds(buds) {
        let ret = [];
        for (let bud of buds)
            ret.push(bud);
        return ret;
    }
    initBuds(table, entity, buds, alias, colType = ColType.bud) {
        let cols = this.buds[table];
        if (cols === undefined) {
            cols = [];
            this.buds[table] = cols;
        }
        cols.push({
            names: undefined,
            entity,
            buds: this.arrFromBuds(buds),
            alias,
            colType,
        });
    }
    getBizField(names) {
        if (this.inited !== true) {
            this.init();
            this.inited = true;
        }
        let n0 = names[0];
        let n1;
        if (names.length === 1) {
            n1 = n0;
            n0 = '$';
        }
        else {
            n1 = names[1];
        }
        let ret = this.buildBizField(this.fields, n0, n1);
        if (ret === undefined) {
            ret = this.buildBizField(this.buds, n0, n1);
            if (ret === undefined)
                return;
        }
        return ret;
    }
    buildBizField(tableCols, n0, n1) {
        let colsList = tableCols[n0];
        if (colsList === undefined)
            return;
        let foundCols;
        let foundBud;
        for (let cols of colsList) {
            const { names, buds } = cols;
            if (names !== undefined) {
                if (names.includes(n1) === true) {
                    foundCols = cols;
                    break;
                }
            }
            else {
                foundBud = buds.find(v => v.name === n1);
                if (foundBud !== undefined) {
                    foundCols = cols;
                    break;
                }
            }
        }
        if (foundCols === undefined)
            return;
        const { alias, entity, colType } = foundCols;
        switch (colType) {
            default: return new BizFieldField(this, alias, n1);
            case ColType.bud: return new BizFieldBud(this, alias, entity, foundBud);
            case ColType.json: return new BizFieldJsonProp(this, alias, entity, foundBud);
            case ColType.var: return new BizFieldVar(this, alias, n1);
            // case ColType.sheetBud: return new BizFieldSheetBud(this, alias, entity, foundBud);
        }
    }
    createBField(dbContext, bizField) {
        return new builder_1.BBizFieldField(dbContext, bizField);
    }
    createBBud(dbContext, bizField) {
        return new builder_1.BBizFieldBud(dbContext, bizField);
    }
    createBVar(dbContext, bizField) {
        return new builder_1.BBizFieldBinVar(dbContext, bizField);
    }
    createBJson(dbContext, bizField) {
        return new builder_1.BBizFieldJsonProp(dbContext, bizField);
    }
}
exports.BizFieldSpace = BizFieldSpace;
class FromFieldSpace extends BizFieldSpace {
}
exports.FromFieldSpace = FromFieldSpace;
class FromInQueryFieldSpace extends FromFieldSpace {
    constructor(from) {
        super();
        this.fields = {};
        this.from = from;
    }
    init() {
        const { bizPhraseType, bizEntityArr } = this.from;
        let bizBuds = [];
        for (let entity of bizEntityArr) {
            for (let [, p] of entity.props) {
                bizBuds.push(p);
            }
        }
        switch (bizPhraseType) {
            case BizPhraseType_1.BizPhraseType.atom:
                this.initBuds('$', bizEntityArr[0], bizBuds, 't1');
                Object.assign(this.fields, FromInQueryFieldSpace.atomCols);
                break;
            case BizPhraseType_1.BizPhraseType.spec:
                this.initBuds('$', bizEntityArr[0], bizBuds, 't1');
                break;
        }
    }
}
exports.FromInQueryFieldSpace = FromInQueryFieldSpace;
FromInQueryFieldSpace.atomCols = {
    $: [
        {
            names: atomFieldArr,
            entity: undefined,
            buds: undefined,
            alias: 't1',
        },
    ]
};
class FromInPendFieldSpace extends FromFieldSpace {
    constructor(from) {
        super();
        this.fields = FromInPendFieldSpace.fields;
        this.from = from;
    }
    init() {
        const { bizPend } = this.from.pendQuery;
        this.initBuds('$', bizPend, bizPend.props.values(), 'a', ColType.json);
        this.initBuds('bin', undefined, bizPend.getBinProps(), 'b');
        this.initBuds('sheet', undefined, bizPend.getSheetProps(), 'e');
    }
}
exports.FromInPendFieldSpace = FromInPendFieldSpace;
FromInPendFieldSpace.fields = {
    $: [
        {
            names: binFieldArr,
            alias: 'b'
        },
    ],
    sheet: [
        {
            names: binFieldArr,
            alias: 'e'
        },
    ],
    bin: [
        {
            names: binFieldArr,
            alias: 'b'
        },
    ],
};
class BizBinActFieldSpace extends BizFieldSpace {
    constructor(bizBin) {
        super();
        this.fields = BizBinActFieldSpace.fields;
        this.bizBin = bizBin;
    }
    init() {
        this.initBuds('$', this.bizBin, this.bizBin.props.values(), 'bin', ColType.bud);
        this.initBuds('bin', this.bizBin, this.bizBin.props.values(), 'bin', ColType.bud);
        this.initBuds('sheet', this.bizBin.sheetArr[0], this.bizBin.getSheetProps(), 'sheet', ColType.bud);
    }
    createBBud(dbContext, bizField) {
        return new builder_1.BBizFieldBinBud(dbContext, bizField);
    }
}
exports.BizBinActFieldSpace = BizBinActFieldSpace;
BizBinActFieldSpace.fields = {
    '$': [
        {
            names: [...binFieldArr, 'bin', 'sheet'],
            alias: '',
            colType: ColType.var,
        }
    ],
    bin: [
        {
            names: binFieldArr,
            alias: '',
            colType: ColType.var,
        },
    ],
    sheet: [
        {
            names: binFieldArr,
            alias: 's',
            colType: ColType.var,
        },
    ]
};
//# sourceMappingURL=BizField.js.map