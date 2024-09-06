import { binAmount, binPrice, binValue } from "../../../consts";
import { EnumSysTable, JoinType, FromInPendStatement, EnumAsc, BizAtom, FromEntity, BizBud } from "../../../il";
import { BFromStatement } from "./from";
import { ExpAnd, ExpCmp, ExpEQ, ExpField, ExpFunc, ExpNum, ExpStr, ExpVal, Select } from "../../sql";
import { EntityTable, VarTableWithSchema, VarTable } from "../../sql/statementWithFrom";
import { KeyOfMapFieldTable, MapFieldTable } from "../BizField";
import { DbContext } from "../../dbContext";
import { Sqls } from "../../bstatement";
import { BudDataType } from "../../../il/Biz/BizPhraseType";

const a = 'a', b = 'b';
export class BFromInPendStatement extends BFromStatement<FromInPendStatement> {
    constructor(context: DbContext, istatement: FromInPendStatement) {
        super(context, istatement);
        this.asc = EnumAsc.asc;
    }

    protected override buildFromMain(cmpStart: ExpCmp) {
        const { bizPend } = this.istatement.pendQuery;
        let { i: iBud, x: xBud } = bizPend;
        const { factory } = this.context;
        let select = super.buildSelect(cmpStart);
        let tblA: KeyOfMapFieldTable = 'pend';
        let tblB: KeyOfMapFieldTable = 'bin';
        let tblSheet: KeyOfMapFieldTable = 'sheet';
        let tblSheetBin: KeyOfMapFieldTable = 'sheetBin';
        const a = MapFieldTable[tblA], b = MapFieldTable[tblB], b1 = 'b1', c = 'c', d = 'd';
        const sheet = MapFieldTable[tblSheet];
        const sheetBin = MapFieldTable[tblSheetBin];
        select.column(new ExpField('id', a), 'pend');
        select.column(new ExpField('id', sheetBin), 'sheet');
        select.column(new ExpField('bin', a), 'id');

        function buidIXBud(bud: BizBud, name: string) {
            if (bud === undefined) {
                select.column(new ExpField(name, b), name);
                return;
            }
            select.column(
                new ExpFunc(
                    'JSON_VALUE',
                    new ExpField('mid', a),
                    new ExpStr(`$."${bud.id}"`)
                ),
                'i'
            );
        }
        buidIXBud(iBud, 'i');
        buidIXBud(xBud, 'x');
        select.column(new ExpField('value', a), binValue);
        select.column(new ExpField(binPrice, b), binPrice);
        select.column(new ExpField(binAmount, b), binAmount);
        select.column(new ExpField('value', a), 'pendvalue');
        select.column(new ExpField('mid', a), 'mid');

        let arr = this.buildSelectCols();
        select.column(new ExpFunc('JSON_ARRAY', ...arr), 'cols');

        select.from(new EntityTable(EnumSysTable.pend, false, a))
            .join(JoinType.join, new EntityTable(EnumSysTable.bizBin, false, b))
            .on(new ExpEQ(new ExpField('id', b), new ExpField('bin', a)))
            .join(JoinType.join, new EntityTable(EnumSysTable.bizPhrase, false, c))
            .on(new ExpAnd(
                new ExpEQ(new ExpField('base', a), new ExpNum(this.istatement.pendQuery.bizPend.id)),
                new ExpEQ(new ExpField('id', c), new ExpField('base', a)),
            ))
            .join(JoinType.left, new EntityTable(EnumSysTable.bizDetail, false, b1))
            .on(new ExpEQ(new ExpField('id', b1), new ExpField('id', b)))
            .join(JoinType.left, new EntityTable(EnumSysTable.bud, false, d))
            .on(new ExpEQ(new ExpField('id', d), new ExpField('base', b1)))
            .join(JoinType.left, new EntityTable(EnumSysTable.bizBin, false, sheetBin))
            .on(new ExpEQ(new ExpField('id', sheetBin), new ExpField('base', d)))
            .join(JoinType.left, new EntityTable(EnumSysTable.bizSheet, false, sheet))
            .on(new ExpEQ(new ExpField('id', sheet), new ExpField('id', sheetBin)))
            ;

        let insert = factory.createInsert();
        insert.table = new VarTableWithSchema('$page');
        insert.cols = [
            { col: 'pend', val: undefined },
            { col: 'sheet', val: undefined },
            { col: 'id', val: undefined },
            { col: 'i', val: undefined },
            { col: 'x', val: undefined },
            { col: binValue, val: undefined },
            { col: binPrice, val: undefined },
            { col: binAmount, val: undefined },
            { col: 'pendvalue', val: undefined },
            { col: 'mid', val: undefined },
            { col: 'cols', val: undefined },
        ];
        insert.select = select;
        return [insert];
    }

    protected override buildFromEntity(sqls: Sqls) {
        const { bizPend } = this.istatement.pendQuery;
        let { i: iBud, x: xBud, props } = bizPend;
        const buildInsertAtomSelect = (exp: ExpVal) => {
            let insert = this.buildInsertAtom();
            const { select } = insert;
            select.from(new VarTable('$page', a))
                .join(JoinType.join, new EntityTable(EnumSysTable.atom, false, b))
                .on(new ExpEQ(exp, new ExpField('id', b)));
            sqls.push(insert);
        }
        if (iBud !== undefined) buildInsertAtomSelect(new ExpField('i', a));
        if (xBud !== undefined) buildInsertAtomSelect(new ExpField('x', a));
        for (let [, bud] of props) {
            if (bud.dataType === BudDataType.atom) {
                let exp = new ExpFunc(
                    'JSON_VALUE',
                    new ExpField('mid', a),
                    new ExpStr(`$."${bud.id}"`)
                );
                buildInsertAtomSelect(exp);
            }
        }
    }

    protected override buildSelectJoin(select: Select, fromEntity: FromEntity) {
    }
}
