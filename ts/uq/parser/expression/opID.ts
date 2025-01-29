import { ID, OpID, IDNewType, OpNO, ValueExpression } from '../../il';
import { EnumIdType } from '../../il';
import { PElement } from '../element';
import { Space } from '../space';
import { Token } from '../tokens';
import { PIDNewType } from '../PDefines';

export class POpID extends PElement<OpID> {
    private entity: string;
    private forName: string;
    private newType: PIDNewType;
    private keys: { [key: string]: ValueExpression };
    private minuteIdStamp: ValueExpression;
    _parse() {
        if (this.ts.token === Token.AT) {
            this.ts.readToken();
            if (this.ts.token as any === Token.EQU) {
                this.ts.readToken();
                this.element.phrases = this.context.parse(ValueExpression);
            }
            else {
                let phrases = this.element.phrases = [];
                for (; ;) {
                    if (this.ts.token as any !== Token.VAR) {
                        this.ts.expectToken(Token.VAR);
                    }
                    phrases.push(this.ts.lowerVar);
                    this.ts.readToken();
                    if (this.ts.token as any !== Token.DOT) break;
                    this.ts.readToken();
                }
            }
            this.ts.passToken(Token.RPARENTHESE);
            return;
        }

        if (this.ts.token !== Token.VAR && this.ts.token !== Token.DOLLARVAR) {
            this.ts.expect('ID名字');
        }
        this.entity = this.ts.lowerVar;
        this.ts.readToken();
        if (this.ts.varBrace === false && this.ts.token === Token.VAR) {
            switch (this.ts.lowerVar) {
                case 'new':
                    this.newType = PIDNewType.new;
                    this.element.newType = IDNewType.new;
                    this.ts.readToken();
                    if (this.ts.isKeywordToken === true) {
                        switch (this.ts.lowerVar as any) {
                            case 'version':
                                this.ts.readToken();
                                this.newType = PIDNewType.newVersion;
                                break;
                            case 'if':
                                this.ts.readToken();
                                if (this.ts.isKeyword('null') === false) {
                                    this.ts.expect('NULL');
                                }
                                this.ts.readToken();
                                this.newType = PIDNewType.newIfNull;
                                break;
                        }
                    }
                    if (this.ts.isKeyword('for') === true) {
                        this.ts.readToken();
                        if (this.ts.token !== Token.VAR) {
                            this.ts.expectToken(Token.VAR);
                        }
                        this.forName = this.ts.lowerVar;
                        this.ts.readToken();
                    }
                    break;
                case 'create':
                    this.element.newType = IDNewType.create;
                    this.ts.readToken();
                    break;
                case 'prev':
                    this.element.newType = IDNewType.prev;
                    this.ts.readToken();
                    if (this.ts.isKeyword('of') === false) {
                        this.ts.expect('OF');
                    }
                    this.ts.readToken();
                    let val = new ValueExpression();
                    val.parser(this.context).parse();
                    this.element.vals.push(val);
                    if (this.ts.token !== Token.RPARENTHESE as any) {
                        this.ts.expectToken(Token.RPARENTHESE);
                    }
                    this.ts.readToken();
                    return;
            }
        }
        if (this.ts.isKeyword('uuid') === true) {
            this.ts.readToken();
            let val = new ValueExpression();
            val.parser(this.context).parse();
            this.element.uuid = val;
        }
        this.parseStamp();
        if (this.ts.isKeyword('key') === true) {
            this.ts.readToken();
            this.keys = {};
            for (; ;) {
                if (this.ts.token !== Token.VAR) {
                    this.ts.expectToken(Token.VAR);
                }
                let key = this.ts.lowerVar;
                this.ts.readToken();
                if (this.ts.token !== Token.EQU) {
                    this.ts.expectToken(Token.EQU);
                }
                else {
                    this.ts.readToken();
                }
                let val = new ValueExpression();
                val.parser(this.context).parse();
                this.keys[key] = val;
                // this.element.vals.push(val);
                if (this.ts.token === Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                if (this.ts.token !== Token.COMMA) {
                    if (this.ts.isKeyword('stamp') === true) {
                        this.parseStamp();
                        if (this.ts.token as any !== Token.RPARENTHESE) {
                            this.ts.expectToken(Token.RPARENTHESE);
                        }
                        else {
                            this.ts.readToken();
                            break;
                        }
                    }
                    else {
                        this.ts.expectToken(Token.COMMA, Token.RPARENTHESE);
                    }
                }
                this.ts.readToken();
                if (this.ts.token as any === Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
            }
        }
        else {
            for (; ;) {
                if (this.ts.token === Token.COMMA) {
                    this.ts.readToken();
                    let val = new ValueExpression();
                    val.parser(this.context).parse();
                    this.element.vals.push(val);
                }
                if (this.ts.token === Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                this.ts.expectToken(Token.COMMA, Token.RPARENTHESE);
            }
        }
    }
    private parseStamp() {
        switch (this.element.newType) {
            case IDNewType.get:
            case IDNewType.prev:
                return;
        }
        if (this.ts.isKeyword('stamp') === true) {
            this.ts.readToken();
            if (this.ts.token === Token.EQU) {
                this.ts.readToken();
            }
            this.minuteIdStamp = new ValueExpression();
            this.minuteIdStamp.parser(this.context).parse();
            if (!this.keys) this.keys = {};
        }
    }
    scan(space: Space): boolean {
        let ok = true;
        let { phrases } = this.element;
        if (phrases !== undefined) {
            if (Array.isArray(phrases) === true) {
                // 扫描biz空间
            }
            else {
                if ((phrases as ValueExpression).pelement.scan(space) === false) ok = false;
            }
            return ok;
        }

        let entity = space.getEntityTable(this.entity);
        if (entity === undefined || entity.type !== 'id') {
            this.log('[' + this.entity + ']必须是ID');
            return false;
        }
        let ID: ID = this.element.id = entity as ID;
        let { vals, newType, uuid } = this.element;
        if (newType === IDNewType.new) {
            if (ID.version === undefined) {
                if (this.newType !== PIDNewType.new) {
                    ok = false;
                    this.log(`ID ${ID.jName} has not version, so in ID(${ID.jName} new), after NEW, no VERSION no IF NULL is allowed.`);
                }
            }
            else {
                switch (this.newType) {
                    default:
                        ok = false;
                        this.log(`ID ${ID.jName} has version, so in ID(${ID.jName} new VERSION or IF NULL).`);
                        break;
                    case PIDNewType.newIfNull:
                        newType = this.element.newType = IDNewType.newIfNull;
                        break;
                    case PIDNewType.newVersion:
                        break;
                }
            }
            if (this.forName !== undefined) {
                let forEntity = space.getEntity(this.forName);
                if (forEntity === undefined || forEntity.type !== 'id') {
                    ok = false;
                    this.log(`'${this.forName}' is not a valid ID`);
                }
                this.element.forID = forEntity as ID;
            }
        }
        else if (newType === IDNewType.prev) {
            if (ID.version === undefined) {
                ok = false;
                this.log(`ID ${ID.jName} has no version, so ID(${ID.jName} PREV) is nonesense.`);
            }
        }

        if (this.keys !== undefined) {
            let { keys: keyFields } = ID;
            for (let key in this.keys) {
                let ki = keyFields.findIndex(v => v.name === key);
                if (ki < 0) {
                    ok = false;
                    this.log(`${key} is not defined in ID keys`);
                }
            }
            for (let kf of keyFields) {
                let val = this.keys[kf.name];
                if (val === undefined) {
                    ok = false;
                    this.log(`${kf.name} must have a value`);
                }
                else {
                    vals.push(val);
                }
            }
        }
        else if (vals.length > 1) {
            this.log('这个错误不影响运行。但建议使用 ID(entity new KEY k1=v1, k2=v2) 语法');
        }
        if (uuid !== undefined) {
            let el = uuid.pelement;
            if (el !== undefined) {
                if (el.scan(space) === false) ok = false;
            }
        }

        let { idType, isMinute } = ID;
        if (idType === EnumIdType.UUID) {
            if (newType !== IDNewType.get) {
                if (uuid !== undefined && vals.length > 0) {
                    this.log('when ID new or create, either UUID or KEY, not both');
                }
            }
        }

        if (idType === EnumIdType.MinuteId
            || idType === EnumIdType.Minute
            || (
                (idType === EnumIdType.UUID || idType === EnumIdType.ULocal)
                && isMinute === true
            )
            || isMinute === true) {
            if (this.minuteIdStamp || this.keys) {
                // vals.push(this.minuteIdStamp ?? ValueExpression.const(undefined));
                this.element.stamp = this.minuteIdStamp ?? ValueExpression.const(undefined);
            }
            else {
                if (ID.keys.length + 1 === vals.length) {
                }
                else if (ID.keys.length === vals.length) {
                    //vals.push(ValueExpression.const(undefined));
                    this.element.stamp = ValueExpression.const(undefined);
                }
                else {
                    ok = false;
                    this.log('ID function parameters not match ID keys');
                }
            }
        }
        else {
            if (this.minuteIdStamp !== undefined) {
                ok = false;
                this.log('only minute ID can have stamp');
            }
            if (ID.keys.length !== vals.length) {
                ok = false;
                this.log('ID function parameters not match ID keys');
            }
        }

        let { stamp } = this.element;
        if (stamp && stamp.pelement) {
            if (stamp.pelement.scan(space) === false) ok = false;
        }

        for (let val of vals) {
            if (val.pelement) {
                if (val.pelement.scan(space) === false) ok = false;
            }
            for (let va of val.getAtoms()) {
                if (va.type === 'NO') {
                    let expNO: OpNO = va as OpNO;
                    if (expNO.id !== ID) {
                        if (expNO.id === undefined) {
                            expNO.id = ID;
                        }
                        else {
                            ok = false;
                            this.log('ID function parameter NO can not have different ID as parameter');
                        }
                    }
                }
            }
        }

        return ok;
    }
}
