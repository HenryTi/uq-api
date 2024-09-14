import { BBizEntity, DbContext, ExpField } from "../../builder";
import { EnumSysTable } from "../EnumSysTable";
import { ValueExpression } from "../Exp";
import { BizBase, IxField } from "./Base";
import { Biz } from "./Biz";
import { BizPhraseType } from "./BizPhraseType";
import { BizBud, BizUser, BudGroup, FieldShow } from "./Bud";
import { BizRole } from "./Role";
import { BizTie } from "./Tie";

export enum BudIndex {
    none = 0x0000,
    index = 0x0001,
}

export interface Permission {
    a: boolean;                 // all permission
    c: boolean;                 // create
    r: boolean;                 // read
    u: boolean;                 // update·
    d: boolean;                 // delete
    l: boolean;                 // list
}

export abstract class BizEntity extends BizBase {
    readonly props: Map<string, BizBud> = new Map();
    readonly group0: BudGroup;      // 所有不归属组的属性
    readonly group1: BudGroup;      // 显示时必须的属性
    readonly budGroups: Map<string, BudGroup> = new Map();
    readonly permissions: { [role: string]: Permission } = {};
    user: BizUser;
    source: string = undefined;
    protected abstract get fields(): string[];
    showBuds: FieldShow[];
    schema: any;

    constructor(biz: Biz) {
        super(biz);
        this.group0 = new BudGroup(biz, '-');
        this.group1 = new BudGroup(biz, '+');
    }

    get theEntity(): BizEntity {
        return this;
    }

    abstract get isID(): boolean;

    buildSchema(res: { [phrase: string]: string }) {
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
        this.forEachGroup((group: BudGroup) => {
            const { buds } = group;
            if (buds.length === 0) return;
            hasGroup = true;
            groups.push(group.buildSchema(res));
        });
        if (hasGroup === true as any) {
            groups.push(this.group0.buildSchema(res));
            ret.groups = groups;
        }
        if (this.user !== undefined) {
            ret.user = this.user.defaults.map(v => v.buildSchema(res));
        }
        this.schema = ret;
        return ret;
    }

    hasField(fieldName: string): boolean {
        return this.fields.includes(fieldName);
    }

    protected buildPhrase(prefix: string) {
        this.phrase = this.name;
    }

    buildPhrases(phrases: [string, string, string, string][], prefix: string) {
        super.buildPhrases(phrases, prefix);
        let phrase = this.phrase;
        this.forEachBud(bud => {
            bud.buildPhrases(phrases, phrase)
        });
        this.group1.buildPhrases(phrases, phrase);
        for (let [, group] of this.budGroups) {
            group.buildPhrases(phrases, phrase);
        }
    }

    buildIxRoles(ixRoles: any[]) {
        for (let role in this.permissions) {
            let bizRole = role === '*' ? undefined : this.biz.bizEntities.get(role) as BizRole;
            // if (bizRole === undefined) debugger;
            this.setIxRoles(ixRoles, bizRole, this.permissions[role]);
        }
    }

    private setIxRoles(ixRoles: any[], bizRole: BizRole, permission: Permission) {
        let { a, c, r, u, d, l } = permission;
        let x: number;
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

    getBizBase1(bizName: string): BizBase {
        let ret = super.getBizBase1(bizName);
        if (ret !== undefined) return ret;
        ret = this.props.get(bizName);
        if (ret !== undefined) return ret;
        //ret = this.assigns.get(bizName);
        // if (ret !== undefined) return ret;
    }

    getBizBase(bizName: string[]): BizBase {
        let ret = super.getBizBase(bizName);
        if (ret !== undefined) return ret;
        let { bizEntities: bizes } = this.biz;
        let [n0] = bizName;
        ret = bizes.get(n0);
        if (ret === undefined) {
            throw Error('not found');
        };
        return ret.getBizBase(bizName);
    }

    protected ixFieldSchema(tieField: IxField) {
        const { caption, atoms } = tieField;
        let ret = {
            caption,
            atoms: atoms?.map(v => v.id),
        }
        return ret;
    }

    getBud(name: string): BizBud {
        let bud = this.props.get(name);
        return bud;
    }

    forEachBud(callback: (bud: BizBud) => void) {
        if (this.user !== undefined) {
            callback(this.user);
            for (let ub of this.user.defaults) {
                callback(ub);
            }
        }
        for (let [, bud] of this.props) callback(bud);
    }

    forEachGroup(callback: (group: BudGroup) => void) {
        callback(this.group1);
        for (let [, group] of this.budGroups) {
            callback(group);
        }
    }

    db(dbContext: DbContext): BBizEntity {
        return undefined;
    }

    allShowBuds() {
        let ret: FieldShow[] = [];
        function pushRet(arr: FieldShow[]) {
            if (arr === undefined) return;
            ret.push(...arr);
        }
        if (this.showBuds !== undefined) pushRet(this.showBuds);
        this.forEachBud(v => {
            let shows = v.getFieldShows();
            if (shows === undefined) return;
            for (let s of shows) pushRet(s);
        });
        if (ret.length === 0) return;
        return ret;
    }

    protected internalCheckUserDefault(prop: string) {
        if (this.user === undefined) return false;
        const { defaults } = this.user;
        prop = ':user.' + prop;
        return (defaults.findIndex(v => v.name === prop) >= 0);
    }

    checkUserDefault(prop: string) {
        let ret = this.internalCheckUserDefault(prop);
        if (ret === true) return true;
        let bizConsole = this.biz.bizEntities.get('$console');
        if (bizConsole !== this) {
            return bizConsole.internalCheckUserDefault(prop);
        }
        return ret;
    }

    getEnumSysTable(): EnumSysTable {
        let bizEntityTable: EnumSysTable;
        switch (this.bizPhraseType) {
            default: break;
            case BizPhraseType.query: break;
            case BizPhraseType.atom:
                //bizEntityTable = EnumSysTable.atom; 
                bizEntityTable = EnumSysTable.idu;
                break;
            case BizPhraseType.fork:
                //bizEntityTable = EnumSysTable.spec; 
                bizEntityTable = EnumSysTable.idu;
                break;
            case BizPhraseType.duo:
                bizEntityTable = EnumSysTable.duo; break;
            case BizPhraseType.bin:
                bizEntityTable = EnumSysTable.bizBin; break;
            case BizPhraseType.sheet:
                bizEntityTable = EnumSysTable.sheet; break;
            case BizPhraseType.pend:
                bizEntityTable = EnumSysTable.pend; break;
        }
        return bizEntityTable;
    }
}

export abstract class BizID extends BizEntity {
    readonly isID = true;
    abstract get main(): BizID;
}

export abstract class BizNotID extends BizEntity {
    readonly isID = false;
    protected readonly fields = [];
}

export interface BizFromEntitySub {
    field: string;
    fromEntity: BizFromEntity;
    isSpecBase: boolean;
}

export class BizFromEntity<E extends BizEntity = BizEntity> {
    private readonly parent: BizFromEntity<any>;
    bizEntityArr: E[] = [];
    bizPhraseType: BizPhraseType;
    bizEntityTable: EnumSysTable;
    subs: BizFromEntitySub[];
    ofIXs: BizTie[] = [];
    ofOn: ValueExpression;
    alias: string;

    constructor(parent: BizFromEntity<any>) {
        this.parent = parent;
    }

    expIdCol() {
        return new ExpField('id', this.alias);
    }
}
