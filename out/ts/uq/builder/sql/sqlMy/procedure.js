"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcedureUpdater = exports.MyProcedure = void 0;
const procedure_1 = require("../procedure");
const lodash_1 = require("lodash");
const il_1 = require("../../../il");
class MyProcedure extends procedure_1.Procedure {
    get dbProcName() { return this.dbContext.twProfix + this.name; }
    createUpdater(runner) {
        return new ProcedureUpdater(this.dbContext, runner, this);
    }
    start(sb) {
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
    end(sb) {
        sb.append('END').semicolon();
    }
    param(sb, p) {
        switch (p.paramType) {
            case il_1.ProcParamType.out:
                sb.append('OUT ');
                break;
            case il_1.ProcParamType.inout:
                sb.append('INOUT ');
                break;
        }
        sb.param(p.name).space();
        p.dataType.sql(sb);
    }
    declareStart(sb) {
        sb.append('DECLARE ');
    }
    declareVar(sb, v) {
        sb.var(v.name).space();
        v.dataType.sql(sb);
    }
    declareEnd(sb) {
        sb.semicolon();
    }
    afterDeclare(sb, tab) {
        if (this.logError) {
            let { hasUnit } = this.dbContext;
            sb.tab(tab).append('DECLARE _$error TEXT').ln();
            sb.tab(tab).append('DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN').n();
            sb.tab(tab + 1).append('GET DIAGNOSTICS CONDITION 1 _$error = MESSAGE_TEXT').ln();
            sb.tab(tab + 1).append('ROLLBACK').ln();
            sb.tab(tab + 1).append('CALL `$uq`.`log_error`(');
            if (hasUnit === true && this.parameters.length > 0)
                sb.var('$unit');
            else
                sb.append(0);
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
            if ((0, lodash_1.isArray)(this.logError) === true) {
                for (let s of this.logError) {
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
exports.MyProcedure = MyProcedure;
class ProcedureUpdater extends procedure_1.ProcedureUpdater {
    buildProcSql() {
        let sb = this.context.factory.createSqlBuilder();
        this.proc.to(sb);
        let sql = sb.sql;
        return sql;
    }
    async updateProc() {
        let sql = this.buildProcSql();
        let procName = this.getUploadProcName();
        await this.uqBuildApi.procSql(procName, sql);
    }
    async updateCoreProc() {
        let sql = this.buildProcSql();
        let procName = this.getUploadProcName();
        await this.uqBuildApi.procCoreSql(procName, sql, this.proc.returnDataType !== undefined);
    }
    getUploadProcName() {
        let { isOldUqApi, twProfix } = this.uqBuildApi;
        let { name } = this.proc;
        if (isOldUqApi === true) {
            return twProfix + name;
        }
        return name;
    }
}
exports.ProcedureUpdater = ProcedureUpdater;
//# sourceMappingURL=procedure.js.map