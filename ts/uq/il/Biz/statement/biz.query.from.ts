import { PContext, PElement, PFromStatementInQuery } from "../../../parser";
import { Builder } from "../../builder";
import { IElement } from "../../IElement";
// 下面这句，改成 from "../Biz"; 会出错 Class extends value undefined is not a constructor or null
import { FromColumn } from "./biz.select";
import { BizFromEntity } from "../Entity";
import { VarOperand } from "../../Exp";
import { BizBud } from "../Bud";
import { FromStatement } from "./biz.from";

export class FromStatementInQuery extends FromStatement {
    get type(): string { return 'from'; }
    readonly values: FromColumn[] = [];

    db(db: Builder): object {
        return db.fromStatementInQuery(this);
    }
    parser(context: PContext): PElement<IElement> {
        return new PFromStatementInQuery(this, context);
    }

    getIdFromEntity(idAlias: string): BizFromEntity {
        if (idAlias === undefined) {
            return this.fromEntity;
        }
        return this.getBizFromEntityFromAlias(idAlias);
    }

    // 从值表达式推到bud
    setValBud(col: FromColumn) {
        let bud = col.val.getBud();
        /*
        const { val: { atoms } } = col;
        if (atoms.length !== 1) return;
        let atom = atoms[0];
        if (atom.type !== 'var') return;
        let { pointer } = atom as VarOperand;
        let bud: BizBud = (pointer as unknown as any).bud;
        if (bud === undefined) return;
        */
        // 这一步为什么要屏蔽呢？没有想明白
        // if (bud.dataType !== BudDataType.atom) return;
        col.valBud = bud;
    }
}
