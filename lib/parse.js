const acorn = require('acorn');

const VariableDeclaration = 'VariableDeclaration';
const ExpressionStatement = 'ExpressionStatement';
const VariableDeclarator = 'VariableDeclarator';
const CallExpression = 'CallExpression';
const ArrayExpression = 'ArrayExpression';

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

function walkExpression(asyncs, expression) {
    const { arguments } = expression;
    let newModule = {
        args:[],
        requires: [],
        range: []
    };
    
    if (arguments[0].type === ArrayExpression) {
        newModule.range = arguments[0].range;
        arguments[0].elements.forEach(e => {
            newModule.args.push({name: e.value, range: e.range});
        });

        if (arguments.length > 1) {
            const bodyList = arguments[1].body.body;
            bodyList.forEach(item => {
                if (item.type === VariableDeclaration) {
                    item.declarations.forEach(declaration => walkDeclaration(newModule.requires, declaration));
                }
            });
        }

        asyncs.push(newModule);
    }
}

function walkStatement(modules, statement) {
    if (statement.type === VariableDeclaration) {
        if (statement.declarations) {
            statement.declarations.forEach(declaration => walkDeclaration(modules.requires, declaration));
        }
    } else if (statement.type === ExpressionStatement) {
        const { expression } = statement;
        if (expression && expression.type === CallExpression) {
            walkExpression(modules.asyncs, expression);
        }
    }
}

function walkParse(requires, parseList) {
    parseList.forEach(statement => walkStatement(requires, statement));
}

module.exports = function (source) {
    const result = acorn.parse(source, {ranges: true});
    let modules = {
        requires: [],
        asyncs: []
    };
    walkParse(modules, result.body);
    return modules;
};