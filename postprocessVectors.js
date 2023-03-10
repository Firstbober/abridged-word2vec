const fs = require('fs')
const mathjs = require('mathjs')

const dictionary = JSON.parse(fs.readFileSync("dictionary.json"))
let vectors = JSON.parse(fs.readFileSync("vectors.json"))

let largest = ["", 0]
let longestVector = 0;

for(const [vK, vV] of Object.entries(vectors.data)) {
	if (vV[0] > largest[1]) largest = [vK, vV[0]]
	if (vV.length > longestVector) longestVector = vV.length
}

for(const [vK, vV] of Object.entries(vectors.data)) {
	vectors.data[vK][0] = vectors.data[vK][0] / largest[1]
}

vectors.metadata.maxSentenceLength = largest[1]
console.log(longestVector)
fs.writeFileSync("vectors.json", JSON.stringify(vectors))