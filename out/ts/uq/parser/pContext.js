"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PSysContext = exports.PContext = void 0;
class PContext {
    constructor(ts) {
        this.ts = ts;
    }
    checkName(name) {
        return nameRegex.test(name) === false;
    }
    get isSys() { return false; }
    inDenyList(name) {
        return nameDenyColl[name];
    }
    parse(Element) {
        let element = new Element();
        let parser = element.parser(this);
        parser.parse();
        return element;
    }
    parseElement(element) {
        let parser = element.parser(this);
        parser.parse();
        return element;
    }
}
exports.PContext = PContext;
const sysNameRegex = /\#\@\!\%\^\&\*\(\)\!\?\<\>\:\;\"\'\\\{\}\[\]\/\-\+\=/;
class PSysContext extends PContext {
    checkName(name) {
        return sysNameRegex.test(name) === false;
    }
    get isSys() { return true; }
}
exports.PSysContext = PSysContext;
const nameRegex = /\$\#\@\!\%\^\&\*\(\)\!\?\<\>\:\;\"\'\\\{\}\[\]\/\-\+\=/;
const nameDenyList = [
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
const nameDenyColl = {};
(function () {
    for (let i of nameDenyList)
        nameDenyColl[i.toLowerCase()] = true;
})();
//# sourceMappingURL=pContext.js.map