"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizBinActFieldSpace = exports.FromInPendFieldSpace = exports.FromInQueryFieldSpace = exports.FromFieldSpace = exports.BizFieldSpace = exports.BizFieldUser = exports.BizFieldVar = exports.BizFieldJsonProp = exports.BizFieldField = exports.BizFieldBud = exports.BizField = void 0;
const builder_1 = require("../builder");
const BizPhraseType_1 = require("./Biz/BizPhraseType");
const consts_1 = require("../consts");
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
    scanBinDiv() { }
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
    buildSchema() { return [this.entity?.id, this.bud.id]; }
    buildColArr() {
        let ret = [];
        const { entity, bud } = this;
        if (entity !== undefined) {
            ret.push(new builder_1.ExpNum(entity.id));
        }
        ret.push(new builder_1.ExpNum(bud.id));
        return ret;
    }
    scanBinDiv() {
        const { bizPhraseType } = this.entity;
        if (bizPhraseType === BizPhraseType_1.BizPhraseType.bin) {
            let entityBin = this.entity;
            this.div = entityBin.getDivFromBud(this.bud);
            if (this.div === undefined)
                debugger;
        }
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
class BizFieldUser extends BizField {
    buildSchema() {
        return `%user.${this.tableAlias}`;
    }
    buildColArr() {
        return [new builder_1.ExpStr(`%user.${this.tableAlias}`)];
    }
    db(dbContext) {
        return this.space.createBFieldUser(dbContext, this);
    }
}
exports.BizFieldUser = BizFieldUser;
// col = field | bud;
var ColType;
(function (ColType) {
    ColType[ColType["bud"] = 0] = "bud";
    ColType[ColType["json"] = 1] = "json";
    ColType[ColType["var"] = 2] = "var";
})(ColType || (ColType = {}));
const atomFieldArr = ['id', 'no', 'ex'];
const specFieldArr = ['id'];
const duoFieldArr = ['id'];
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
    createBFieldUser(dbContext, bizField) {
        return new builder_1.BBizFieldUser(dbContext, bizField);
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
        const { fromEntity: { bizPhraseType, bizEntityArr } } = this.from;
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
                Object.assign(this.fields, FromInQueryFieldSpace.specCols);
                break;
            case BizPhraseType_1.BizPhraseType.duo:
                this.initBuds('$', bizEntityArr[0], bizBuds, 't1');
                Object.assign(this.fields, FromInQueryFieldSpace.duoCols);
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
FromInQueryFieldSpace.specCols = {
    $: [
        {
            names: specFieldArr,
            entity: undefined,
            buds: undefined,
            alias: 't1',
        },
    ]
};
FromInQueryFieldSpace.duoCols = {
    $: [
        {
            names: duoFieldArr,
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
    createBBud(dbContext, bizField) {
        let ret = super.createBBud(dbContext, bizField);
        ret.noArrayAgg = true;
        return ret;
    }
}
exports.FromInPendFieldSpace = FromInPendFieldSpace;
FromInPendFieldSpace.fields = {
    $: [
        {
            names: consts_1.binFieldArr,
            alias: 'b'
        },
    ],
    sheet: [
        {
            names: consts_1.binFieldArr,
            alias: 'e'
        },
    ],
    bin: [
        {
            names: consts_1.binFieldArr,
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
    get speceEntity() {
        return this.bizBin;
    }
    init() {
        this.initBuds('$', this.bizBin, this.bizBin.props.values(), 'bin', ColType.bud);
        this.initBuds('bin', this.bizBin, this.bizBin.props.values(), 'bin', ColType.bud);
        this.initBuds('sheet', this.bizBin.sheetArr[0].main, this.bizBin.getSheetProps(), 'sheet', ColType.bud);
    }
    createBBud(dbContext, bizField) {
        let ret = new builder_1.BBizFieldBinBud(dbContext, bizField);
        ret.noArrayAgg = true;
        return ret;
    }
}
exports.BizBinActFieldSpace = BizBinActFieldSpace;
BizBinActFieldSpace.fields = {
    '$': [
        {
            names: [...consts_1.binFieldArr, 'bin', 'sheet'],
            alias: '',
            colType: ColType.var,
        }
    ],
    bin: [
        {
            names: consts_1.binFieldArr,
            alias: '',
            colType: ColType.var,
        },
    ],
    sheet: [
        {
            names: consts_1.binFieldArr,
            alias: 's',
            colType: ColType.var,
        },
    ],
};
//# sourceMappingURL=BizField.js.map