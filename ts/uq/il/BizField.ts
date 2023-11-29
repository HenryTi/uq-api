import {
    BBizField, DbContext
    , BBizFieldBud, BBizFieldField, BBizFieldJsonProp, BBizFieldBinVar, BBizFieldBinBud,// , BBizFieldSheetBud
    ExpVal,
    ExpStr,
    ExpNum
} from "../builder";
import { BizBin } from "./Biz/Bin";
import { BizPhraseType } from "./Biz/BizPhraseType";
import { BizBud, BizBudValue } from "./Biz/Bud";
import { BizEntity } from "./Biz/Entity";
import { FromStatement, FromStatementInPend } from "./statement";

// in FROM statement, columns use BizField
// and in Where, BizField is used.
export abstract class BizField {
    readonly space: BizFieldSpace;
    readonly tableAlias: string;
    constructor(space: BizFieldSpace, tableAlias: string) {
        this.space = space;
        this.tableAlias = tableAlias;
    }
    getBud(): BizBudValue {
        return undefined;
    }
    abstract db(dbContext: DbContext): BBizField;
    abstract buildSchema(): any;
    abstract buildColArr(): ExpVal[];
}

export class BizFieldBud extends BizField {
    bud: BizBudValue;
    entity: BizEntity;
    constructor(space: BizFieldSpace, tableAlias: string, entity: BizEntity, bud: BizBudValue) {
        super(space, tableAlias);
        this.entity = entity;
        this.bud = bud;
    }
    override getBud(): BizBudValue {
        return this.bud;
    }
    override db(dbContext: DbContext): BBizField {
        return this.space.createBBud(dbContext, this);
    }
    buildSchema() { return [this.entity?.id, this.bud.id]; }

    override buildColArr(): ExpVal[] {
        let ret: ExpVal[] = [];
        const { entity, bud } = this;
        if (entity !== undefined) {
            ret.push(new ExpNum(entity.id));
        }
        ret.push(new ExpNum(bud.id));
        return ret;
    }
}

export class BizFieldField extends BizField {
    readonly name: string;
    constructor(space: BizFieldSpace, tableAlias: string, name: string) {
        super(space, tableAlias);
        this.name = name;
    }
    override db(dbContext: DbContext): BBizField {
        return this.space.createBField(dbContext, this);
    }
    buildSchema() { return []; }
    override buildColArr(): ExpVal[] {
        return [new ExpStr(this.name)];
    }
}

export class BizFieldJsonProp extends BizFieldBud {
    override db(dbContext: DbContext): BBizField {
        return this.space.createBJson(dbContext, this);
    }
}

export class BizFieldVar extends BizFieldField {
    override db(dbContext: DbContext): BBizField {
        return this.space.createBVar(dbContext, this);
    }
}

// col = field | bud;
enum ColType {
    bud,
    json,
    var,
}
interface Cols {
    names: string[];
    entity?: BizEntity;
    buds?: BizBudValue[];
    alias: string;
    colType?: ColType;
}
type TableCols = {
    [table: string]: Cols[]
};

const binFieldArr = ['i', 'x', 'value', 'price', 'amount'];
const sheetFieldArr = ['no'];
const atomFieldArr = ['id', 'no', 'ex'];
const pendFieldArr = ['pendvalue'];

export abstract class BizFieldSpace {
    private inited: boolean;
    protected abstract get fields(): TableCols;
    protected readonly buds: TableCols = {};

    protected init(): void {
    }

    private arrFromBuds(buds: Iterable<BizBudValue>): BizBudValue[] {
        let ret: BizBudValue[] = [];
        for (let bud of buds) ret.push(bud);
        return ret;
    }

    protected initBuds(table: string, entity: BizEntity, buds: Iterable<BizBudValue>, alias: string, colType: ColType = ColType.bud) {
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

    getBizField(names: string[]): BizField {
        if (this.inited !== true) {
            this.init();
            this.inited = true;
        }
        let n0 = names[0];
        let n1: string;
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
            if (ret === undefined) return;
        }
        return ret;
    }

    private buildBizField(tableCols: TableCols, n0: string, n1: string): BizField {
        let colsList = tableCols[n0];
        if (colsList === undefined) return;
        let foundCols: Cols;
        let foundBud: BizBudValue;
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
            // case ColType.sheetBud: return new BizFieldSheetBud(this, alias, entity, foundBud);
        }
    }

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
}

export abstract class FromFieldSpace extends BizFieldSpace {
}

export class FromInQueryFieldSpace extends FromFieldSpace {
    private static atomCols: TableCols = {
        $: [
            {
                names: atomFieldArr,
                entity: undefined,
                buds: undefined,
                alias: 't1',
            },
        ]
    };
    private readonly from: FromStatement;
    protected readonly fields: TableCols = {};

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
                this.initBuds('$', bizEntityArr[0], bizBuds, 't1');
                Object.assign(this.fields, FromInQueryFieldSpace.atomCols);
                break;
            case BizPhraseType.spec:
                this.initBuds('$', bizEntityArr[0], bizBuds, 't1');
                break;
        }
    }
}

export class FromInPendFieldSpace extends FromFieldSpace {
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
    private readonly from: FromStatementInPend;
    protected readonly fields: TableCols = FromInPendFieldSpace.fields;
    constructor(from: FromStatementInPend) {
        super();
        this.from = from;
    }

    protected init(): void {
        const { bizPend } = this.from.pendQuery;
        this.initBuds('$', bizPend, bizPend.props.values(), 'a', ColType.json);
        this.initBuds('bin', undefined, bizPend.getBinProps(), 'b');
        this.initBuds('sheet', undefined, bizPend.getSheetProps(), 'e');
    }
}


export class BizBinActFieldSpace extends BizFieldSpace {
    private static fields: TableCols = {
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
    private readonly bizBin: BizBin
    protected readonly fields: TableCols = BizBinActFieldSpace.fields;
    constructor(bizBin: BizBin) {
        super();
        this.bizBin = bizBin;
    }

    protected override init(): void {
        this.initBuds('$', this.bizBin, this.bizBin.props.values(), 'bin', ColType.bud);
        this.initBuds('bin', this.bizBin, this.bizBin.props.values(), 'bin', ColType.bud);
        this.initBuds('sheet', this.bizBin.sheetArr[0], this.bizBin.getSheetProps(), 'sheet', ColType.bud);
    }
    createBBud(dbContext: DbContext, bizField: BizFieldBud): BBizField {
        return new BBizFieldBinBud(dbContext, bizField);
    }
}
