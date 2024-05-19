import {
    BigInt, BizBud, BizBudIDBase, BizBudIXBase, Char, DataType
    , Dec, EnumDataType, EnumSysTable, JoinType, JsonDataType
} from "../../il";
import { BudDataType } from "../../il/Biz/BizPhraseType";
import { DbContext } from "../dbContext";
import { ExpAnd, ExpEQ, ExpField, ExpFunc, ExpNum, ExpVal, Select, Statement } from "../sql";
import { EntityTable } from "../sql/statementWithFrom";

const a = 'a', b = 'b';

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
            return [];
        case BudDataType.atom:
            if ((bud as BizBudIDBase).isIxBase === true) {
                selectBud = buildSelectBudIxBase(bud as BizBudIXBase);
            }
            else {
                selectBud = buildSelectBudValue(bud, EnumSysTable.ixBudInt);
            }
            declareType = bigint;
            break;
        case BudDataType.ID:
        case BudDataType.date:
        case BudDataType.int:
        case BudDataType.radio:
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
        /*
        case BudDataType.radio:
            selectBud = buildSelectBudIx(bud, true);
            declareType = bigint;
            break;
        */
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

    function buildSelectBudIxBase(bud: BizBudIXBase): Select {
        const { name: budName } = bud;
        let selectBud = factory.createSelect();
        selectBud.toVar = true;
        selectBud.column(new ExpField('base', b), budName);
        selectBud.from(new EntityTable(EnumSysTable.bizBin, false, a))
            .join(JoinType.join, new EntityTable(EnumSysTable.spec, false, b))
            .on(new ExpEQ(new ExpField('id', b), new ExpField(budName.substring(1), a)));
        selectBud.where(new ExpEQ(new ExpField('id', a), varBin));
        return selectBud;
    }
}
