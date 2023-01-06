//babel库及文件模块导入
const fs = require('fs');

//babel库相关，解析，转换，构建，生产
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const types = require("@babel/types");
const generator = require("@babel/generator").default;
const template = require("@babel/template").default;
//读取文件
// let encode_file = "./test.js", decode_file = "./decode_result.js";
let encode_file = "./encode.js", decode_file = "./decode_result.js";
if (process.argv.length > 2) {
    encode_file = process.argv[2];
}
if (process.argv.length > 3) {
    decode_file = process.argv[3];
}

let jscode = fs.readFileSync(encode_file, {encoding: "utf-8"});
//转换为ast树
let ast = parser.parse(jscode);

// const visitor = {
//     WhileStatement(path) {
//         //  过滤父节点不是BlockStatement类型的
//         if (!types.isBlockStatement(path.parentPath.node)) return;
//         const {node} = path;
//         const {test, body} = node;
//         //  过滤test不为true
//         if (!test.value) return;
//         let nextBrotherNode = path.getNextSibling()
//         //  过滤下一个兄弟节点不是FunctionDeclaration类型的
//         if (types.isFunctionDeclaration(nextBrotherNode)) return;
//
//         console.log(path.toString())
//     }
// }

const specificationIfElse = {
    IfStatement(path){
        //  es6语法糖 等价于 const node = path.node
        const {node} = path
        const {alternate} = node
        //  过滤alternate是BlockStatement类型
        if (types.isBlockStatement(alternate)) return;
        //  获取子节点 alternate 注：参数key需要是一个字符串，也就是路径，以.隔开
        const alternatePath = path.get("alternate")
        //  原始方法构造BlockStatement节点
        const newNode = {
            type:"BlockStatement",
            body:[alternatePath.node]
        }
        //  替换节点
        alternatePath.replaceWith(newNode)
    }
}


//  规范 if else
traverse(ast, specificationIfElse);

//生成新的js code，并保存到文件中输出
let {code} = generator(ast, opts = {jsescOption: {"minimal": true}});

fs.writeFile(decode_file, code, (err) => {
});