const acorn = require('acorn');

const VariableDeclaration = 'VariableDeclaration';
const VariableDeclarator = 'VariableDeclarator';
const CallExpression = 'CallExpression';

function walkDeclarator(requires, declarator) {
    if (declarator.type === CallExpression) {
        if (declarator.callee.name === 'require') {
            let param = Array.from(declarator.arguments)[0];
            requires.push({
                name: param.value,
                range: param.range
            });
        }
    }
}

function walkDeclaration(requires, declaration) {
    if (declaration.type === VariableDeclarator) {
        if (declaration.init) {
            walkDeclarator(requires, declaration.init);
        }
    }
}

function walkStatement(requires, statement) {
    if (statement.type === VariableDeclaration) {
        if (statement.declarations) {
            statement.declarations.forEach(declaration => walkDeclaration(requires, declaration));
        }
    }
}

function walkParse(requires, parseList) {
    parseList.forEach(statement => walkStatement(requires, statement));
}

module.exports = function (source) {
    const result = acorn.parse(source, {ranges: true});
    let requires = [];
    walkParse(requires, result.body);
    return requires;
};