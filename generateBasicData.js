const natural = require('natural');

const mathjs = require('mathjs')
const fs = require('fs');
const libAW2V = require('./libAW2V');

const sigmoid = (x) => {
	return Math.exp(x) / (Math.exp(x) + 1)
};

const vectorConfig = {
	tokensIntoFuture: 10,
	tokensIntoPast: 10
}

var tokenizer = new natural.TreebankWordTokenizer();
console.log("Loading data...");
const dataset = fs.readFileSync("wiki.train.tokens").toString()
console.log("Tokenizing...")
let tokens = tokenizer.tokenize(dataset)

const generateDictionaryFromTokens = (tokens) => {
	const uniqueTokens = [...new Set(tokens)];
	let dictionary = new Map();

	let i = 0;
	for (const token of uniqueTokens) {
		dictionary.set(token.toLowerCase(), i / uniqueTokens.length)

		i += 1;
		console.log(`${i}/${uniqueTokens.length}`)
	}

	return dictionary
}

console.log("Generating dictionary...")
const dictionary = generateDictionaryFromTokens(tokens);

const tokensIntoVectors = (tokens, dictionary) => {
	let sentenceLength = 0;
	let vectors = new Map()

	for (let i = 0; i < tokens.length; i++) {
		const tkn = tokens[i].toLowerCase();
		sentenceLength += 1;

		let vector = libAW2V.genereteVectorFromIndex(i, sentenceLength, tokens, dictionary)

		if (vectors.has(tkn)) {
			const oldVector = vectors.get(tkn)
			const newVector = vector.map((v, i) => mathjs.mean(v, oldVector[i]))

			// TODO
		} else {
			vectors.set(tkn, vector)
		}

		if (tkn == ".") {
			sentenceLength = 1
		}

		console.log(`${i}/${tokens.length}`)
	}

	return vectors

}

console.log("Generating vectors...")
const vectors = tokensIntoVectors(tokens, dictionary);
// console.log(vectors)

fs.writeFileSync("dictionary.json", (() => {
	let data = {};
	for (const entry of dictionary) {
		data[entry[0]] = entry[1]
	}
	return JSON.stringify(data)
})())
fs.writeFileSync("vectors.json", (() => {
	let data = {};
	for (const entry of vectors) {
		data[entry[0]] = entry[1]
	}
	return JSON.stringify({
		metadata: {
			maxSentenceLength: 0
		},
		data: data
	})
})())
