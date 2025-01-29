import { PContext, PElement, PFromStatement } from "../../../parser";
import { Builder } from "../../builder";
import { IElement } from "../../IElement";
import { BanColumn, BizSelectStatement, FromColumn, IdColumn } from "./biz.select";
import { BizFromEntity } from "../Entity";
import { VarOperand } from "../../Exp";
import { BizBud } from "../Bud";
import { BudDataType } from "../BizPhraseType";

export interface IntoTables {
    ret: string;
    atoms: string;
    forks: string;
    props: string;
    details: string;
}

export class FromStatement extends BizSelectStatement {
    get type(): string { return 'from'; }
    readonly ids: IdColumn[] = [];
    readonly cols: FromColumn[] = [];
    value: FromColumn;
    mainCols: FromColumn[];             // 主从Group查询的主字段
    showIds: IdColumn[];
    ban: BanColumn;
    intoTables: IntoTables;

    db(db: Builder): object {
        return db.fromStatement(this);
    }
    parser(context: PContext): PElement<IElement> {
        return new PFromStatement(this, context);
    }

    getIdFromEntity(idAlias: string): BizFromEntity {
        if (idAlias === undefined) {
            return this.fromEntity;
        }
        return this.getBizFromEntityFromAlias(idAlias);
    }

    // 从值表达式推到bud
    setValBud(col: FromColumn) {
        const { val: { atoms } } = col;
        if (atoms.length !== 1) return;
        let atom = atoms[0];
        if (atom.type !== 'var') return;
        let { pointer } = atom as VarOperand;
        let bud: BizBud = (pointer as unknown as any).bud;
        if (bud === undefined) return;
        // 这一步为什么要屏蔽呢？没有想明白
        // if (bud.dataType !== BudDataType.atom) return;
        col.valBud = bud;
    }
}
