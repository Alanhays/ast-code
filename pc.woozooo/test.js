var Oa = 10624

function getIndex(Oa) {
    var za = Oa >> 5;
    Fa = 31 & za;
    La = 31 & za >> 5;
    return [31 & Oa, Fa, La]
}

var getOaValue= function (list) {
    let Oa = list[0]
    let Fa = list[1]
    let La = list[2]
    var za = (La << 5) + Fa;
    Oa = (za << 5) + Oa
    return Oa
}
var a = getIndex(Oa)
console.log(a)
var b = getOaValue(a)
console.log(b)

