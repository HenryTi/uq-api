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
exports.BBizCombo = void 0;
const il_1 = require("../../il");
const consts_1 = require("../consts");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const BizEntity_1 = require("./BizEntity");
class BBizCombo extends BizEntity_1.BBizEntity {
    buildTables() {
        return __awaiter(this, void 0, void 0, function* () {
            const { id, keys, indexes } = this.bizEntity;
            let table = this.createTable(`${this.context.site}.${id}`);
            let keyFields = keys.map(v => (0, il_1.bigIntField)(v.name));
            let idField = (0, il_1.bigIntField)('id');
            table.keys = [idField];
            table.fields = [idField, ...keyFields];
        });
    }
    buildProcedures() {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = this.bizEntity;
            const funcId = this.createFunction(`${this.context.site}.${id}.ID`, new il_1.BigInt());
            this.buildFuncId(funcId);
        });
    }
    buildFuncId(funcId) {
        const { factory } = this.context;
        const { parameters, statements } = funcId;
        const { id, keys } = this.bizEntity;
        parameters.push((0, il_1.tinyIntField)('new'), ...keys.map(v => v.createField()));
        const vId = '$id';
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var(vId, new il_1.BigInt());
        let tbl = new statementWithFrom_1.GlobalTable(consts_1.$site, `${this.context.site}.${id}`);
        const select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.column(new sql_1.ExpField('id'), vId);
        select.from(tbl);
        select.where(new sql_1.ExpAnd(...keys.map(v => {
            const { name } = v;
            return new sql_1.ExpEQ(new sql_1.ExpField(name), new sql_1.ExpVar(name));
        })));
        const iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new sql_1.ExpAnd(new sql_1.ExpIsNull(new sql_1.ExpVar(vId)), new sql_1.ExpNE(new sql_1.ExpVar('new'), sql_1.ExpNum.num0));
        const newId = factory.createSet();
        iff.then(newId);
        let selectEntity = factory.createSelect();
        selectEntity.col('id');
        selectEntity.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.entity, false));
        selectEntity.where(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr('duo')));
        newId.equ(vId, new sql_1.ExpFunc('$IDMU', new sql_1.ExpSelect(selectEntity), sql_1.ExpNull.null));
        const insert = factory.createInsert();
        iff.then(insert);
        insert.table = tbl;
        insert.cols = [
            { col: 'id', val: new sql_1.ExpVar(vId) },
            ...keys.map(v => ({ col: v.name, val: new sql_1.ExpVar(v.name) })),
        ];
        /*
        SET `_$id`=$IDMU((SELECT `id`
        FROM `jksoft_mini_jxc_trial`.`$entity`
        WHERE 1=1 AND `name`='bin' FOR UPDATE), `_$stamp`);
      INSERT INTO `jksoft_mini_jxc_trial`.`bin` (`id`, `base`)
        VALUES (`_$id`, `_base`);
        */
        const ret = factory.createReturn();
        statements.push(ret);
        ret.returnVar = vId;
    }
}
exports.BBizCombo = BBizCombo;
//# sourceMappingURL=BizCombo.js.map