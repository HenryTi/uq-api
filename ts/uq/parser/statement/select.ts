import { Space } from '../space';
import { Token } from '../tokens';
import { SelectSpace } from '../select';
import { SelectStatement, Select, Return, Column, ValueExpression, Field, Queue, OpTypeof } from '../../il';
import { PStatement } from '../PStatement';
import { PContext } from '../pContext';
import { TokenStream } from '../tokens';

export class PSelectStatement extends PStatement {
    selectStatement: SelectStatement;
    constructor(selectStatement: SelectStatement, context: PContext) {
        super(selectStatement, context);
        this.selectStatement = selectStatement;
    }

    protected _parse() {
        let select = this.selectStatement.select = new Select();
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
            this.ts.passToken(Token.LPARENTHESE);
            let cteSelect = new Select();
            this.ts.passKey('select');
            this.context.parseElement(cteSelect);
            this.ts.passToken(Token.RPARENTHESE);
            select.cte = {
                recursive,
                alias,
                select: cteSelect,
            };
        }
        this.ts.passKey('select');
        this.context.parseElement(select);
        this.ts.passToken(Token.SEMICOLON);
    }

    preScan(space: Space): boolean {
        let { select, into } = this.selectStatement;
        let table = space.getEntityTable(into);
        if (table) {
            return true;
        }
        let ret: Return = space.getLocalTable(into) as any;
        if (ret === undefined) {
            this.log(`into ${into} is not defined`)
            return false;
        }
        let cols: Column[] = [];
        let { columns } = select;
        let len = columns.length;
        let p = 0;
        let sharpFields = ret?.sharpFields;
        if (sharpFields === undefined) sharpFields = [];
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
                let value = new ValueExpression(); //.var([alias, fn]);
                let ts = new TokenStream(this.ts.log, alias + '.' + fn);
                ts.file = `${this.ts.file} * ${alias}`;
                ts.readToken();
                let pContent = new PContext(ts);
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

    scan(space: Space): boolean {
        let ok = true;
        let { select, into, ignore } = this.selectStatement;
        let entity = space.getEntity(into);
        if (entity?.type === 'queue') {
            select.intoQueue = entity as Queue;
            let { columns } = select;
            if (columns.length !== 1) {
                ok = false;
                this.log('INTO QUEUE 只能有一个列');
            }
            columns[0].alias = 'value';
            let value = new ValueExpression();
            let opEntity = new OpTypeof();
            opEntity.entity = entity;
            value.atoms.push(opEntity);
            columns.push(
                {
                    alias: 'queue',
                    value,
                }
            );
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
        let theSpace = new SelectSpace(space, select);

        if (select.pelement.scan(theSpace) == false) ok = false;
        select.ignore = ignore;
        return ok;
    }

    private checkColumns(select: Select, tblName: string, fields: Field[]): boolean {
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
