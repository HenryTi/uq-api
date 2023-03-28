(function () {
    let a = 'aa{bbb}a{ccc}';
    let b = /{([^}]*)}/g;
    let ret = a.replace(b, (sub) => {
        sub = sub.substring(1, sub.length - 1);
        return `*${sub}*`;
    });
    debugger;
})();
//# sourceMappingURL=regex-replace-curly-braces.js.map