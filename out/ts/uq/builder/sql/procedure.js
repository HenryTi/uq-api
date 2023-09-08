"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcedureUpdater = exports.Procedure = void 0;
class Procedure {
    constructor(dbContext, dbName, name, isCore = false, returnType) {
        this.tab = 0;
        this.trans = false;
        this.transCommit = false;
        this.parameters = [];
        this.statements = [];
        this.hasGroupConcat = false;
        this.errLog = {}; // 表达式
        this.logError = false;
        this.dbContext = dbContext;
        this.dbName = dbName;
        this.name = name;
        this.isCore = isCore;
        this.returnDataType = returnType;
    }
    createTransaction() {
        this.trans = true;
        this.logError = true;
        return this.dbContext.factory.createTransaction();
    }
    createCommit() {
        if (this.trans === true) {
            this.transCommit = true;
            return this.dbContext.factory.createCommit();
        }
    }
    createLeaveProc() {
        let ret = this.dbContext.factory.createLeaveProc();
        ret.withCommit = this.trans;
        this.transCommit = this.trans;
        return ret;
    }
    checkTrans() {
        if (this.trans === true && this.transCommit === true ||
            this.trans === false && this.transCommit === false)
            return;
        throw `procedure ${this.dbProcName} tansaction and commit miss match`;
    }
    addUnitParameter() {
        let { unitField } = this.dbContext;
        //if (unitField !== undefined) 
        this.parameters.push(unitField);
    }
    addUserParameter() {
        this.parameters.push(this.dbContext.userParam);
    }
    addUnitUserParameter() {
        let { unitField, userParam } = this.dbContext;
        this.parameters.push(unitField);
        this.parameters.push(userParam);
    }
    to(sb) {
        let tab = this.tab + 1;
        this.start(sb);
        let vars = {};
        for (let s of this.statements) {
            if (s === undefined)
                continue;
            s.declare(vars);
        }
        this.declare(sb, tab, vars);
        this.afterDeclare(sb, tab);
        for (let s of this.statements) {
            if (s === undefined)
                continue;
            s.to(sb, tab);
        }
        this.end(sb);
    }
    buildParameters(sb) {
        let first = true;
        let tab = this.tab + 1;
        for (let p of this.parameters) {
            if (first === true)
                first = false;
            else
                sb.comma().n();
            sb.tab(tab);
            this.param(sb, p);
        }
    }
    declare(sb, tab, vars) {
        //if (vars.length === 0) return;
        sb.tab(tab);
        /*
        this.declareStart(sb);
        this.declareVar(sb, vars[0]);
        let len = vars.length;
        this.declareEnd(sb);
        for (let i=1; i<len; i++) {
            this.declareStart(sb);
            this.declareVar(sb, vars[i]);
            this.declareEnd(sb);
            if (sb.pos > sb.lineLen) sb.nTab();
        }
        */
        for (let i in vars) {
            let v = vars[i];
            this.declareStart(sb);
            this.declareVar(sb, v);
            this.declareEnd(sb);
            if (sb.pos > sb.lineLen)
                sb.nTab();
        }
        sb.n();
    }
}
exports.Procedure = Procedure;
class ProcedureUpdater {
    constructor(context, /*uqBuildApi: UqBuildApi, */ proc) {
        this.context = context;
        // this.uqBuildApi = uqBuildApi;
        this.proc = proc;
    }
}
exports.ProcedureUpdater = ProcedureUpdater;
//# sourceMappingURL=procedure.js.map