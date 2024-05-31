import {
    BBizField, DbContext
    , BBizFieldBud, BBizFieldField, BBizFieldJsonProp, BBizFieldBinVar
    , ExpVal, ExpStr, ExpNum, BBizFieldUser,
    BBizFieldBinBud
} from "../builder";
import { BinDiv, BizBin, FromStatement, FromStatementInPend } from "./Biz";
import { BizPhraseType } from "./Biz/BizPhraseType";
import { BizBud } from "./Biz/Bud";
import { BizEntity } from "./Biz/Entity";
import { binFieldArr } from "../consts";

// in FROM statement, columns use BizField
// and in Where, BizField is used.
export abstract class BizField {
    readonly space: BizFieldSpace;
    readonly tableAlias: string;
    constructor(space: BizFieldSpace, tableAlias: string) {
        this.space = space;
        this.tableAlias = tableAlias;
    }
    getBud(): BizBud {
        return undefined;
    }
    abstract db(dbContext: DbContext): BBizField;
    abstract buildSchema(): any;
    // abstract buildColArr(): ExpVal[];
    scanBinDiv() { }
}

export class BizFieldBud extends BizField {
    bud: BizBud
    // entity: BizEntity;
    div: BinDiv;
    constructor(space: BizFieldSpace, tableAlias: string, bud: BizBud) {
        super(space, tableAlias);
        // this.entity = entity;
        if (bud === undefined) debugger;
        this.bud = bud;
    }
    override getBud(): BizBud {
        return this.bud;
    }
    override db(dbContext: DbContext): BBizField {
        let ret = this.createBBizFieldBud(dbContext);
        ret.noArrayAgg = this.space.bBudNoArrayAgg;
        return ret;
    }
    buildSchema() { return [this.bud.entity?.id, this.bud.id]; }
    protected createBBizFieldBud(dbContext: DbContext) {
        return new BBizFieldBud(dbContext, this);
    }

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

    override scanBinDiv(): void {
        const { entity } = this.bud;
        const { bizPhraseType } = entity;
        if (bizPhraseType === BizPhraseType.bin) {
            let entityBin = entity as BizBin;
            this.div = entityBin.getDivFromBud(this.bud);
            if (this.div === undefined) debugger;
        }
    }
}

export class BizFieldBinBud extends BizFieldBud {
    protected override createBBizFieldBud(dbContext: DbContext): BBizFieldBud {
        return new BBizFieldBinBud(dbContext, this);
    }
}

export class BizFieldField extends BizField {
    readonly name: string;
    constructor(space: BizFieldSpace, tableAlias: string, name: string) {
        super(space, tableAlias);
        this.name = name;
    }
    override db(dbContext: DbContext): BBizField {
        return new BBizFieldField(dbContext, this);
        // return this.space.createBField(dbContext, this);
    }
    buildSchema() { return []; }
    /*
    override buildColArr(): ExpVal[] {
        return [new ExpStr(this.name)];
    }
    */
}

export class BizFieldJsonProp extends BizFieldBud {
    override db(dbContext: DbContext): BBizField {
        return new BBizFieldJsonProp(dbContext, this);
        // return this.space.createBJson(dbContext, this);
    }
}

export class BizFieldVar extends BizFieldField {
    override db(dbContext: DbContext): BBizField {
        return new BBizFieldBinVar(dbContext, this);
        // return this.space.createBVar(dbContext, this);
    }
}

export class BizFieldUser extends BizField {
    buildSchema() {
        return `%user.${this.tableAlias}`;
    }
    /*
    override buildColArr(): ExpVal[] {
        return [new ExpStr(`%user.${this.tableAlias}`)];
    }
    */
    override db(dbContext: DbContext): BBizField {
        return new BBizFieldUser(dbContext, this);
        // return this.space.createBFieldUser(dbContext, this);
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
    buds?: BizBud[];
    alias: string;
    colType?: ColType;
}
type TableCols = {
    [table: string]: Cols[]
};


const atomFieldArr = ['id', 'no', 'ex'];
const specFieldArr = ['id'];
const duoFieldArr = ['id'];

interface NameBizFields { [name: string]: BizField; };
interface NameNameBizFields { [name: string]: NameBizFields; };

export abstract class BizFieldSpace {
    private readonly nameBizFields: NameBizFields = {};
    private readonly nameNameBizFields: NameNameBizFields = {};

    // private inited: boolean;
    // protected abstract get fields(): TableCols;
    // protected readonly buds: TableCols = {};

    get bBudNoArrayAgg(): boolean { return; }

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

