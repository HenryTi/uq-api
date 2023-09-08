import { Space } from '../space';
import { Token } from '../tokens';
import { Act, Proc, ScheduleStatement, ValueExpression } from '../../il';
import { PStatement } from './statement';
import { PContext } from '../pContext';

export class PScheduleStatement extends PStatement {
    private actName: string;
    private schedule: ScheduleStatement;
    constructor(schedule: ScheduleStatement, context: PContext) {
        super(schedule, context);
        this.schedule = schedule;
    }

    protected _parse() {
        // // SCHEDUEL action() [delay 10分钟|on 10:30] repeat [5次] interval 20分钟
        // SCHEDUEL PROC [delay 10分钟|on 10:30] repeat [5次] interval 20分钟
        if (this.ts.token !== Token.VAR) {
            this.expect('ACT名称');
        }
        this.actName = this.ts.lowerVar;
        this.ts.readToken();
        this.schedule.params = [];

        // no parameters needed in schedule act
        // 2023-1-3：恢复允许参数。按说schedule应该不需要参数的。以后再想吧
        if (this.ts.token === Token.LPARENTHESE) {
            this.ts.readToken();
            let { params } = this.schedule;
            for (; ;) {
                if (this.ts.token as any === Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                let val = new ValueExpression();
                val.parser(this.context).parse()
                params.push(val);
                if (this.ts.token as any === Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                if (this.ts.token as any === Token.COMMA) {
                    this.ts.readToken();
                    continue;
                }
                this.ts.expectToken(Token.RPARENTHESE, Token.COMMA);
            }
        }

        if (this.ts.isKeyword('delay') === true) {
            this.ts.readToken();
            let val = new ValueExpression();
            val.parser(this.context).parse();
            this.schedule.delay = val;
        }
        else if (this.ts.isKeyword('on') === true) {
            this.ts.readToken();
            if (this.ts.token === Token.NUM && this.ts.isInteger === true) {
                let hour = this.ts.dec;
                if (hour < 0) {
                    this.ts.error('hour can not be negtive');
                }
                else if (hour >= 24) {
                    this.ts.error('hour maximium value is 23');
                }
                this.ts.readToken();
                if (this.ts.token as any !== Token.COLON) {
                    this.ts.expectToken(Token.COLON);
                }
                this.ts.readToken();
                if (this.ts.token !== Token.NUM) {
                    this.ts.expectToken(Token.NUM);
                }
                if (this.ts.isInteger as any === false) {
                    this.ts.error('expect integer');
                }
                let minute = this.ts.dec;
                if (minute < 0) {
                    this.ts.error('minute can be negtive');
                }
                else if (minute >= 60) {
                    this.ts.error('minute maximium value is 59');
                }
                this.ts.readToken();
                this.schedule.on = hour * 60 + minute;
            }
            else {
                let val = new ValueExpression();
                val.parser(this.context).parse();
                this.schedule.on = val;
            }
        }

        if (this.ts.isKeyword('repeat') === true) {
            this.ts.readToken();
            if (this.ts.token === Token.SEMICOLON) {
                this.schedule.repeat = ValueExpression.const(-1);
                return;
            }
            if (this.ts.isKeyword('interval') === false) {
                let val = new ValueExpression();
                val.parser(this.context).parse();
                this.schedule.repeat = val;
            }
            if (this.ts.isKeyword('interval') === true) {
                this.ts.readToken();
                let val = new ValueExpression();
                val.parser(this.context).parse();
                this.schedule.interval = val;
            }
        }
    }

    scan(space: Space): boolean {
        let ok = true;
        let { params, delay, on, repeat, interval } = this.schedule;
        let entity = space.getEntity(this.actName);
        if (params) {
            for (let v of params) {
                if (v.pelement.scan(space) === false) ok = false;
            }
        }
        else {
            params = [];
        }
        if (delay) {
            if (delay.pelement.scan(space) === false) ok = false;
        }
        if (on) {
            if (typeof on !== 'number') {
                if (on.pelement.scan(space) === false) ok = false;
            }
            if (interval) {
                this.log(`When there is SCHEDULE ON, no interval can define`);
                ok = false;
            }
        }
        if (repeat) {
            if (repeat.pelement.scan(space) === false) ok = false;
        }
        if (interval) {
            if (interval.pelement.scan(space) === false) ok = false;
        }
        if (entity === undefined) {
            this.log(`ACT ${this.actName} is not defined`);
            ok = false;
        }
        else if (entity.type !== 'proc') {
            this.log(`SCHEDULE only PROC, ${this.actName} is not an PROC`);
            ok = false;
        }
        else {
            this.schedule.act = entity as Proc;
            entity.isPrivate = true;
            let { act } = this.schedule;
            act.isScheduled = true;
            let { fields, arrs } = act;
            if (arrs.length > 0) {
                this.log(`schedule act ${act.name} can not have arr parameter`);
                ok = false;
            }
            if (fields.length !== params.length) {
                this.log(`schedule act ${act.name} should have ${params.length} parameters`);
                ok = false;
            }
        }
        return ok;
    }
}