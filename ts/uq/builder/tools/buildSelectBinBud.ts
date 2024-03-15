import { BigInt, BizBud, BudDataType, Char, DataType, Dec, EnumDataType, EnumSysTable, JsonDataType } from "../../il";
import { DbContext } from "../dbContext";
import { ExpAnd, ExpEQ, ExpField, ExpFunc, ExpNum, ExpVal, Select, Statement } from "../sql";
import { EntityTable } from "../sql/statementWithFrom";

const a = 'a';

export function buildSelectBinBud(context: DbContext, bud: BizBud, varBin: ExpVal) {
    const { factory } = context;
    const bigint = new BigInt();
    const decValue = new Dec(18, 6);
    const str = new Char(200);
    const json = new JsonDataType();
    let declare = factory.createDeclare();
    let statements: Statement[] = [declare];

    const { name, dataType } = bud;
    let declareType: DataType;
    let selectBud: Select;
    switch (dataType) {
        default: throw new Error('unknown type ' + EnumDataType[dataType]);
        case BudDataType.none:
            return;
        case BudDataType.ID:
        case BudDataType.atom:
        case BudDataType.date:
        case BudDataType.int:
            selectBud = buildSelectBudValue(bud, EnumSysTable.ixBudInt);
            declareType = bigint;
            break;
        case BudDataType.str:
        case BudDataType.char:
            selectBud = buildSelectBudValue(bud, EnumSysTable.ixBudStr);
            declareType = str;
            break;
        case BudDataType.dec:
            selectBud = buildSelectBudValue(bud, EnumSysTable.ixBudDec);
            declareType = decValue;
            break;
        case BudDataType.radio:
            selectBud = buildSelectBudIx(bud, true);
            declareType = bigint;
            break;
        case BudDataType.check:
            selectBud = buildSelectBudIx(bud, false);
            declareType = json;
            break;
    }
    statements.push(selectBud);
    declare.var(name, declareType);
    return statements;

    function buildSelectBudValue(bud: BizBud, tbl: EnumSysTable): Select {
        let selectBud = factory.createSelect();
        selectBud.toVar = true;
        selectBud.col('value', bud.name, a);
        selectBud.from(new EntityTable(tbl, false, a));
        selectBud.where(new ExpAnd(
            new ExpEQ(new ExpField('i', a), varBin),
            new ExpEQ(new ExpField('x', a), new ExpNum(bud.id)),
        ));
        return selectBud;
    }

    function buildSelectBudIx(bud: BizBud, isRadio: boolean): Select {
        let selectBud = factory.createSelect();
        selectBud.toVar = true;
        let exp: ExpVal = isRadio === true ?
            new ExpField('x', a)
            : new ExpFunc('JSON_ARRAYAGG', new ExpField('x', a));
        selectBud.column(exp, bud.name);
        selectBud.from(new EntityTable(EnumSysTable.ixBud, false, a));
        selectBud.where(new ExpEQ(new ExpField('i', a), varBin));
        return selectBud;
    }
}
