import { Procedure, ProcedureUpdater as CommonProcedureUpdater } from '../procedure';
import * as il from '../../../il';
import { SqlBuilder } from '../sqlBuilder';
import { isArray } from 'lodash';
import { ExpStr, ExpVal, ExpVar, Statement } from '..';
import { ProcParamType } from '../../../il';
import { EntityRunner } from '../../../../core';

export class MyProcedure extends Procedure {
    get dbProcName() { return this.dbContext.twProfix + this.name }
    protected createUpdater(runner: EntityRunner): ProcedureUpdater {
        return new ProcedureUpdater(this.dbContext, runner, this)
    }
    protected buildDrop(sb: SqlBuilder): void {
        sb.append('DROP ');
        sb.append(this.returnDataType !== undefined ? 'FUNCTION' : 'Procedure');
        sb.append(' IF Exists `')
            .append(this.dbName)
            .append('`.`')
            .append(this.dbProcName).append('`;');
    }
    protected start(sb: SqlBuilder) {
        sb.append('CREATE ');
        sb.append(this.returnDataType === undefined ? 'PROCEDURE' : 'FUNCTION');
        sb.append(' `').append(this.dbName).append('`.`')
            .append(this.dbProcName).append('` (').n();
        this.buildParameters(sb);
        sb.r().n();
        if (this.returnDataType !== undefined) {
            sb.append('RETURNS ');
            this.returnDataType.sql(sb);
            sb.n();
            sb.append('LANGUAGE SQL DETERMINISTIC MODIFIES SQL DATA').n();
        }
        sb.append('__proc_exit: BEGIN').n();
    }
    protected end(sb: SqlBuilder) {
        sb.append('END').semicolon();
    }
    protected param(sb: SqlBuilder, p: il.Field) {
        switch (p.paramType) {
            case ProcParamType.out: sb.append('OUT '); break;
            case ProcParamType.inout: sb.append('INOUT '); break;
        }
        sb.param(p.name).space();
        p.dataType.sql(sb);
    }
    protected declareStart(sb: SqlBuilder) {
        sb.append('DECLARE ');
    }
    protected returnPuts(sb: SqlBuilder, tab: number, puts: { [put: string]: boolean }) {
        let params: ExpVal[] = [];
        for (let i in puts) {
            params.push(new ExpStr(i), new ExpVar('$ret$' + i));
        }
        if (params.length > 0) {
            sb.tab(tab);
            sb.append('SELECT JSON_OBJECT(');
            let first = true;
            for (let p of params) {
                if (first === true) {
                    first = false;
                }
                else {
                    sb.comma();
                }
                sb.exp(p);
            }
            sb.r().append(' AS $ret').ln();
        }
    }
    protected declareVar(sb: SqlBuilder, v: il.Field) {
        sb.var(v.name).space();
        v.dataType.sql(sb);
    }
    protected declareEnd(sb: SqlBuilder) {
        sb.semicolon();
    }
    protected afterDeclare(sb: SqlBuilder, tab: number) {
        if (this.logError) {
            let { hasUnit } = this.dbContext;
            sb.tab(tab).append('DECLARE _$error TEXT').ln();
            sb.tab(tab).append('DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN').n();
            sb.tab(tab + 1).append('GET DIAGNOSTICS CONDITION 1 _$error = MESSAGE_TEXT').ln();
            sb.tab(tab + 1).append('ROLLBACK').ln();
            sb.tab(tab + 1).append('CALL `$uq`.`log_error`(');
            if (hasUnit === true && this.parameters.length > 0) sb.var('$unit');
            else sb.append(0);
            sb.comma();
            sb.append('\'').append(this.dbContext.dbName).append('\'');
            sb.comma();
            let { subject, content } = this.errLog;
            if (subject !== undefined) {
                sb.append('concat(\'sql-error: \',').exp(subject).append(')');
            }
            else {
                sb.append('\'sql-error ').append(this.dbProcName).append('\'');
            }
            sb.comma();
            sb.append('concat(_$error');
            if (content !== undefined) {
                sb.append(',\'\\n\',').exp(content);
            }
            sb.append(',@$_error)');
            sb.r().ln();
            if (isArray(this.logError) === true) {
                for (let s of this.logError as Statement[]) {
                    s.to(sb, tab + 1);
                }
            }
            sb.tab(tab + 1).append('RESIGNAL').ln();
            sb.tab(tab).append('END').ln();
            sb.tab(tab).append('SET @$_error=\'\'').ln();
        }
        if (this.hasGroupConcat === true) {
            sb.tab(tab).append('SET SESSION group_concat_max_len=100000').semicolon().n();
        }
    }
}

export class ProcedureUpdater extends CommonProcedureUpdater {
    private buildProcSql() {
        let sb = this.context.factory.createSqlBuilder();
        this.proc.to(sb);
        let sql = sb.sql;
        return sql;
    }

    private buildDropSql() {
        let sb = this.context.factory.createSqlBuilder();
        this.proc.drop(sb);
        let sql = sb.sql;
        return sql;
    }

    protected async updateProc() {
        let sqlDrop = this.buildDropSql();
        await this.uqBuildApi.sql(sqlDrop, undefined);
        if (this.proc.dropOnly === true) return;
        let sql = this.buildProcSql();
        let procName = this.getUploadProcName();
        await this.uqBuildApi.procSql(procName, sql);
    }

    protected async updateCoreProc() {
        let sqlDrop = this.buildDropSql();
        await this.uqBuildApi.sql(sqlDrop, undefined);
        if (this.proc.dropOnly === true) return;
        let sql = this.buildProcSql();
        let procName = this.getUploadProcName();
        await this.uqBuildApi.procCoreSql(procName, sql, this.proc.returnDataType !== undefined);
    }

    private getUploadProcName() {
        let { isOldUqApi, twProfix } = this.uqBuildApi;
        let { name } = this.proc;
        if (isOldUqApi === true) {
            return twProfix + name;
        }
        return name;
    }
}
