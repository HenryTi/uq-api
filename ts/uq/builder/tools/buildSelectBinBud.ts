import {
    BigInt, BizBud, BizBudIDBase, BizBudIXBase, bizDecType, Char, DataType
    , Dec, EnumDataType, EnumSysTable, JoinType, JsonDataType
} from "../../il";
import { BudDataType } from "../../il/Biz/BizPhraseType";
import { DbContext } from "../dbContext";
import { ExpAnd, ExpEQ, ExpField, ExpFunc, ExpNum, ExpVal, Select, Statement } from "../sql";
import { EntityTable } from "../sql/statementWithFrom";

const a = 'a', b = 'b';

export function buildSelectBinBud(context: DbContext, bud: BizBud, varBin: ExpVal, varName?: string) {
    const { factory } = context;
    const bigint = new BigInt();
    const decValue = bizDecType;
    const str = new Char(200);
    const json = new JsonDataType();
    let declare = factory.createDeclare();
    let statements: Statement[] = [declare];

    const { name, dataType } = bud;
    if (varName === undefined) varName = name;
    let declareType: DataType;
    let selectBud: Select;
    switch (dataType) {
        default: throw new Error('unknown type ' + BudDataType[dataType]);
        case BudDataType.none:
            return [];
        case BudDataType.atom:
            if ((bud as BizBudIDBase).isIxBase === true) {
                selectBud = buildSelectBudIxBase(bud as BizBudIXBase);
            }
            else {
                selectBud = buildSelectBudValue(bud, EnumSysTable.ixInt);
            }
            declareType = bigint;
            break;
        case BudDataType.fork:
            selectBud = buildSelectBudValue(bud, EnumSysTable.ixJson);
            declareType = json;
            break;
        case BudDataType.ID:
        case BudDataType.date:
        case BudDataType.int:
        case BudDataType.radio:
        case BudDataType.bin:
            selectBud = buildSelectBudValue(bud, EnumSysTable.ixInt);
            declareType = bigint;
            break;
        case BudDataType.str:
        case BudDataType.char:
            selectBud = buildSelectBudValue(bud, EnumSysTable.ixStr);
            declareType = str;
            break;
        case BudDataType.dec:
            selectBud = buildSelectBudValue(bud, EnumSysTable.ixDec);
            declareType = decValue;
            break;
        case BudDataType.check:
            selectBud = buildSelectBudIx(bud, false);
            declareType = json;
            break;
    }
    statements.push(selectBud);
    declare.var(varName, declareType);
    return statements;

    function buildSelectBudValue(bud: BizBud, tbl: EnumSysTable): Select {
        let selectBud = factory.createSelect();
        selectBud.toVar = true;
        selectBud.col('value', varName, a);
        selectBud.from(new EntityTable(tbl, false, a));
        selectBud.where(new ExpAnd(
            new ExpEQ(new ExpField('i', a), varBin),
            new ExpEQ(new ExpField('x', a), new ExpNum(bud.id)),
        ));
        return selectBud;
    }

    function buildSelectBudIx(bud: BizBud, isRadio: boolean): Select {
        const { name: budName } = bud;
        let selectBud = factory.createSelect();
        selectBud.toVar = true;
        let exp: ExpVal = isRadio === true ?
            new ExpField('x', a)
            : new ExpFunc('JSON_ARRAYAGG', new ExpField('x', a));
        selectBud.column(exp, budName);
        selectBud.from(new EntityTable(EnumSysTable.ix, false, a));
        selectBud.where(new ExpEQ(new ExpField('i', a), varBin));
        return selectBud;
    }

    function buildSelectBudIxBase(bud: BizBudIXBase): Select {
        const { name: budName } = bud;
        let selectBud = factory.createSelect();
        selectBud.toVar = true;
        selectBud.column(new ExpField('base', b), budName);
        selectBud.from(new EntityTable(EnumSysTable.bizBin, false, a))
            .join(JoinType.join, new EntityTable(EnumSysTable.idu, false, b))
            .on(new ExpEQ(new ExpField('id', b), new ExpField(budName.substring(0, 1), a)));
        selectBud.where(new ExpEQ(new ExpField('id', a), varBin));
        return selectBud;
    }
}
