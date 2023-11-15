"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizBinActFieldSpace = exports.FromInPendFieldSpace = exports.FromInQueryFieldSpace = exports.FromFieldSpace = exports.BizFieldSpace = exports.BizFieldField = exports.BizFieldBud = exports.BizField = void 0;
const builder_1 = require("../builder");
const BizPhraseType_1 = require("./Biz/BizPhraseType");
// in FROM statement, columns use BizField
// and in Where, BizField is used.
class BizField {
    constructor(bizTable, name) {
        this.bizTable = bizTable;
        this.name = name;
    }
}
exports.BizField = BizField;
class BizFieldBud extends BizField {
    constructor(bizTable, bizBud) {
        super(bizTable, bizBud.name);
        this.bud = bizBud;
    }
    db(dbContext) {
        return this.bizTable.dbBud(this, dbContext);
        // return new BBizFieldBud(dbContext, this);
    }
}
exports.BizFieldBud = BizFieldBud;
class BizFieldField extends BizField {
    db(dbContext) {
        return this.bizTable.dbField(this, dbContext);
        // let ret = new BBizFieldField(dbContext, this);
        // return ret;
    }
}
exports.BizFieldField = BizFieldField;
/*
export class BizFieldJsonProp extends BizField {
    override db(dbContext: DbContext): BBizField {
        return new BBizFieldJsonProp(dbContext, this);
    }
}
*/
class BizTable {
    constructor(alias, buds) {
        this.props = {};
        this.fields = {};
        this.alias = alias;
        this.hasId = true;
        if (buds !== undefined) {
            for (let bud of buds)
                this.props[bud.name] = bud;
        }
    }
    init() {
        let arr = this.fieldArr;
        if (arr !== undefined) {
            for (let fn of arr) {
                this.fields[fn] = true;
            }
        }
    }
    getBizField(name) {
        if (this.inited !== true) {
            this.init();
            this.inited = true;
        }
        if (this.fields[name] === true) {
            return new BizFieldField(this, name);
        }
        let bud = this.props[name];
        if (bud !== undefined) {
            return new BizFieldBud(this, bud);
        }
        if (name === undefined && this.hasId === true) {
            return new BizFieldField(this, this.defaultFieldName);
        }
        return undefined;
    }
    dbBud(bizField, dbContext) {
        return new builder_1.BBizFieldBud(dbContext, bizField);
    }
    dbField(bizField, dbContext) {
        return new builder_1.BBizFieldField(dbContext, bizField);
    }
}
const binFields = ['i', 'x', 'value', 'price', 'amount'];
class BizTableBin extends BizTable {
    constructor() {
        super(...arguments);
        this.fieldArr = [...binFields];
        this.defaultFieldName = 'bin';
    }
    dbBud(bizField, dbContext) {
        return new builder_1.BBizFieldBinBud(dbContext, bizField);
    }
    dbField(bizField, dbContext) {
        return new builder_1.BBizFieldBinVar(dbContext, bizField);
    }
}
class BizTableSheet extends BizTable {
    constructor() {
        super(...arguments);
        this.fieldArr = ['no', ...binFields];
        this.defaultFieldName = 's';
    }
    dbBud(bizField, dbContext) {
        return new builder_1.BBizFieldSheetBud(dbContext, bizField);
    }
    dbField(bizField, dbContext) {
        return new builder_1.BBizFieldSheetBin(dbContext, bizField);
    }
}
class BizTablePend extends BizTable {
    constructor() {
        super(...arguments);
        this.fieldArr = [...binFields, 'pendvalue'];
        this.defaultFieldName = 'pend';
    }
    dbBud(bizField, dbContext) {
        return new builder_1.BBizFieldJsonProp(dbContext, bizField);
    }
}
class BizTableAtom extends BizTable {
    constructor() {
        super(...arguments);
        this.fieldArr = ['no', 'ex'];
        this.defaultFieldName = 'atom';
    }
}
class BizTableSpec extends BizTable {
    constructor() {
        super(...arguments);
        this.fieldArr = [];
        this.defaultFieldName = 'spec';
    }
}
class BizFieldSpace {
    constructor() {
        this.tables = {};
    }
    init() {
    }
    getBizField(names) {
        if (this.inited !== true) {
            this.init();
            this.inited = true;
        }
        let n0 = names[0];
        if (names.length === 1) {
            if (this.defaultTable === undefined)
                return undefined;
            let ret = this.defaultTable.getBizField(n0);
            if (ret !== undefined)
                return ret;
            let table = this.tables[n0];
            if (table !== undefined) {
                return table.getBizField(undefined);
            }
            return undefined;
        }
        else {
            let n1 = names[1];
            let table = this.tables[n0];
            if (table === undefined)
                return undefined;
            return table.getBizField(n1);
        }
    }
}
exports.BizFieldSpace = BizFieldSpace;
class FromFieldSpace extends BizFieldSpace {
}
exports.FromFieldSpace = FromFieldSpace;
class FromInQueryFieldSpace extends FromFieldSpace {
    constructor(from) {
        super();
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
                this.defaultTable = new BizTableAtom('a', bizBuds);
                break;
            case BizPhraseType_1.BizPhraseType.spec:
                this.defaultTable = new BizTableSpec('a', bizBuds);
                break;
        }
    }
}
exports.FromInQueryFieldSpace = FromInQueryFieldSpace;
class FromInPendFieldSpace extends FromFieldSpace {
    constructor(from) {
        super();
        this.from = from;
    }
    init() {
        const { bizPend } = this.from.pendQuery;
        this.defaultTable = new BizTablePend('a', bizPend.props.values());
        this.tables['bin'] = new BizTableBin('b', bizPend.getBinProps());
        this.tables['sheet'] = new BizTableSheet('c', bizPend.getSheetProps());
    }
}
exports.FromInPendFieldSpace = FromInPendFieldSpace;
class BizBinActFieldSpace extends BizFieldSpace {
    constructor(bizBin) {
        super();
        this.bizBin = bizBin;
    }
    init() {
        this.defaultTable = new BizTableBin('bin', this.bizBin.props.values());
        this.tables['bin'] = this.defaultTable;
        this.tables['sheet'] = new BizTableSheet('sheet', this.bizBin.getSheetProps());
    }
}
exports.BizBinActFieldSpace = BizBinActFieldSpace;
//# sourceMappingURL=BizField.js.map