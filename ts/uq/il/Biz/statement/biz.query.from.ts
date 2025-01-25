import { PContext, PElement, PFromStatement, PFromStatementInPend, PFromStatementInQuery } from "../../../parser";
import { Builder } from "../../builder";
import { IElement } from "../../IElement";
// 下面这句，改成 from "../Biz"; 会出错 Class extends value undefined is not a constructor or null
import { Statement } from "../../statement";
import { PendQuery } from "../../Biz/Pend";
import { BanColumn, BizSelectStatement, FromColumn, IdColumn } from "./biz.select";
import { BizFromEntity } from "../Entity";
import { VarOperand } from "../../Exp";
import { BizBud } from "../Bud";
import { BudDataType } from "../BizPhraseType";
import { FromStatement } from "./biz.from";

export class FromStatementInQuery extends FromStatement {
    get type(): string { return 'from'; }
    readonly values: FromColumn[] = [];
    //ids: IdColumn[];
    //value: FromColumn;
    //cols: FromColumn[] = [];
    //subCols: FromColumn[];          // 查询单据的时候，sub中的字段，会算为明细
    //showIds: IdColumn[];
    // groupByBase?: boolean;          // spec group by base atom
    //ban: BanColumn;
    //intoTables: IntoTables;

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
        const { val: { atoms } } = col;
        if (atoms.length !== 1) return;
        let atom = atoms[0];
        if (atom.type !== 'var') return;
        let { pointer } = atom as VarOperand;
        let bud: BizBud = (pointer as unknown as any).bud;
        if (bud === undefined) return;
        if (bud.dataType !== BudDataType.atom) return;
        col.valBud = bud;
    }
}
