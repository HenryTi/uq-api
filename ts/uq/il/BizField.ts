import {
    BBizField, DbContext
    , BBizFieldBud, BBizFieldField, BBizFieldJsonProp, BBizFieldBinVar
    , BBizFieldUser, BBizFieldBinBud,
    BBizFieldPendBin,
    BBizFieldBinBudSelect
} from "../builder";
import { BinDiv, BizBin, FromStatement, FromInPendStatement } from "./Biz";
import { BizPhraseType, BudDataType } from "./Biz/BizPhraseType";
import { BizBud, BizBudBin } from "./Biz/Bud";
import { EnumDataType } from "./datatype";

// in FROM statement, columns use BizField
// and in Where, BizField is used.
export abstract class BizField {
    readonly space: BizFieldSpace;
    constructor(space: BizFieldSpace) {
        this.space = space;
    }
    getBud(): BizBud {
        return undefined;
    }
    abstract db(dbContext: DbContext): BBizField;
    abstract buildSchema(): any;
    abstract get tableAlias(): string;
    scanBinDiv() { }
}

export abstract class BizFieldTableAlias extends BizField {
    readonly tableAlias: string;
    constructor(space: BizFieldSpace, tableAlias: string) {
        super(space);
        this.tableAlias = tableAlias;
    }
}

export class BizFieldBud extends BizFieldTableAlias {
    bud: BizBud
    div: BinDiv;
    constructor(space: BizFieldSpace, tableAlias: string, bud: BizBud) {
        super(space, tableAlias);
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

    override scanBinDiv(): void {
        if (this.bud === undefined) return;
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

export class BizFieldBinBudSelect extends BizField {
    readonly bizBin: BizBin;
    readonly bud: BizBud;
    readonly tableAlias = undefined;
    constructor(space: BizFieldSpace, bizBin: BizBin, bud: BizBud) {
        super(space);
        this.bizBin = bizBin;
        this.bud = bud;
    }

    db(dbContext: DbContext): BBizField<BizField> {
        return new BBizFieldBinBudSelect(dbContext, this);
    }
    buildSchema() {
        throw new Error("Method not implemented.");
    }
}

// %pend.bin
export class BizFieldPendBin extends BizFieldTableAlias {
    buildSchema() {
        throw new Error("Method not implemented.");
    }
    /*
    protected override createBBizFieldBud(dbContext: DbContext): BBizFieldBud {
        return new BBizFieldPendBin(dbContext, this);
    }
    */
    override db(dbContext: DbContext): BBizField<BizField> {
        return new BBizFieldPendBin(dbContext, this);
    }
}

export class BizFieldField extends BizField {
    readonly name: string;
    readonly tableAlias: string;
    constructor(space: BizFieldSpace, tableAlias: string, name: string) {
        super(space);
        this.tableAlias = tableAlias;
        this.name = name;
    }
    override db(dbContext: DbContext): BBizField {
        return new BBizFieldField(dbContext, this);
    }
    buildSchema() { return []; }
}

export class BizFieldJsonProp extends BizFieldBud {
    override db(dbContext: DbContext): BBizField {
        return new BBizFieldJsonProp(dbContext, this);
    }
}

export class BizFieldVar extends BizFieldField {
    override db(dbContext: DbContext): BBizField {
        return new BBizFieldBinVar(dbContext, this);
    }
}

export class BizFieldUser extends BizFieldTableAlias {
    buildSchema() {
        return `%user.${this.tableAlias}`;
    }
    override db(dbContext: DbContext): BBizField {
        return new BBizFieldUser(dbContext, this);
    }
}

interface NameBizFields { [name: string]: BizField; };
interface NameNameBizFields { [name: string]: NameBizFields; };

export abstract class BizFieldSpace {
    private readonly nameBizFields: NameBizFields = {};
    private readonly nameNameBizFields: NameNameBizFields = {};

    get bBudNoArrayAgg(): boolean { return; }

    getBizField(names: string[]): BizField {
        let ret: BizField;
        let n0 = names[0];
        switch (names.length) {
            case 1: ret = this.bizFieldFromSolo(n0); break;
            case 2: ret = this.bizFieldFromDuo(n0, names[1]); break;
        }
        if (ret === undefined) {
            ret = this.bizFieldFromMulti(names);
        }
        return ret;
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

    protected bizFieldFromMulti(names: string[]): BizField {
        return null;
    }

    protected abstract buildBizFieldFromDuo(n0: string, n1: string): BizField;
}

export abstract class FromEntityFieldSpace<F extends FromStatement> extends BizFieldSpace {
    protected readonly from: F;

    constructor(from: F) {
        super();
        this.from = from;
    }

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
            }
        }
        return new BizFieldVar(this, alias, n1);
    }

    protected buildBizFieldFromBud(alias: string, bud: BizBud) {
        return new BizFieldBud(this, alias, bud);
    }
}

export class FromInQueryFieldSpace extends FromEntityFieldSpace<FromStatement> {
}

export class FromInPendFieldSpace extends FromEntityFieldSpace<FromInPendStatement> {
    get bBudNoArrayAgg(): boolean { return true; }

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
        return this.buildBizFieldFromBud(alias, bud);
    }

