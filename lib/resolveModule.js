const path = require('path');
const fs = require('fs');

function isExist(modulePath) {
    const stat = fs.statSync(modulePath);
    if (stat && stat.isFile()) {
        return true;
    } else {
        return false;
    }
}

function resolveEXT(modulePath) {
    let ext = path.extname(modulePath);
    return ext === '' ? modulePath + '.js' : modulePath;
}

module.exports = function (moduleName, context) {
    if (path.isAbsolute(moduleName) && isExist(moduleName)) {
        return moduleName;
    }

    let absolutePath = path.resolve(context, moduleName);
    absolutePath = resolveEXT(absolutePath);
    if (isExist(absolutePath)) {
        return absolutePath;
    }

    absolutePath = path.resolve(context, './node_modules', moduleName);
    absolutePath = resolveEXT(absolutePath);
    if (isExist(absolutePath)) {
        return absolutePath;
    }

    // TODO
    // 完善模块查找
    // https://blog.leodots.me/archives/3-nodejs-modules-note.html

    throw new Error(`module ${moduleName} not found.`);
};