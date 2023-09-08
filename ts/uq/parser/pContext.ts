import { Statements, Statement, IElement } from '../il';
import { TokenStream } from './tokens';

export class PContext {
    constructor(ts: TokenStream) {
        this.ts = ts;
    }
    readonly ts: TokenStream;
    createStatements: (parent: Statement) => Statements;

    checkName(name: string): boolean {
        return nameRegex.test(name) === false;
    }

    get isSys(): boolean { return false; }

    inDenyList(name: string): boolean {
        return nameDenyColl[name];
    }

    parse<T extends IElement>(Element: new () => T) {
        let element = new Element();
        let parser = element.parser(this);
        parser.parse();
        return element;
    }
    parseElement<T extends IElement>(element: T) {
        let parser = element.parser(this);
        parser.parse();
        return element;
    }
}

const sysNameRegex = /\#\@\!\%\^\&\*\(\)\!\?\<\>\:\;\"\'\\\{\}\[\]\/\-\+\=/;
export class PSysContext extends PContext {
    checkName(name: string): boolean {
        return sysNameRegex.test(name) === false;
    }
    get isSys(): boolean { return true; }
}

const nameRegex = /\$\#\@\!\%\^\&\*\(\)\!\?\<\>\:\;\"\'\\\{\}\[\]\/\-\+\=/;
const nameDenyList: string[] = [
    'AdminGetList',
    'AdminSetMe',
    'AdminSet',
    'AdminIsMe',
    'IDValue',
    'Acts',
    'ActIX',
    'ActIXSort',
    'ActIDProp',
    'QueryID',
    'IDNO',
    'IDEntity',
    'ID',
    'IXr',
    'KeyID',
    'IX',
    'IXValues',
    'KeyIX',
    'IDxID',
    'IDinIX',

    'IDTv',

    'IDTree',
    'IDLog',
    'IDSum',
    'IDDetailGet',
    'IDDetailGet',
    'IDDetailGet',
    'ActDetail',
    'ActDetail',
    'ActDetail',
];
const nameDenyColl: { [name: string]: boolean } = {};
(function () {
    for (let i of nameDenyList) nameDenyColl[i.toLowerCase()] = true;
})();
