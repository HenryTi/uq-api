"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PSelectStatement = void 0;
const tokens_1 = require("../tokens");
const select_1 = require("../select");
const il_1 = require("../../il");
const statement_1 = require("./statement");
const pContext_1 = require("../pContext");
const tokens_2 = require("../tokens");
class PSelectStatement extends statement_1.PStatement {
    constructor(selectStatement, context) {
        super(selectStatement, context);
        this.selectStatement = selectStatement;
    }
    _parse() {
        let select = this.selectStatement.select = new il_1.Select();
        if (this.ts.isKeyword('ignore') === true) {
            select.ignore = true;
            this.ts.readToken();
        }
        if (this.ts.isKeyword('with') === true) {
            this.ts.readToken();
            let recursive = false;
            if (this.ts.isKeyword('recursive') === true) {
                recursive = true;
                this.ts.readToken();
            }
            let alias = this.ts.passVar();
            this.ts.passKey('as');
            this.ts.passToken(tokens_1.Token.LPARENTHESE);
            let cteSelect = new il_1.Select();
            this.ts.passKey('select');
            this.context.parseElement(cteSelect);
            this.ts.passToken(tokens_1.Token.RPARENTHESE);
            select.cte = {
                recursive,
                alias,
                select: cteSelect,
            };
        }
        this.ts.passKey('select');
        this.context.parseElement(select);
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
    preScan(space) {
        let { select, into } = this.selectStatement;
        let table = space.getEntityTable(into);
        if (table) {
            return true;
        }
        let ret = space.getLocalTable(into);
        if (ret === undefined) {
            this.log(`into ${into} is not defined`);
            return false;
        }
        let cols = [];
        let { columns } = select;
        let len = columns.length;
        let p = 0;
        let sharpFields = ret === null || ret === void 0 ? void 0 : ret.sharpFields;
        if (sharpFields === undefined)
            sharpFields = [];
        for (let i = 0; i < len; i++) {
            let col = columns[i];
            if (col.value !== undefined) {
                cols.push(col);
                continue;
            }
            let { alias } = col;
            let sharpField = sharpFields[p];
            if (sharpField === undefined) {
                this.log('# fields not defined 1');
                return false;
            }
            let { fields } = sharpField;
            if (fields === undefined || fields.length === 0) {
                this.log('# fields not defined 2');
                return false;
            }
            for (let f of fields) {
                let fn = f.name;
                let value = new il_1.ValueExpression(); //.var([alias, fn]);
                let ts = new tokens_2.TokenStream(this.ts.log, alias + '.' + fn);
                ts.file = `${this.ts.file} * ${alias}`;
                ts.readToken();
                let pContent = new pContext_1.PContext(ts);
                value.parser(pContent).parse();
                cols.push({
                    alias: fn,
                    value,
                });
            }
            ++p;
        }
        columns.splice(0, len, ...cols);
        return true;
    }
    scan(space) {
        let ok = true;
        let { select, into, ignore } = this.selectStatement;
        let entity = space.getEntity(into);
        if ((entity === null || entity === void 0 ? void 0 : entity.type) === 'queue') {
            select.intoQueue = entity;
            let { columns } = select;
            if (columns.length !== 1) {
                ok = false;
                this.log('INTO QUEUE 只能有一个列');
            }
            columns[0].alias = 'value';
            let value = new il_1.ValueExpression();
            let opEntity = new il_1.OpTypeof();
            opEntity.entity = entity;
            value.atoms.push(opEntity);
            columns.push({
                alias: 'queue',
                value,
            });
        }
        else {
            let ret = select.intoTable = space.getLocalTable(into);
            if (ret) {
                if (this.checkColumns(select, ret.name, ret.fields) === false) {
                    ok = false;
                }
            }
            else {
                let entityTable = space.getEntityTable(into);
                if (entityTable) {
                    if (this.checkColumns(select, entityTable.name, entityTable.getFields()) === false) {
                        ok = false;
                    }
                    select.intoEntityTable = entityTable;
                }
                else {
                    this.log('没有定义 ' + into);
                    ok = false;
                }
            }
        }
        let theSpace = new select_1.SelectSpace(space, select);
        if (select.pelement.scan(theSpace) == false)
            ok = false;
        select.ignore = ignore;
        return ok;
    }
    checkColumns(select, tblName, fields) {
        let ok = true;
        let columns = select.columns;
        let len = columns.length;
        // into table select 列数是允许不相等的
        for (let i = 0; i < len; i++) {
            let col = columns[i].alias;
            let field = fields.find(f => f.name === col);
            if (field === undefined) {
                this.log('select第' + (i + 1) + '列是' + col + ', 没有into table的对应列');
                ok = false;
            }
        }
        let fLen = fields.length;
        if (len !== fLen) {
            if (len + 1 === fLen && fields.findIndex(f => f.sName === '$order') >= 0) {
            }
            else {
                this.log(`提醒：SELECT列数${len}跟'${tblName}'的列数${fLen}不相等`);
                this.log(`SELECT: ` + columns.map(col => col.alias).join(', '));
                this.log(`INTO: ` + fields.map(f => f.sName).join(', '));
            }
            // 仅仅提醒，不报错
            // ok = false;
        }
        if (ok === true) {
            //ret.statements.push({no:this.statement.no, level:this.statement.level});
        }
        return ok;
    }
}
exports.PSelectStatement = PSelectStatement;
//# sourceMappingURL=select.js.map