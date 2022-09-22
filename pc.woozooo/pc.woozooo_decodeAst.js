/*
* https://g.alicdn.com/AWSC/WebUMID/1.90.2/um.js
* pc.woozooo
*
* */

//babel库及文件模块导入
const fs = require('fs');
// const usefulPlugins = require("./base/tools/usefulPlugins");
// const decodeObfuscator = require("./base/tools/decodeOb");
//babel库相关，解析，转换，构建，生产
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const types = require("@babel/types");
const generator = require("@babel/generator").default;
const template = require("@babel/template").default;
global.t = types;
console.log(t)

//读取文件
let encode_file = "G:\\hutao\\ast_code\\ast-code\\hutao\\encode.js",
    decode_file = "G:\\hutao\\ast_code\\ast-code\\hutao\\decode_result.js";

if (process.argv.length > 2) {
    encode_file = process.argv[2];
}

if (process.argv.length > 3) {
    decode_file = process.argv[3];
}

let jscode = fs.readFileSync(encode_file, {encoding: "utf-8"});
//转换为ast树
let ast = parser.parse(jscode);

var getCaseNode = function (list, path, insertNode) {
    const {node} = path
    let OaCases = node.cases
    try {
        let FaCases = node.cases[list[0]].consequent[0].expression.argument.callee.body.body[0]
            .cases[list[1]].consequent[0].expression.argument.callee.body.body[0]
            .cases[list[2]].consequent.unshift(insertNode)
        // OaCases[list[0]]
        // console.log(list, generator(FaCases).code)
    } catch (e) {
        console.log("_________________________________________________________")
        // console.log(list,generator(OaCases[list[0]]).code)
        OaCases[list[0]].consequent.unshift(insertNode)
        console.log(list, generator(OaCases[list[0]]).code)
        console.log("_________________________________________________________")
        // console.log(e)
    }
}

var getIndex = function (Oa) {
    var za = Oa >> 5;
    Fa = 31 & za;
    La = 31 & za >> 5;
    return [31 & Oa, Fa, La]
}

var getOaValue = function (Oa, Fa, La) {
    let za = (La << 5) + Fa;
    Oa = (za << 5) + Oa
    return Oa
}

var caseData = function (discriminantI, caseI, path) {
    const {consequent, test} = caseI
    if (!t.isBreakStatement(consequent[consequent.length - 1])) return;
    if (!t.isExpressionStatement(consequent[0])) return;
    if (consequent.length != 2) return;
    var SwitchValue = test.value

    if (t.isUnaryExpression(consequent[0].expression)) {
        var SwitchCasesNext = consequent[0].expression.argument.callee.body.body[0]

        const {discriminant, cases} = SwitchCasesNext
        // console.log(discriminantI.name, SwitchValue)
        return [discriminant, cases];
    } else {
        let expression = consequent[0].expression
        let expressions = expression.expressions
        if (!Array.isArray(expressions)) return;
        let indexObj = expressions[expressions.length - 1]
        if (indexObj.left.name != "Oa") return;
        if (indexObj.operator != "=") return;
        if (!t.isNumericLiteral(indexObj.right)) return;
        OaValue = indexObj.right.value
        caseList = getIndex(OaValue)
        expressions = caseI.consequent[0].expression.expressions
        expressions.pop()
        getCaseNode(caseList, path, caseI.consequent[0])
        delete caseI.consequent[0]
    }
}

var iftype = function (caseI) {
    const {consequent} = caseI
    if (!types.isBreakStatement(consequent[consequent.length - 1])) return false;
    if (!types.isExpressionStatement(consequent[0])) return false;
    if (consequent.length != 2) return false;
    return true;
}


const visitor = {
    SwitchStatement(path) {
        const {node} = path
        const {discriminant, cases} = node
        if (!types.isBinaryExpression(discriminant)
            || discriminant.left.value != 31) return;
        const SwitchCases1 = cases

        SwitchCases1.forEach(caseIndex => {
            if (!iftype(caseIndex)) return;
            SwitchCases2 = caseData(discriminant.right, caseIndex, path);
            SwitchCases2[1].forEach(caseIndex1 => {
                if (!iftype(caseIndex1)) return;
                SwitchCases3 = caseData(SwitchCases2[0], caseIndex1, path)
                SwitchCases3[1].forEach(caseIndex2 => {
                    if (!iftype(caseIndex2)) return;
                    caseData(SwitchCases3[0], caseIndex2, path)
                })
            })
        })
    }
}


const decode_comma = {
    //破解逗号表达式，兼容之前的脚本
    ExpressionStatement(path) {
        //****************************************特征判断
        let {expression} = path.node;
        if (!t.isSequenceExpression(expression)) return;
        let body = [];
        expression.expressions.forEach(express => {
            body.push(t.ExpressionStatement(express));
        })
        path.replaceInline(body);
    },
}
traverse(ast, decode_comma);

const decodeSwitchNesting = {
    // 拆解嵌套switch 合并为一个
    SwitchCase(path) {
        const {consequent, test} = path.node
        if (test.value > 6) return;
        consequent.forEach(i => {
            if (t.isVariableDeclaration(i)) {
                console.log(generator(i).code)
            }
        })
    }
}
traverse(ast, decodeSwitchNesting);


// console.log(casesList)

// const visitor2 = {
//
// }


//生成新的js code，并保存到文件中输出
let {code} = generator(ast, opts = {jsescOption: {"minimal": true}});

fs.writeFile(decode_file, code, (err) => {
});