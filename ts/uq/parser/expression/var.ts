import _ = require('lodash');
import { Table, Pointer, UserPointer, UnitPointer, ConstPointer, BizEntityBudPointer, BizBud, BizEntity, BizEntityFieldPointer, OptionsItem, BizOptions } from '../../il';
import { VarOperand } from '../../il/Exp';
import { PElement } from '../element';
import { Space } from '../space';
import { Token } from '../tokens';

export class PVarOperand extends PElement<VarOperand> {
    override parse(): void {
        super.parse();
    }
    _parse() {
        // # column 中的value，是生成的，没有ts
        if (this.ts === undefined) return;
        if (this.ts.token === Token.DOT) {
            this.dotVar();
        }
    }

    private dotVar() {
        for (; ;) {
            if (this.ts.token !== Token.DOT) break;
            this.ts.readToken();
            if (this.ts.token === Token.DOLLAR as any) {
                this.element._var.push('$');
                this.ts.readToken();
                return;
            }
            if (this.ts.token === Token.VAR as any) {
                this.element._var.push(this.ts.lowerVar);
                this.ts.readToken();
                return;
            }
            this.expect('变量');
        }
    }

    scan(space: Space): boolean {
        let { _var, dotFirst } = this.element;
        let len = _var.length;
        if (dotFirst === true) {
            if (len !== 1) {
                this.log('标点符号dot之后必须而且只能跟字段名');
                return false;
            }
        }
        if (len > 2) {
            this.log('不能理解 ' + _var.join('.'));
            return false;
        }
        if (len === 0) {
            throw '变量解析错误!';
        }
        let ret = space.varsPointer(_var);
        let pointer: Pointer;
        if (ret !== undefined) {
            pointer = ret[0];
            if (pointer === undefined) {
                let error = ret[1];
                if (error !== undefined) {
                    this.log(error);
                    return false;
                }
            }
        }
        if (pointer === undefined) {
            let var0 = _var[0];
            if (len === 1) {
                switch (var0) {
                    case '$user':
                        pointer = new UserPointer();
                        break;
                    case '$unit':
                        pointer = new UnitPointer();
                        break;
                    default:
                        if (dotFirst === undefined) dotFirst = false;
                        pointer = space.varPointer(var0, dotFirst);
                        if (pointer === undefined) {
                            this.log('没有定义' + var0);
                            return false;
                        }
                        break;
                }
            }
            else {
                let var1 = _var[1];
                let enm = space.getEntity(var0);
                if (enm !== undefined) {
                    let val = enm.calcKeyValue(var1);
                    if (val !== undefined) {
                        this.element.enumValue = val;
                        return true;
                    }
                }
                let _const = space.getConst(var0);
                if (_const !== undefined) {
                    let v = _const.values[var1];
                    if (v === undefined) {
                        this.log(`Const ${_const.jName} 中没有定义 ${var1}`);
                        return false;
                    }
                    pointer = new ConstPointer(v);
                }

                /*
                let options = space.uq.biz.bizEntities.get(var0) as BizOptions;
                if (options !== undefined) {
                    let optionsItem = options.items.find(v => v.name === var1);
                    this.element.options = options;
                    this.element.optionsItem = optionsItem;
                    if (optionsItem === undefined) {
                        this.log(`Options ${options.getJName()} 中没有定义 ${var1}`)
                        return false;
                    }
                    return true;
                }
                */

                let _obj = space.getBizFromEntityArrFromAlias(var0);
                if (_obj !== undefined) {
                    let { bizEntityArr } = _obj;
                    if (bizEntityArr.length > 0) {
                        let bud: BizBud, be: BizEntity, fieldName: string;
                        for (let bizEntity of bizEntityArr) {
                            be = bizEntity;
                            bud = bizEntity.getBud(var1);
                            if (bud !== undefined) {
                                break;
                            }
                            if (bizEntity.hasField(var1) === true) {
                                fieldName = var1;
                                break;
                            }
                        }
                        // let v = _obj.getBud(var1);
                        if (bud !== undefined) {
                            pointer = new BizEntityBudPointer(_obj, bud);
                        }
                        else if (fieldName !== undefined) {
                            pointer = new BizEntityFieldPointer(_obj, fieldName);
                        }
                        else {
                            this.log(`Biz entity ${bizEntityArr.map(v => v.jName).join(',')} has not ${var1}`);
                            return false;
                        }
                    }
                    else if (var1 === 'id') {
                        pointer = new BizEntityFieldPointer(_obj, var1);
                    }
                    else {
                        this.log(`unknown ${var0}.${var1}`);
                        return false;
                    }
                }
                else {
                    // t.a 那么t一定是from的table，不可能是entity
                    let table: Table = space.getTableByAlias(var0);
                    if (table === undefined) {
                        let t: Table = space.getTableByAlias(var0);
                        this.log(`没有定义Pick、表、Const、Enum、Options '${var0}'`);
                        return false;
                    }
                    pointer = table.fieldPointer(var1);
                    if (pointer === undefined) {
                        this.log('表' + var0 + '中没有字段' + var1);
                        return false;
                    }
                }
            }
        }
        this.element.pointer = pointer;
        space.groupType = pointer.groupType;
        return true;
    }
}
