"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildSheetStateTo = exports.BuildStateTo = exports.BuildStateToBase = exports.BStateTo = void 0;
const bstatement_1 = require("./bstatement");
const il_1 = require("../../il");
const sql_1 = require("../sql");
const dbContext_1 = require("../dbContext");
class BStateTo extends bstatement_1.BStatement {
    body(sqls) {
        let buildStateTo = new BuildStateTo(sqls, this.context, this.istatement.no, new sql_1.ExpVar('$id'), this.istatement.to);
        buildStateTo.build();
    }
}
exports.BStateTo = BStateTo;
//let idVal = convertExp(context, idExp) as ExpVal;
class BuildStateToBase {
    constructor(sqls, context, no, idVal, toState) {
        this.sqls = sqls;
        this.context = context;
        this.no = no;
        this.idVal = idVal;
        this.toState = toState;
    }
    get vNewFlow() { return '$newFlow'; }
    get vState() { return '$state'; }
    ;
    get vPreState() { return '$preState'; }
    ;
    get vAction() { return '$action'; }
    ;
    build() {
        let { factory, hasUnit } = this.context;
        let wheres = [];
        wheres.push(new sql_1.ExpEQ(new sql_1.ExpField('id'), this.idVal));
        let where = new sql_1.ExpAnd(...wheres);
        let archive;
        let to = this.toState;
        switch (to) {
            default:
                archive = false;
                break;
            case 'end':
                to = '#';
                archive = true;
                break;
            case 'delete':
                to = '-';
                archive = true;
                break;
            case 'start':
                to = '$';
                archive = false;
                break;
        }
        let sqls = [];
        let set = factory.createSet();
        sqls.push(set);
        set.equ(this.vState, new sql_1.ExpStr(to));
        function selectConst(v) {
            let ret = factory.createSelect();
            ret.column(new sql_1.ExpField('id'));
            ret.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.const));
            ret.where(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpVar(v)));
            return ret;
        }
        let stateIdSelect = selectConst(this.vState);
        let preStateIdSelect = selectConst(this.vPreState);
        let actionIdSelect = selectConst(this.vAction);
        let insert = factory.createInsert();
        sqls.push(insert);
        insert.table = (0, dbContext_1.sysTable)(il_1.EnumSysTable.flow);
        insert.cols = [
            { col: 'sheet', val: this.idVal },
            { col: 'date', val: new sql_1.ExpVar('$date') },
            { col: 'user', val: new sql_1.ExpVar('$user') },
            { col: 'flow', val: new sql_1.ExpVar(this.vNewFlow) },
            { col: 'state', val: new sql_1.ExpSelect(stateIdSelect) },
            { col: 'preState', val: new sql_1.ExpSelect(preStateIdSelect) },
            { col: 'action', val: new sql_1.ExpSelect(actionIdSelect) },
        ];
        let updateFlow = factory.createUpdate();
        sqls.push(updateFlow);
        updateFlow.cols = [
            { col: 'flow', val: new sql_1.ExpVar(this.vNewFlow) },
            { col: 'state', val: new sql_1.ExpSelect(stateIdSelect) },
        ];
        updateFlow.table = this.context.sysTable(il_1.EnumSysTable.sheet);
        updateFlow.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), this.idVal);
        if (archive === true) {
            let select = factory.createSelect();
            sqls.push(select);
            select.into = '$archive';
            if (hasUnit === true)
                select.column(new sql_1.ExpField('$unit'));
            select.column(new sql_1.ExpField('id'))
                .column(new sql_1.ExpField('no'))
                .column(new sql_1.ExpField('user'))
                .column(new sql_1.ExpField('date'))
                .column(new sql_1.ExpField('sheet'))
                .column(new sql_1.ExpField('version'))
                .column(new sql_1.ExpVar(this.vNewFlow))
                .column(new sql_1.ExpField('discription'))
                .column(new sql_1.ExpField('data'));
            select.from(this.context.sysTable(il_1.EnumSysTable.sheet));
            select.where(where);
            let del = factory.createDelete();
            sqls.push(del);
            del.tables = [this.context.sysTable(il_1.EnumSysTable.sheet)];
            del.where(where);
            let whereSheet = new sql_1.ExpEQ(new sql_1.ExpField('sheet'), this.idVal);
            select = factory.createSelect();
            sqls.push(select);
            select.into = '$archive_flow';
            select.column(new sql_1.ExpField('sheet'))
                .column(new sql_1.ExpField('date'))
                .column(new sql_1.ExpField('flow'))
                .column(new sql_1.ExpField('preState'))
                .column(new sql_1.ExpField('action'))
                .column(new sql_1.ExpField('state'))
                .column(new sql_1.ExpField('user'));
            select.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.flow));
            select.where(whereSheet);
            del = factory.createDelete();
            sqls.push(del);
            del.tables = [(0, dbContext_1.sysTable)(il_1.EnumSysTable.flow)];
            del.where(whereSheet);
            del = factory.createDelete();
            sqls.push(del);
            del.tables = [(0, dbContext_1.sysTable)(il_1.EnumSysTable.sheetDetail)];
            del.where(new sql_1.ExpEQ(new sql_1.ExpField('sheet'), this.idVal));
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
exports.BuildStateToBase = BuildStateToBase;
class BuildStateTo extends BuildStateToBase {
    buildPre() {
        return;
    }
}
exports.BuildStateTo = BuildStateTo;
class BuildSheetStateTo extends BuildStateToBase {
    get vNewFlow() { return super.vNewFlow + '_' + this.no; }
    get vState() { return super.vState + '_' + this.no; }
    ;
    get vPreState() { return super.vPreState + '_' + this.no; }
    ;
    get vAction() { return super.vAction + '_' + this.no; }
    ;
    buildPre() {
        let { factory } = this.context;
        let declare = factory.createDeclare();
        this.sqls.push(declare);
        declare.vars((0, il_1.smallIntField)(this.vNewFlow), (0, il_1.charField)(this.vState, 100), (0, il_1.charField)(this.vPreState, 100), (0, il_1.charField)(this.vAction, 100));
        let ta = 'a', tb = 'b', tc = 'c';
        let sel = factory.createSelect();
        this.sqls.push(sel);
        sel.toVar = true;
        sel.column(new sql_1.ExpAdd(new sql_1.ExpField('flow', ta), sql_1.ExpNum.num1), this.vNewFlow)
            .column(new sql_1.ExpField('name', tc), this.vState)
            .column(new sql_1.ExpField('name', tc), this.vPreState);
        sel.from(this.context.sysTable(il_1.EnumSysTable.sheet, ta));
        sel.join(il_1.JoinType.join, (0, dbContext_1.sysTable)(il_1.EnumSysTable.flow, tb))
            .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id', ta), new sql_1.ExpField('sheet', tb)), new sql_1.ExpEQ(new sql_1.ExpField('flow', ta), new sql_1.ExpField('flow', tb))));
        sel.join(il_1.JoinType.join, (0, dbContext_1.sysTable)(il_1.EnumSysTable.const, tc))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('state', tb), new sql_1.ExpField('id', tc)));
        sel.where(new sql_1.ExpEQ(new sql_1.ExpField('id', ta), this.idVal));
        let iff = factory.createIf();
        this.sqls.push(iff);
        iff.cmp = new sql_1.ExpIsNotNull(new sql_1.ExpVar(this.vNewFlow));
        return iff;
    }
}
exports.BuildSheetStateTo = BuildSheetStateTo;
//# sourceMappingURL=stateTo.js.map