import { binAmount, binPrice, binValue } from "../../../consts";
import { EnumSysTable, JoinType, FromInPendStatement, EnumAsc, BizAtom } from "../../../il";
import { BFromStatement } from "./from";
import { ExpCmp, ExpEQ, ExpField } from "../../sql";
import { EntityTable, VarTableWithSchema, VarTable } from "../../sql/statementWithFrom";
import { KeyOfMapFieldTable, MapFieldTable } from "../BizField";
import { DbContext } from "../../dbContext";
import { Sqls } from "../../bstatement";

const a = 'a', b = 'b';
export class BFromInPendStatement extends BFromStatement<FromInPendStatement> {
    constructor(context: DbContext, istatement: FromInPendStatement) {
        super(context, istatement);
        // no ids in FromInPend
        this.asc = EnumAsc.asc;
        // this.idFromEntity = undefined;
    }

    protected override buildFromMain(cmpStart: ExpCmp) {
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
        select.column(new ExpField('i', b), 'i');
        select.column(new ExpField('x', b), 'x');
        select.column(new ExpField(binValue, b), binValue);
        select.column(new ExpField(binPrice, b), binPrice);
        select.column(new ExpField(binAmount, b), binAmount);
        select.column(new ExpField('value', a), 'pendvalue');
        select.column(new ExpField('mid', a), 'mid');

        this.buildSelectCols(select, 'cols');

        select.from(new EntityTable(EnumSysTable.pend, false, a))
            .join(JoinType.join, new EntityTable(EnumSysTable.bizBin, false, b))
            .on(new ExpEQ(new ExpField('id', b), new ExpField('bin', a)))
            .join(JoinType.join, new EntityTable(EnumSysTable.bizPhrase, false, c))
            .on(new ExpEQ(new ExpField('id', c), new ExpField('base', a)))
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

    protected buildFromEntity(sqls: Sqls) {
        // let { bizEntityArr } = this.idFromEntity;
        // let entityArr: BizAtom[] = bizEntityArr as BizAtom[];
        let insertAtom = this.buildInsertAtomDirect()
        sqls.push(insertAtom);
        // let entity = entityArr[0];
        // this.buildInsertAtomBuds(sqls, entity);
    }

    private buildInsertAtomDirect() {
        let insert = this.buildInsertAtom();
        const { select } = insert;
        select.from(new VarTable('ret', a))
            .join(JoinType.join, new EntityTable(EnumSysTable.atom, false, b))
            .on(new ExpEQ(new ExpField('id', a), new ExpField('id', b)));
        return insert;
    }
}
