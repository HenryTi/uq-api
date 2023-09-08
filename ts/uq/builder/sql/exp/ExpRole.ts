import { JoinType } from '../../../il';
import { DbContext, EnumSysTable, sysTable } from '../../dbContext';
import { Select } from '../select';
import { SqlBuilder } from "../sqlBuilder";
import { EntityTable } from "../statementWithFrom";
import { Exp } from './Exp';
import { ExpAnd, ExpBitAnd, ExpEQ, ExpField, ExpFuncInUq, ExpNum, ExpStr, ExpVal, ExpVar } from "./exps";

export class ExpRole extends Exp {
    private readonly role: string;
    private readonly valUnit: ExpVal;
    constructor(role: string, valUnit: ExpVal) {
        super();
        this.role = role;
        this.valUnit = valUnit;
    }
    to(sb: SqlBuilder) {
        let { factory } = sb;
        let tblUserSite = sysTable(EnumSysTable.userSite);
        sb.l();
        let select = factory.createSelect();
        if (this.role === 'owner') {
            buildAdminOwner(select, ExpNum.num2);
        }
        else if (this.role === 'admin') {
            buildAdminOwner(select, ExpNum.num1);
        }
        else {
            buildRole(select);
        }
        sb.exists(select);
        sb.r();

        function buildAdminOwner(select: Select, adminOrOwner: ExpVal) {
            select.col('user');
            select.from(tblUserSite);
            select.where(
                new ExpAnd(
                    new ExpEQ(new ExpField('unit'), this.valUnit ?? ExpNum.num0),
                    new ExpEQ(new ExpField('user'), new ExpVar('$user')),
                    new ExpEQ(
                        new ExpBitAnd(new ExpField('admin'), adminOrOwner),
                        adminOrOwner
                    )
                )
            );
        }

        function buildRole(select: Select) {
            let a = 'a';
            let b = 'b';
            select.col('user', a);
            select.from(tblUserSite);
            select.join(JoinType.join, new EntityTable('$ixrole', false, b))
                .on(new ExpEQ(new ExpField('id', a), new ExpField('i', b)));
            select.where(
                new ExpAnd(
                    new ExpEQ(new ExpField('site', a), this.valUnit ?? ExpNum.num0),
                    new ExpEQ(new ExpField('user', a), new ExpVar('$user')),
                    new ExpEQ(new ExpField('x', b), new ExpFuncInUq('$textid', [new ExpStr(this.role)], true))
                )
            );
        }
    }
}

