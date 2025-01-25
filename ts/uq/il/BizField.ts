import {
    BBizField, DbContext,
    BBizFieldBud, BBizFieldField, BBizFieldJsonProp, BBizFieldBinVar,
    BBizFieldUser, BBizFieldBinBud,
    BBizFieldPendBin, BBizFieldPendBudSelect,
    BBizFieldPendBinBudSelect,
    BBizFieldBinBinBudSelect,
    BBizFieldPendSheet,
    BBizFieldOptionsItem,
    BBizForkBaseField,
    BBizBinVar
} from "../builder";
import { BinDiv, BizBin, FromStatement, FromStatementInPend, BizOptions, OptionsItem } from "./Biz";
import { BizPhraseType, BudDataType } from "./Biz/BizPhraseType";
import { BizBud, BizBudBin } from "./Biz/Bud";
import { BizPend } from "./Biz/Pend";

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

export class BizBinVar extends BizField {
    db(dbContext: DbContext): BBizField { return new BBizBinVar(dbContext, this); }
    buildSchema(): any { return; }
    get tableAlias(): string { return undefined; }
}

export class BizForkBaseField extends BizField {
    db(dbContext: DbContext): BBizField { return new BBizForkBaseField(dbContext, this); }
    buildSchema(): any { return; }
    get tableAlias(): string { return undefined; }
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
        ret.noArrayAgg = this.space?.bBudNoArrayAgg;
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

export abstract class BizFieldBinBudSelect extends BizField {
    readonly tableAlias = undefined;
    buildSchema() {
        throw new Error("Method not implemented.");
    }
}

export class BizFieldPendBudSelect extends BizFieldBinBudSelect {
    readonly pend: BizPend;
    readonly bud: BizBud;
    constructor(space: BizFieldSpace, pend: BizPend, bud: BizBud) {
        super(space);
        this.pend = pend;
        this.bud = bud;
    }
    db(dbContext: DbContext): BBizField<BizField> {
        return new BBizFieldPendBudSelect(dbContext, this);
    }
    override getBud(): BizBud {
        return this.bud;
    }
}

export class BizFieldPendBinBudSelect extends BizFieldBinBudSelect {
    readonly pend: BizPend;
    readonly bud: BizBud;
    readonly budArr: BizBud[];
    constructor(space: BizFieldSpace, pend: BizPend, bud: BizBud, budArr: BizBud[]) {
        super(space);
        this.pend = pend;
        this.bud = bud;
        this.budArr = budArr;
    }
    db(dbContext: DbContext): BBizField<BizField> {
        return new BBizFieldPendBinBudSelect(dbContext, this);
    }
    override getBud(): BizBud {
        return this.bud;
    }
}

export class BizFieldBinBinBudSelect extends BizFieldBinBudSelect {
    readonly bizBin: BizBin;
    readonly bud: BizBud;
    readonly budArr: BizBud[];
    constructor(space: BizFieldSpace, bizBin: BizBin, bud: BizBud, budArr: BizBud[]) {
        super(space);
        this.bizBin = bizBin;
        this.bud = bud;
        this.budArr = budArr;
    }

    db(dbContext: DbContext): BBizField<BizField> {
        return new BBizFieldBinBinBudSelect(dbContext, this);
    }
    override getBud(): BizBud {
        return this.bud;
    }
}

// %pend.bin
export class BizFieldPendBin extends BizField {
    readonly tableAlias: string;
    buildSchema() {
        throw new Error("Method not implemented.");
    }
    override db(dbContext: DbContext): BBizField<BizField> {
        return new BBizFieldPendBin(dbContext, this);
    }
}
// %pend.sheet
export class BizFieldPendSheet extends BizField {
    readonly tableAlias: string;
    buildSchema() {
        throw new Error("Method not implemented.");
    }
    override db(dbContext: DbContext): BBizField<BizField> {
        return new BBizFieldPendSheet(dbContext, this);
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

export class BizFieldOptionsItem extends BizField {
    options: BizOptions;
    optionsItem: OptionsItem;
    constructor(options: BizOptions, optionsItem: OptionsItem) {
        super(undefined);
        this.options = options;
        this.optionsItem = optionsItem;
    }

    db(dbContext: DbContext): BBizField {
        return new BBizFieldOptionsItem(dbContext, this);
    }
    buildSchema() {
        return `%${this.options.name}.${this.optionsItem.name}`;
    }
    get tableAlias(): string {
        return;
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
        if (name === 'bin') {
            return new BizBinVar(this);
        }
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
        return; // null;
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
                let t: string;
                if (bizEntity.bizPhraseType === BizPhraseType.atom && n1 !== 'id') {
                    t = alias + '$atom';
                }
                else {
                    t = alias;
                }
                return new BizFieldField(this, t, n1);
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

export class FromInPendFieldSpace extends FromEntityFieldSpace<FromStatementInPend> {
    get bBudNoArrayAgg(): boolean { return true; }

    protected buildBizFieldFromDuo(n0: string, n1: string): BizField {
        const { bizPend } = this.from.pendQuery;
        let alias: string, bud: BizBud;
        switch (n0) {
            default: return undefined;
            case '$t1':
            case '$':
                bud = bizPend.getBud(n1);
                if (bud === undefined) {
                    return null;
                }
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
        // if (bud === undefined) debugger;
        if (bud === undefined) {
            return null;
        }
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
                bud = this.bizBin.getSheetMainBud(n1);
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
        let bud: BizBud;
        switch (n0) {
            case 'pend':
                if (this.bizBin.pend === undefined) return undefined;
                let n1 = names[p++];
                if (p === length) {
                    switch (n1) {
                        default:
                            let bud = pend.getBud(n1);
                            if (bud === undefined) return;
                            return new BizFieldPendBudSelect(this, pend, bud);
                        case 'bin':
                            return new BizFieldPendBin(this);
                        case 'sheet':
                            return new BizFieldPendSheet(this);
                    }
                }
                else {
                    switch (n1) {
                        default:
                            bud = pend.getBud(n1);
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
                    let budArr = this.buildBizFieldFromBin(bizBin, names, p);
                    if (budArr === undefined) {
                        return null;
                    }
                    return new BizFieldPendBinBudSelect(this, pend, bud, budArr);
                }
            default:
                bud = this.bizBin.getBud(n0);
                if (bud === undefined) return undefined;
                if (bud.dataType !== BudDataType.bin) return undefined;
                bizBin = (bud as BizBudBin).bin;
                let budArr = this.buildBizFieldFromBin(bizBin, names, p);
                if (budArr === undefined) {
                    return null;
                }
                return new BizFieldBinBinBudSelect(this, this.bizBin, bud, budArr);
        }
    }

    private buildBizFieldFromBin(bizBin: BizBin, names: string[], pName: number): BizBud[] {
        if (bizBin === undefined) return;
        const { length } = names;
        let budArr: BizBud[] = [];
        for (let i = pName; i < length; i++) {
            let name = names[i];
            let bud = bizBin.getBud(name);
            if (bud === undefined) break;
            budArr.push(bud);
            if (bud.dataType !== BudDataType.bin) {
                if (i < length - 1) return null;
                break;
            }
            bizBin = (bud as BizBudBin).bin;
        }
        return budArr;
    }
}
