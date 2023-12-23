import { SqlBuilder } from './sqlBuilder';
import { Statement, Transaction, Commit, LeaveProc } from './statement';
import { DataType, Field } from '../../il';
import { CompileOptions, DbContext, ObjSchema } from '../dbContext';
// import { UqBuildApi } from '../../../core';
// import { CompileOptions } from '../../../compile';
import { Statement as SqlStatement } from '../sql';
import { Exp } from './exp';
import { EntityRunner } from '../../../core';

export abstract class Procedure implements ObjSchema {
    protected dbContext: DbContext;
    protected tab = 0;
    protected trans: boolean = false;
    protected transCommit: boolean = false;
    readonly dbName: string;
    readonly name: string;
    readonly isCore: boolean;
    readonly parameters: Field[] = [];
    readonly statements: SqlStatement[] = [];
    readonly returnDataType: DataType;
    constructor(dbContext: DbContext, dbName: string, name: string, isCore: boolean = false, returnType?: DataType) {
        this.dbContext = dbContext;
        this.dbName = dbName;
        this.name = name;
        this.isCore = isCore;
        this.returnDataType = returnType;
    }

    dropOnly: boolean = false;
    hasGroupConcat: boolean = false;
    errLog: { subject?: Exp; content?: Exp } = {}; // 表达式
    logError: boolean | Statement[] = false;

    createTransaction(): Transaction {
        this.trans = true;
        this.logError = true;
        return this.dbContext.factory.createTransaction();
    }

    createCommit(): Commit {
        if (this.trans === true) {
            this.transCommit = true;
            return this.dbContext.factory.createCommit();
        }
    }

    createLeaveProc(): LeaveProc {
        let ret = this.dbContext.factory.createLeaveProc();
        ret.withCommit = this.trans;
        this.transCommit = this.trans;
        return ret;
    }

    checkTrans() {
        if (this.trans === true && this.transCommit === true ||
            this.trans === false && this.transCommit === false) return;
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

    drop(sb: SqlBuilder) {
        this.buildDrop(sb);
    }

    to(sb: SqlBuilder) {
        let tab = this.tab + 1;
        this.buildDrop(sb);
        this.start(sb);
        let vars: { [name: string]: Field } = {};
        let puts: { [name: string]: boolean } = {};
        for (let s of this.statements) {
            if (s === undefined) continue;
            s.declare(vars, puts);
        }
        this.declare(sb, tab, vars);
        this.afterDeclare(sb, tab);
        for (let s of this.statements) {
            if (s === undefined) continue;
            s.to(sb, tab);
        }
        // this.returnPuts(sb, tab, puts);
        this.end(sb);
    }

    buildParameters(sb: SqlBuilder) {
        let first = true;
        let tab = this.tab + 1;
        for (let p of this.parameters) {
            if (first === true) first = false;
            else sb.comma().n();
            sb.tab(tab);
            this.param(sb, p);
        }
    }

    abstract get dbProcName(): string;

    async updateDb(runner: EntityRunner, options: CompileOptions): Promise<string> {
        this.checkTrans();
        let updater = this.createUpdater(runner);
        return await updater.update(options);
    }

    async coreUpdateDb(runner: EntityRunner, options: CompileOptions): Promise<string> {
        this.checkTrans();
        let updater = this.createUpdater(runner);
        return await updater.updateCore(options);
    }

    protected abstract createUpdater(runner: EntityRunner): ProcedureUpdater;
    protected abstract buildDrop(sb: SqlBuilder): void;
    protected abstract start(sb: SqlBuilder): void;
    protected abstract end(sb: SqlBuilder): void;
    protected abstract param(sb: SqlBuilder, p: Field): void;
    // protected abstract returnPuts(sb: SqlBuilder, tab: number, puts: { [put: string]: boolean }): void;
    protected abstract declareStart(sb: SqlBuilder): void;
    protected abstract declareVar(sb: SqlBuilder, v: Field): void;
    protected abstract declareEnd(sb: SqlBuilder): void;

    protected abstract afterDeclare(sb: SqlBuilder, tab: number): void;

    private declare(sb: SqlBuilder, tab: number, vars: { [name: string]: Field }) {
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
            if (sb.pos > sb.lineLen) sb.nTab();
        }
        sb.n();
    }
    /*
    private tables(sb: SqlBuilder, tab:number, tables: VarTable[]) {
        if (tables.length === 0) return;
        for (let t of tables) t.toDeclare(sb, tab);
    }
    */
}

export abstract class ProcedureUpdater {
    protected context: DbContext;
    protected uqBuildApi: EntityRunner;
    protected proc: Procedure;
    constructor(context: DbContext, uqBuildApi: EntityRunner, proc: Procedure) {
        this.context = context;
        this.uqBuildApi = uqBuildApi;
        this.proc = proc;
    }

    async update(options: CompileOptions): Promise<string> {
        try {
            if (this.proc.isCore === true)
                await this.updateCoreProc(options);
            else
                await this.updateProc(options);
            return;
        }
        catch (err) {
            return err;
        }
    }

    async updateCore(options: CompileOptions): Promise<string> {
        try {
            await this.updateCoreProc(options);
            return;
        }
        catch (err) {
            return err;
        }
    }

    protected abstract updateProc(options: CompileOptions): Promise<void>;
    protected abstract updateCoreProc(options: CompileOptions): Promise<void>;
}
