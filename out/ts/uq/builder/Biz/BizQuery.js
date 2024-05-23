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
exports.BBizQuery = void 0;
const il_1 = require("../../il");
const BizPhraseType_1 = require("../../il/Biz/BizPhraseType");
const bstatement_1 = require("../bstatement");
const sql_1 = require("../sql");
const BizEntity_1 = require("./BizEntity");
class BBizQuery extends BizEntity_1.BBizEntity {
    buildProcedures() {
        const _super = Object.create(null, {
            buildProcedures: { get: () => super.buildProcedures }
        });
        return __awaiter(this, void 0, void 0, function* () {
            _super.buildProcedures.call(this);
            const { id } = this.bizEntity;
            const procQuery = this.createProcedure(`${this.context.site}.${id}q`);
            this.buildQueryProc(procQuery);
        });
    }
    buildQueryProc(proc) {
        const { params, statement, from } = this.bizEntity;
        const site = '$site';
        const json = '$json';
        const varJson = new sql_1.ExpVar(json);
        const { parameters, statements } = proc;
        const { factory } = this.context;
        parameters.push((0, il_1.bigIntField)('$user'), (0, il_1.jsonField)(json), (0, il_1.bigIntField)('$pageStart'), (0, il_1.bigIntField)('$pageSize'));
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var(site, new il_1.BigInt());
        let setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(site, new sql_1.ExpNum(this.context.site));
        for (let param of params) {
            const bud = param;
            const { name } = bud;
            declare.var(name, new il_1.Char(200));
            let set = factory.createSet();
            statements.push(set);
            set.equ(name, new sql_1.ExpFunc('JSON_VALUE', varJson, new sql_1.ExpStr(`$."${name}"`)));
        }
        let sqls = new bstatement_1.Sqls(this.context, statements);
        let { statements: queryStatements } = statement;
        sqls.head(queryStatements);
        sqls.body(queryStatements);
        sqls.foot(queryStatements);
        this.buildFrom(statements, from.fromEntity);
    }
    buildFrom(statements, fromEntity) {
        let { subs, bizPhraseType, bizEntityArr } = fromEntity;
        switch (bizPhraseType) {
            default: break;
            case BizPhraseType_1.BizPhraseType.atom:
                this.buildAtom(statements, bizEntityArr);
                break;
            case BizPhraseType_1.BizPhraseType.spec:
                this.buildSpec(statements, bizEntityArr);
                break;
        }
        if (subs !== undefined) {
            for (let sub of subs) {
                this.buildFrom(statements, sub);
            }
        }
    }
    buildAtom(statements, entityArr) {
        const { factory } = this.context;
        let insertAtom = factory.createInsert();
        statements.push(insertAtom);
        let entity = entityArr[0];
        const { titleBuds, primeBuds } = entity;
        for (let bud of titleBuds)
            this.buildInsertBud(statements, entity, bud);
        for (let bud of primeBuds)
            this.buildInsertBud(statements, entity, bud);
    }
    buildSpec(statements, entityArr) {
        for (let spec of entityArr) {
            for (let [, bud] of spec.props) {
                this.buildInsertBud(statements, spec, bud);
            }
        }
    }
    buildInsertBud(statements, entity, bud) {
        const { factory } = this.context;
        let insertBud = factory.createInsert();
        statements.push(insertBud);
    }
}
exports.BBizQuery = BBizQuery;
//# sourceMappingURL=BizQuery.js.map