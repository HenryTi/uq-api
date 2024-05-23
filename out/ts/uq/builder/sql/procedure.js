"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcedureUpdater = exports.Procedure = void 0;
class Procedure {
    constructor(dbContext, dbName, name, isCore = false, returnType) {
        this.tab = 0;
        this.trans = false;
        this.transCommit = false;
        this.parameters = [];
        this.statements = [];
        this.dropOnly = false;
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
    drop(sb) {
        this.buildDrop(sb);
    }
    to(sb) {
        let tab = this.tab + 1;
        this.buildDrop(sb);
        this.start(sb);
        let vars = {};
        let puts = {};
        for (let s of this.statements) {
            if (s === undefined)
                continue;
            s.declare(vars, puts);
        }
        this.declare(sb, tab, vars);
        this.afterDeclare(sb, tab);
        for (let s of this.statements) {
            if (s === undefined)
                continue;
            s.to(sb, tab);
        }
        // this.returnPuts(sb, tab, puts);
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
    updateDb(runner, options) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkTrans();
            let updater = this.createUpdater(runner);
            return yield updater.update(options);
        });
    }
    coreUpdateDb(runner, options) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkTrans();
            let updater = this.createUpdater(runner);
            return yield updater.updateCore(options);
        });
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
    constructor(context, uqBuildApi, proc) {
        this.context = context;
        this.uqBuildApi = uqBuildApi;
        this.proc = proc;
    }
    update(options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.proc.isCore === true)
                    yield this.updateCoreProc(options);
                else
                    yield this.updateProc(options);
                return;
            }
            catch (err) {
                return err;
            }
        });
    }
    updateCore(options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.updateCoreProc(options);
                return;
            }
            catch (err) {
                return err;
            }
        });
    }
}
exports.ProcedureUpdater = ProcedureUpdater;
//# sourceMappingURL=procedure.js.map