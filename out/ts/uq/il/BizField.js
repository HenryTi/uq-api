"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizBinActFieldSpace = exports.FromInPendFieldSpace = exports.FromInQueryFieldSpace = exports.FromEntityFieldSpace = exports.BizFieldSpace = exports.BizFieldUser = exports.BizFieldVar = exports.BizFieldJsonProp = exports.BizFieldField = exports.BizFieldBud = exports.BizField = void 0;
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
    // abstract buildColArr(): ExpVal[];
    scanBinDiv() { }
}
exports.BizField = BizField;
class BizFieldBud extends BizField {
    constructor(space, tableAlias, bud) {
        super(space, tableAlias);
        // this.entity = entity;
        if (bud === undefined)
            debugger;
        this.bud = bud;
    }
    getBud() {
        return this.bud;
    }
    db(dbContext) {
        let ret = new builder_1.BBizFieldBud(dbContext, this);
        ret.noArrayAgg = this.space.bBudNoArrayAgg;
        return ret;
    }
    buildSchema() { var _a; return [(_a = this.bud.entity) === null || _a === void 0 ? void 0 : _a.id, this.bud.id]; }
    /*
    override buildColArr(): ExpVal[] {
        let ret: ExpVal[] = [];
        const { bud } = this;
        const { entity } = bud;
        if (entity !== undefined) {
            ret.push(new ExpNum(entity.id));
        }
        ret.push(new ExpNum(bud.id));
        return ret;
    }
    */
    scanBinDiv() {
        const { entity } = this.bud;
        const { bizPhraseType } = entity;
        if (bizPhraseType === BizPhraseType_1.BizPhraseType.bin) {
            let entityBin = entity;
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
        return new builder_1.BBizFieldField(dbContext, this);
        // return this.space.createBField(dbContext, this);
    }
    buildSchema() { return []; }
}
exports.BizFieldField = BizFieldField;
class BizFieldJsonProp extends BizFieldBud {
    db(dbContext) {
        return new builder_1.BBizFieldJsonProp(dbContext, this);
        // return this.space.createBJson(dbContext, this);
    }
}
exports.BizFieldJsonProp = BizFieldJsonProp;
class BizFieldVar extends BizFieldField {
    db(dbContext) {
        return new builder_1.BBizFieldBinVar(dbContext, this);
        // return this.space.createBVar(dbContext, this);
    }
}
exports.BizFieldVar = BizFieldVar;
class BizFieldUser extends BizField {
    buildSchema() {
        return `%user.${this.tableAlias}`;
    }
    /*
    override buildColArr(): ExpVal[] {
        return [new ExpStr(`%user.${this.tableAlias}`)];
    }
    */
    db(dbContext) {
        return new builder_1.BBizFieldUser(dbContext, this);
        // return this.space.createBFieldUser(dbContext, this);
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
;
;
class BizFieldSpace {
    constructor() {
        this.nameBizFields = {};
        this.nameNameBizFields = {};
        /*
        private buildBizFieldOld(tableCols: TableCols, n0: string, n1: string): BizField {
            let colsList = tableCols[n0];
            if (colsList === undefined) return;
            let foundCols: Cols;
            let foundBud: BizBud;
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
            if (foundCols === undefined) return;
            const { alias, entity, colType } = foundCols;
            switch (colType) {
                default: return new BizFieldField(this, alias, n1);
                case ColType.bud: return new BizFieldBud(this, alias, entity, foundBud);
                case ColType.json: return new BizFieldJsonProp(this, alias, entity, foundBud);
                case ColType.var: return new BizFieldVar(this, alias, n1);
            }
        }
        */
        /*
        createBField(dbContext: DbContext, bizField: BizFieldField): BBizField {
            return new BBizFieldField(dbContext, bizField);
        }
        createBBud(dbContext: DbContext, bizField: BizFieldBud): BBizField {
            return new BBizFieldBud(dbContext, bizField);
        }
        createBVar(dbContext: DbContext, bizField: BizFieldVar): BBizField {
            return new BBizFieldBinVar(dbContext, bizField);
        }
        createBJson(dbContext: DbContext, bizField: BizFieldJsonProp): BBizField {
            return new BBizFieldJsonProp(dbContext, bizField);
        }
        createBFieldUser(dbContext: DbContext, bizField: BizFieldUser): BBizField {
            return new BBizFieldUser(dbContext, bizField);
        }
        */
    }
    // private inited: boolean;
    // protected abstract get fields(): TableCols;
    // protected readonly buds: TableCols = {};
    get bBudNoArrayAgg() { return; }
    /*
    private arrFromBuds(buds: Iterable<BizBud>): BizBud[] {
        let ret: BizBud[] = [];
        for (let bud of buds) ret.push(bud);
        return ret;
    }

    protected initBuds(table: string, entity: BizEntity, buds: Iterable<BizBud>, alias: string, colType: ColType = ColType.bud) {
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
    */
    getBizField(names) {
        /*
        if (this.inited !== true) {
            this.init();
            this.inited = true;
        }
        */
        let n0 = names[0];
        switch (names.length) {
            default:
                debugger;
                throw Error('error names');
            case 1: return this.bizFieldFromSolo(n0);
            case 2: return this.bizFieldFromDuo(n0, names[1]);
        }
        /*
        let n1: string;
        if (names.length === 1) {
            n1 = n0;
            n0 = '$';
        }
        else {
            n1 = names[1];
        }
        let bizField: BizField;
        let nameBizFields = this.nameNameBizFields[n0];
        if (nameBizFields === undefined) {
            nameBizFields = {};
            this.nameNameBizFields[n0] = nameBizFields;
        }
        else {
            bizField = nameBizFields[n1];
        }
        if (bizField !== undefined) return bizField;

        bizField = this.buildBizField(n0, n1);
        if (bizField !== undefined) {
            nameBizFields[n1] = bizField;
            return bizField;
        }
        */
    }
    bizFieldFromSolo(name) {
        let bizField = this.nameBizFields[name];
        if (bizField !== undefined)
            return bizField;
        bizField = this.buildBizFieldFromSolo(name);
        if (bizField === null)
            return null;
        if (bizField !== undefined) {
            this.nameBizFields[name] = bizField;
        }
        return bizField;
    }
    buildBizFieldFromSolo(name) {
        return this.buildBizFieldFromDuo('$t1', name);
    }
    bizFieldFromDuo(n0, n1) {
        let bizField;
        let nameBizFields = this.nameNameBizFields[n0];
        if (nameBizFields === undefined) {
            nameBizFields = {};
            this.nameNameBizFields[n0] = nameBizFields;
        }
        else {
            bizField = nameBizFields[n1];
        }
        if (bizField !== undefined)
            return bizField;
        bizField = this.buildBizFieldFromDuo(n0, n1);
        if (bizField !== undefined) {
            nameBizFields[n1] = bizField;
            return bizField;
        }
    }
}
exports.BizFieldSpace = BizFieldSpace;
class FromEntityFieldSpace extends BizFieldSpace {
    constructor(from) {
        super();
        this.from = from;
        // this.init();
    }
    // protected abstract init(): void;
    buildBizFieldFromDuo(n0, n1) {
        let bizEntityFrom = this.from.getBizEntityFromAlias(n0);
        if (bizEntityFrom === undefined)
            return undefined;
        const { alias, bizEntityArr } = bizEntityFrom;
        for (let bizEntity of bizEntityArr) {
            if (bizEntity.hasField(n1) === true) {
                return new BizFieldField(this, alias, n1);
            }
            let bud = bizEntity.props.get(n1);
            if (bud !== undefined) {
                // return this.buildBizFieldFromBud(alias, bud);
                return new BizFieldBud(this, alias, bud);
            }
        }
        return new BizFieldVar(this, alias, n1);
        /*
        switch (colType) {
            default: return new BizFieldField(this, alias, n1);
            case ColType.bud: return new BizFieldBud(this, alias, entity, foundBud);
            case ColType.json: return new BizFieldJsonProp(this, alias, entity, foundBud);
            case ColType.var: return new BizFieldVar(this, alias, n1);
        }
        */
    }
}
exports.FromEntityFieldSpace = FromEntityFieldSpace;
class FromInQueryFieldSpace extends FromEntityFieldSpace {
}
exports.FromInQueryFieldSpace = FromInQueryFieldSpace;
class FromInPendFieldSpace extends FromEntityFieldSpace {
    /*
    private static fields: TableCols = {
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
    protected readonly fields: TableCols = FromInPendFieldSpace.fields;
    */
    get bBudNoArrayAgg() { return true; }
    /*
    protected override init(): void {
        const { bizPend } = this.from.pendQuery;
        this.initBuds('$', bizPend, bizPend.props.values(), 'a', ColType.json);
        this.initBuds('bin', undefined, bizPend.getBinProps(), 'b');
        this.initBuds('sheet', undefined, bizPend.getSheetProps(), 'e');
    }
    */
    /*
    override createBBud(dbContext: DbContext, bizField: BizFieldBud): BBizField {
        let ret = super.createBBud(dbContext, bizField);
        ret.noArrayAgg = true;
        return ret;
    }
    */
    buildBizFieldFromDuo(n0, n1) {
        const { bizPend } = this.from.pendQuery;
        let alias, bud;
        switch (n0) {
            default: return undefined;
            case '$t1':
            case '$':
                bud = bizPend.getBud(n1);
                alias = 'a';
                return new BizFieldJsonProp(this, alias, bud);
            case 'bin':
                bud = bizPend.getBinBud(n1);
                alias = 'b';
                break;
            case 'sheet':
                bud = bizPend.getSheetBud(n1);
                alias = 'c';
                break;
        }
        if (bud === undefined)
            debugger;
        return new BizFieldBud(this, alias, bud);
    }
}
exports.FromInPendFieldSpace = FromInPendFieldSpace;
class BizBinActFieldSpace extends BizFieldSpace {
    // protected readonly fields: TableCols = BizBinActFieldSpace.fields;
    constructor(bizBin) {
        super();
        this.bizBin = bizBin;
        // this.initW();
    }
    /*
    get speceEntity(): BizEntity {
        return this.bizBin;
    }
    */
    get bBudNoArrayAgg() { return true; }
    /*
    private initW(): void {
        this.initBuds('$', this.bizBin, this.bizBin.props.values(), 'bin', ColType.bud);
        this.initBuds('bin', this.bizBin, this.bizBin.props.values(), 'bin', ColType.bud);
        this.initBuds('sheet', this.bizBin.sheetArr[0].main, this.bizBin.getSheetProps(), 'sheet', ColType.bud);
    }
    */
    /*
    override createBBud(dbContext: DbContext, bizField: BizFieldBud): BBizField {
        let ret = new BBizFieldBinBud(dbContext, bizField);
        ret.noArrayAgg = true;
        return ret;
    }
    */
    buildBizFieldFromDuo(n0, n1) {
        let alias, bud;
        switch (n0) {
            default: return undefined;
            case '$t1':
            case '$':
                bud = this.bizBin.getBud(n1);
                alias = 'bin';
                break;
            case 'bin':
                bud = this.bizBin.getBud(n1);
                alias = 'b';
                break;
            case 'sheet':
                bud = this.bizBin.getSheetBud(n1);
                if (bud === undefined) {
                    debugger;
                    bud = this.bizBin.getSheetBud(n1);
                }
                alias = 'sheet';
                break;
        }
        if (bud === undefined)
            debugger;
        return new BizFieldBud(this, alias, bud);
    }
}
exports.BizBinActFieldSpace = BizBinActFieldSpace;
//# sourceMappingURL=BizField.js.map