    getBizField(names: string[]): BizField {
        /*
        if (this.inited !== true) {
            this.init();
            this.inited = true;
        }
        */
        let n0 = names[0];
        switch (names.length) {
            default: debugger; throw Error('error names');
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

    private bizFieldFromSolo(name: string): BizField {
        let bizField = this.nameBizFields[name];
        if (bizField !== undefined) return bizField;
        bizField = this.buildBizFieldFromSolo(name);
        if (bizField === null) return null;
        if (bizField !== undefined) {
            this.nameBizFields[name] = bizField;
        }
        return bizField;
    }

    protected buildBizFieldFromSolo(name: string): BizField {
        return this.buildBizFieldFromDuo('$t1', name);
    }

    private bizFieldFromDuo(n0: string, n1: string): BizField {
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

        bizField = this.buildBizFieldFromDuo(n0, n1);
        if (bizField !== undefined) {
            nameBizFields[n1] = bizField;
            return bizField;
        }
    }

    protected abstract buildBizFieldFromDuo(n0: string, n1: string): BizField;
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

export abstract class FromEntityFieldSpace<F extends FromStatement> extends BizFieldSpace {
    protected readonly from: F;

    constructor(from: F) {
        super();
        this.from = from;
        // this.init();
    }

    // protected abstract init(): void;

    protected override buildBizFieldFromDuo(n0: string, n1: string): BizField {
        let bizEntityFrom = this.from.getBizFromEntityFromAlias(n0);
        if (bizEntityFrom === undefined) return undefined;
        const { alias, bizEntityArr } = bizEntityFrom;
        for (let bizEntity of bizEntityArr) {
            if (bizEntity.hasField(n1) === true) {
                return new BizFieldField(this, alias, n1);
            }
            let bud = bizEntity.props.get(n1);
            if (bud !== undefined) {
                return this.buildBizFieldFromBud(alias, bud);
                // return new BizFieldBud(this, alias, bud);
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

    protected buildBizFieldFromBud(alias: string, bud: BizBud) {
        return new BizFieldBud(this, alias, bud);
    }
}

export class FromInQueryFieldSpace extends FromEntityFieldSpace<FromStatement> {
    /*
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
    private static specCols: TableCols = {
        $: [
            {
                names: specFieldArr,
                entity: undefined,
                buds: undefined,
                alias: 't1',
            },
        ]
    };
    private static duoCols: TableCols = {
        $: [
            {
                names: duoFieldArr,
                entity: undefined,
                buds: undefined,
                alias: 't1',
            },
        ]
    };
    protected readonly fields: TableCols = {};

    protected override init(): void {
        const { fromEntity: { bizPhraseType, bizEntityArr } } = this.from;
        let bizBuds: BizBud[] = [];
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
                Object.assign(this.fields, FromInQueryFieldSpace.specCols);
                break;
            case BizPhraseType.duo:
                this.initBuds('$', bizEntityArr[0], bizBuds, 't1');
                Object.assign(this.fields, FromInQueryFieldSpace.duoCols);
                break;
        }
    }
    */
}

export class FromInPendFieldSpace extends FromEntityFieldSpace<FromStatementInPend> {
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
    get bBudNoArrayAgg(): boolean { return true; }
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

    protected buildBizFieldFromDuo(n0: string, n1: string): BizField {
        const { bizPend } = this.from.pendQuery;
        let alias: string, bud: BizBud;
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
        if (bud === undefined) debugger;
        // return new BizFieldBud(this, alias, bud);
        return this.buildBizFieldFromBud(alias, bud);
    }
}

export class BizBinActFieldSpace extends BizFieldSpace {
    /*
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
        ],
    };
    */
    private readonly bizBin: BizBin
    // protected readonly fields: TableCols = BizBinActFieldSpace.fields;
    constructor(bizBin: BizBin) {
        super();
        this.bizBin = bizBin;
        // this.initW();
    }
    /*
    get speceEntity(): BizEntity {
        return this.bizBin;
    }
    */
    get bBudNoArrayAgg(): boolean { return true; }
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

    protected override buildBizFieldFromDuo(n0: string, n1: string): BizField {
        let alias: string, bud: BizBud;
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
        if (bud === undefined) debugger;
        // return new BizFieldBud(this, alias, bud);
        return this.buildBizFieldFromBud(alias, bud);
    }

    protected buildBizFieldFromBud(alias: string, bud: BizBud) {
        return new BizFieldBinBud(this, alias, bud);
    }

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
            case ColType.bud: return new BizFieldBud(this, alias, foundBud);
            case ColType.json: return new BizFieldJsonProp(this, alias, foundBud);
            case ColType.var: return new BizFieldVar(this, alias, n1);
        }
    }

    protected buildBizField(n0: string, n1: string): BizField {
        let bizField = this.buildBizFieldOld1(this.fields, n0, n1);
        if (bizField === undefined) {
            bizField = this.buildBizFieldOld1(this.buds, n0, n1);
            if (bizField === undefined) return;
        }
        return bizField;
    }

    private buildBizFieldOld1(tableCols: TableCols, n0: string, n1: string): BizField {
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
            case ColType.bud: return new BizFieldBud(this, alias, foundBud);
            case ColType.json: return new BizFieldJsonProp(this, alias, foundBud);
            case ColType.var: return new BizFieldVar(this, alias, n1);
        }
    }
    */
}