    protected bizFieldFromMulti(names: string[]): BizField {
        return null;
    }
}

export class BizBinActFieldSpace extends BizFieldSpace {
    private readonly bizBin: BizBin
    constructor(bizBin: BizBin) {
        super();
        this.bizBin = bizBin;
    }
    get bBudNoArrayAgg(): boolean { return true; }

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
                alias = 'sheet';
                break;
        }
        if (bud === undefined) return null;
        return this.buildBizFieldFromBud(alias, bud);
    }

    private buildBizFieldFromBud(alias: string, bud: BizBud) {
        return new BizFieldBinBud(this, alias, bud);
    }

    protected bizFieldFromMulti(names: string[]): BizField {
        let p = 0;
        let n0 = names[p++];
        const { length } = names;
        if (length < 2) return null;
        let bizBin: BizBin;
        const { pend } = this.bizBin;
        switch (n0) {
            case 'pend':
                if (this.bizBin.pend === undefined) return undefined;
                let n1 = names[p++];
                if (p === length) {
                    switch (n1) {
                        default:
                            let bud = pend.getBud(n1);
                            if (bud === undefined) return;
                            return new BizFieldBinBudSelect(this, bizBin, bud);
                        case 'bin':
                        case 'sheet':
                            return new BizFieldPendBin(this, n1);
                    }
                }
                switch (n1) {
                    default:
                        let bud = pend.getBud(n1);
                        if (bud === undefined) return;
                        if (bud.dataType !== BudDataType.bin) return undefined;
                        bizBin = (bud as BizBudBin).bin;
                        break;
                    case 'bin':
                        bizBin = pend.bizBins[0];
                        break;
                    case 'sheet':
                        bizBin = pend.bizBins[0]?.sheetArr[0]?.main;
                        break;
                }
                break;
            default:
                let bud = this.bizBin.getBud(n0);
                if (bud === undefined) return undefined;
                if (bud.dataType !== BudDataType.bin) return undefined;
                bizBin = (bud as BizBudBin).bin;
                break;
        }
        return this.buildBizFieldFromBin(bizBin, names, p);
    }

    private buildBizFieldFromBin(bizBin: BizBin, names: string[], pName: number): BizField {
        if (bizBin === undefined) return null;
        const { length } = names;
        if (pName >= length) return null;
        let bud: BizBud;
        for (let i = pName; i < length; i++) {
            let name = names[i];
            bud = bizBin.getBud(name);
            if (bud === undefined) break;
            if (bud.dataType !== BudDataType.bin) {
                if (i < length - 1) return null;
                break;
            }
            bizBin = (bud as BizBudBin).bin;
        }
        if (bud === undefined) return null;
        return new BizFieldBinBudSelect(this, bizBin, bud);
    }
}
