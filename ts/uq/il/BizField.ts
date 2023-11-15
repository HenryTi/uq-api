import {
    BBizField, DbContext
    , BBizFieldBud, BBizFieldField, BBizFieldJsonProp, BBizFieldBinVar, BBizFieldSheetBin, BBizFieldBinBud, BBizFieldSheetBud
} from "../builder";
import { BizBin } from "./Biz/Bin";
import { BizPhraseType } from "./Biz/BizPhraseType";
import { BizBud, BizBudValue } from "./Biz/Bud";
import { BizEntity } from "./Biz/Entity";
import { FromStatement, FromStatementInPend } from "./statement";

// in FROM statement, columns use BizField
// and in Where, BizField is used.
export abstract class BizField {
    readonly bizTable: BizTable;
    readonly name: string;
    space: BizFieldSpace;
    tbl: 'pend' | 'bin' | 'sheet' | 'sheetBin' | 'atom' | 'baseAtom';
    bud: BizBudValue;
    entity: BizEntity;
    constructor(bizTable: BizTable, name: string) {
        this.bizTable = bizTable;
        this.name = name;
    }
    abstract db(dbContext: DbContext): BBizField;
}

export class BizFieldBud extends BizField {
    constructor(bizTable: BizTable, bizBud: BizBudValue) {
        super(bizTable, bizBud.name);
        this.bud = bizBud;
    }
    override db(dbContext: DbContext): BBizField {
        return this.bizTable.dbBud(this, dbContext);
        // return new BBizFieldBud(dbContext, this);
    }
}

export class BizFieldField extends BizField {
    override db(dbContext: DbContext): BBizField {
        return this.bizTable.dbField(this, dbContext);
        // let ret = new BBizFieldField(dbContext, this);
        // return ret;
    }
}
/*
export class BizFieldJsonProp extends BizField {
    override db(dbContext: DbContext): BBizField {
        return new BBizFieldJsonProp(dbContext, this);
    }
}
*/
abstract class BizTable {
    protected readonly alias: string;
    protected readonly props: { [prop: string]: BizBudValue } = {};
    protected readonly fields: { [field: string]: boolean } = {};
    protected hasId: boolean;
    private inited: boolean;
    protected abstract get fieldArr(): string[];
    abstract get defaultFieldName(): string;
    constructor(alias: string, buds: Iterable<BizBudValue>) {
        this.alias = alias;
        this.hasId = true;
        if (buds !== undefined) {
            for (let bud of buds) this.props[bud.name] = bud;
        }
    }
    protected init() {
        let arr = this.fieldArr;
        if (arr !== undefined) {
            for (let fn of arr) {
                this.fields[fn] = true;
            }
        }
    }

    getBizField(name: string): BizField {
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

    dbBud(bizField: BizField, dbContext: DbContext): BBizField {
        return new BBizFieldBud(dbContext, bizField);
    }
    dbField(bizField: BizFieldField, dbContext: DbContext): BBizField {
        return new BBizFieldField(dbContext, bizField);
    }
}

const binFields = ['i', 'x', 'value', 'price', 'amount'];
class BizTableBin extends BizTable {
    protected readonly fieldArr = [...binFields];
    readonly defaultFieldName = 'bin';
    dbBud(bizField: BizField, dbContext: DbContext): BBizField {
        return new BBizFieldBinBud(dbContext, bizField);
    }
    dbField(bizField: BizFieldField, dbContext: DbContext): BBizField {
        return new BBizFieldBinVar(dbContext, bizField);
    }
}
class BizTableSheet extends BizTable {
    protected readonly fieldArr = ['no', ...binFields];
    readonly defaultFieldName = 's';
    dbBud(bizField: BizField, dbContext: DbContext): BBizField {
        return new BBizFieldSheetBud(dbContext, bizField);
    }
    dbField(bizField: BizFieldField, dbContext: DbContext): BBizField {
        return new BBizFieldSheetBin(dbContext, bizField);
    }
}
class BizTablePend extends BizTable {
    protected readonly fieldArr = [...binFields, 'pendvalue'];
    readonly defaultFieldName = 'pend';
    dbBud(bizField: BizField, dbContext: DbContext): BBizField {
        return new BBizFieldJsonProp(dbContext, bizField);
    }
}
class BizTableAtom extends BizTable {
    protected readonly fieldArr = ['no', 'ex'];
    readonly defaultFieldName = 'atom';
}
class BizTableSpec extends BizTable {
    protected readonly fieldArr = [];
    readonly defaultFieldName = 'spec';
}

export abstract class BizFieldSpace {
    private inited: boolean;
    defaultTable: BizTable;
    readonly tables: { [name: string]: BizTable } = {};

    protected init(): void {
    }

    getBizField(names: string[]): BizField {
        if (this.inited !== true) {
            this.init();
            this.inited = true;
        }
        let n0 = names[0];
        if (names.length === 1) {
            if (this.defaultTable === undefined) return undefined;
            let ret = this.defaultTable.getBizField(n0);
            if (ret !== undefined) return ret;
            let table = this.tables[n0];
            if (table !== undefined) {
                return table.getBizField(undefined);
            }
            return undefined;
        }
        else {
            let n1 = names[1];
            let table = this.tables[n0];
            if (table === undefined) return undefined;
            return table.getBizField(n1);
        }
    }
}

export abstract class FromFieldSpace extends BizFieldSpace {
    // protected readonly from: FromStatement
    /*
    override getBizField(name: string[]): BizField {
        return this.from.getBizField(name[0]);
    }
    */
}

export class FromInQueryFieldSpace extends FromFieldSpace {
    private readonly from: FromStatement;
    constructor(from: FromStatement) {
        super();
        this.from = from;
    }

    protected override init(): void {
        const { bizPhraseType, bizEntityArr } = this.from;
        let bizBuds: BizBudValue[] = [];
        for (let entity of bizEntityArr) {
            for (let [, p] of entity.props) {
                bizBuds.push(p);
            }
        }
        switch (bizPhraseType) {
            case BizPhraseType.atom:
                this.defaultTable = new BizTableAtom('a', bizBuds);
                break;
            case BizPhraseType.spec:
                this.defaultTable = new BizTableSpec('a', bizBuds);
                break;
        }
    }
}

export class FromInPendFieldSpace extends FromFieldSpace {
    private readonly from: FromStatementInPend;
    constructor(from: FromStatementInPend) {
        super();
        this.from = from;
    }

    protected init(): void {
        const { bizPend } = this.from.pendQuery;
        this.defaultTable = new BizTablePend('a', bizPend.props.values());
        this.tables['bin'] = new BizTableBin('b', bizPend.getBinProps());
        this.tables['sheet'] = new BizTableSheet('c', bizPend.getSheetProps());
    }
}

export class BizBinActFieldSpace extends BizFieldSpace {
    private readonly bizBin: BizBin
    constructor(bizBin: BizBin) {
        super();
        this.bizBin = bizBin;
    }

    protected override init(): void {
        this.defaultTable = new BizTableBin('bin', this.bizBin.props.values());
        this.tables['bin'] = this.defaultTable;
        this.tables['sheet'] = new BizTableSheet('sheet', this.bizBin.getSheetProps());
    }
}
