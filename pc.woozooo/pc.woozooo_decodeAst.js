//babel库及文件模块导入
const fs = require('fs');
//babel库相关，解析，转换，构建，生产
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const types = require("@babel/types");
const generator = require("@babel/generator").default;
const template = require("@babel/template").default;
global.t = types;

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


const removeSelfExecuting = {
    UnaryExpression(path) {
        const {operator, argument} = path.node;
        if (operator !== "!" || !t.isCallExpression(argument))
            return;
        let {callee, arguments} = argument;
        if (!t.isFunctionExpression(callee) || arguments.length !== 0)
            return;
        path.replaceInline(callee.body.body);
    },
}
traverse(ast, removeSelfExecuting);
var index = 0
const decodeSwitchNesting = {
    // 拆解嵌套switch 合并为一个
    SwitchStatement(path) {
        const {discriminant, cases} = path.node
        //  特征判断 只处理最外层switch
        if (!t.isBinaryExpression(discriminant)) return;
        if (discriminant.right.name != "Oa") return;
        //  遍历所有cases节点
        for (let Oa = 0; Oa < cases.length; Oa++) {
            FaSwitch = cases[Oa].consequent[0]
            //  特征判断 只处理switch类型
            if (!t.isSwitchStatement(FaSwitch)) return;
            FaCases = FaSwitch.cases
            for (let Fa = 0; Fa < FaCases.length; Fa++) {
                //  因为检查过FaCases节点，所以这里不做判断，有报错再做判断也是可以的
                LaSwitch = FaCases[Fa].consequent[0]
                LaCases = LaSwitch.cases
                for (let La = 0; La < LaCases.length; La++) {
                    // console.log(generator(LaCases[La]).code)
                    // console.log(getOaValue(Oa,Fa,La))
                    index += 1
                }
            }
            // console.log(generator(FaSwitch).code)
        }



        // console.log(path.toString())

    }
}
traverse(ast, decodeSwitchNesting);
console.log(index)

//生成新的js code，并保存到文件中输出
let {code} = generator(ast, opts = {jsescOption: {"minimal": true}});

fs.writeFile(decode_file, code, (err) => {
});