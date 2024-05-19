import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { EnumSysTable, charField, JoinType, smallIntField, StateToStatement } from "../../il";
import { Statement, ExpCmp, ExpEQ, ExpAnd, ExpField, ExpVar, ExpStr, SqlSysTable, ExpSelect, ExpVal, ExpAdd, ExpNum, If, ExpIsNotNull } from "../sql";
import { DbContext, sysTable } from "../dbContext";

export class BStateTo extends BStatement<StateToStatement> {
    body(sqls: Sqls) {
        let buildStateTo = new BuildStateTo(sqls, this.context, this.istatement.no, new ExpVar('$id'), this.istatement.to);
        buildStateTo.build();
    }
}

//let idVal = convertExp(context, idExp) as ExpVal;
export abstract class BuildStateToBase {
    protected sqls: Sqls;
    protected context: DbContext;
    protected no: number;
    protected idVal: ExpVal;
    protected toState: string;
    constructor(sqls: Sqls, context: DbContext, no: number, idVal: ExpVal, toState: string) {
        this.sqls = sqls;
        this.context = context;
        this.no = no;
        this.idVal = idVal;
        this.toState = toState;
    }

    get vNewFlow(): string { return '$newFlow' }
    get vState(): string { return '$state' };
    get vPreState(): string { return '$preState' };
    get vAction(): string { return '$action' };

    protected abstract buildPre(): If;

    build() {
        let { factory, hasUnit } = this.context;
        let wheres: ExpCmp[] = [];
        wheres.push(new ExpEQ(new ExpField('id'), this.idVal));
        let where = new ExpAnd(...wheres);

        let archive: boolean;
        let to = this.toState;
        switch (to) {
            default: archive = false; break;
            case 'end': to = '#'; archive = true; break;
            case 'delete': to = '-'; archive = true; break;
            case 'start': to = '$'; archive = false; break;
        }

        let sqls: Statement[] = [];
        let set = factory.createSet();
        sqls.push(set);
        set.equ(this.vState, new ExpStr(to));

        function selectConst(v: string) {
            let ret = factory.createSelect();
            ret.column(new ExpField('id'));
            ret.from(sysTable(EnumSysTable.const));
            ret.where(new ExpEQ(new ExpField('name'), new ExpVar(v)));
            return ret;
        }
        let stateIdSelect = selectConst(this.vState);
        let preStateIdSelect = selectConst(this.vPreState);
        let actionIdSelect = selectConst(this.vAction);
        let insert = factory.createInsert();
        sqls.push(insert);
        insert.table = sysTable(EnumSysTable.flow);

        insert.cols = [
            { col: 'sheet', val: this.idVal },
            { col: 'date', val: new ExpVar('$date') },
            { col: 'user', val: new ExpVar('$user') },
            { col: 'flow', val: new ExpVar(this.vNewFlow) },
            { col: 'state', val: new ExpSelect(stateIdSelect) },
            { col: 'preState', val: new ExpSelect(preStateIdSelect) },
            { col: 'action', val: new ExpSelect(actionIdSelect) },
        ];

        let updateFlow = factory.createUpdate();
        sqls.push(updateFlow);
        updateFlow.cols = [
            { col: 'flow', val: new ExpVar(this.vNewFlow) },
            { col: 'state', val: new ExpSelect(stateIdSelect) },
        ];
        updateFlow.table = this.context.sysTable(EnumSysTable.sheet);
        updateFlow.where = new ExpEQ(new ExpField('id'), this.idVal);

        if (archive === true) {
            let select = factory.createSelect();
            sqls.push(select);
            select.into = '$archive';
            if (hasUnit === true) select.column(new ExpField('$unit'));
            select.column(new ExpField('id'))
                .column(new ExpField('no'))
                .column(new ExpField('user'))
                .column(new ExpField('date'))
                .column(new ExpField('sheet'))
                .column(new ExpField('version'))
                .column(new ExpVar(this.vNewFlow))
                .column(new ExpField('discription'))
                .column(new ExpField('data'));
            select.from(this.context.sysTable(EnumSysTable.sheet));
            select.where(where);
            let del = factory.createDelete();
            sqls.push(del);
            del.tables = [this.context.sysTable(EnumSysTable.sheet)];
            del.where(where);

            let whereSheet: ExpCmp = new ExpEQ(new ExpField('sheet'), this.idVal);
            select = factory.createSelect();
            sqls.push(select);
            select.into = '$archive_flow';
            select.column(new ExpField('sheet'))
                .column(new ExpField('date'))
                .column(new ExpField('flow'))
                .column(new ExpField('preState'))
                .column(new ExpField('action'))
                .column(new ExpField('state'))
                .column(new ExpField('user'));
            select.from(sysTable(EnumSysTable.flow));
            select.where(whereSheet);
            del = factory.createDelete();
            sqls.push(del);
            del.tables = [sysTable(EnumSysTable.flow)];
            del.where(whereSheet);

            del = factory.createDelete();
            sqls.push(del);
            del.tables = [sysTable(EnumSysTable.sheetDetail)];
            del.where(new ExpEQ(new ExpField('sheet'), this.idVal));
        }

        let iff = this.buildPre();
        if (iff === undefined) {
            this.sqls.push(...sqls);
        }
        else {
            iff.then(...sqls);
        }

    }
}

export class BuildStateTo extends BuildStateToBase {
    protected buildPre(): If {
        return;
    }
}


export class BuildSheetStateTo extends BuildStateToBase {
    get vNewFlow(): string { return super.vNewFlow + '_' + this.no }
    get vState(): string { return super.vState + '_' + this.no };
    get vPreState(): string { return super.vPreState + '_' + this.no };
    get vAction(): string { return super.vAction + '_' + this.no };
    protected buildPre(): If {
        let { factory } = this.context;

        let declare = factory.createDeclare();
        this.sqls.push(declare);
        declare.vars(
            smallIntField(this.vNewFlow),
            charField(this.vState, 100),
            charField(this.vPreState, 100),
            charField(this.vAction, 100)
        );

        let ta = 'a', tb = 'b', tc = 'c';
        let sel = factory.createSelect();
        this.sqls.push(sel);
        sel.toVar = true;
        sel.column(new ExpAdd(new ExpField('flow', ta), ExpNum.num1), this.vNewFlow)
            .column(new ExpField('name', tc), this.vState)
            .column(new ExpField('name', tc), this.vPreState);
        sel.from(this.context.sysTable(EnumSysTable.sheet, ta));
        sel.join(JoinType.join, sysTable(EnumSysTable.flow, tb))
            .on(new ExpAnd(
                new ExpEQ(new ExpField('id', ta), new ExpField('sheet', tb)),
                new ExpEQ(new ExpField('flow', ta), new ExpField('flow', tb)),
            ));
        sel.join(JoinType.join, sysTable(EnumSysTable.const, tc))
            .on(new ExpEQ(new ExpField('state', tb), new ExpField('id', tc)));
        sel.where(new ExpEQ(new ExpField('id', ta), this.idVal));

        let iff = factory.createIf();
        this.sqls.push(iff);
        iff.cmp = new ExpIsNotNull(new ExpVar(this.vNewFlow));
        return iff;
    }
}
