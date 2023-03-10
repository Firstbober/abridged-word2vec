const fs = require('fs')
const mathjs = require('mathjs')
const similarity = require('compute-cosine-similarity');

const dictionary = JSON.parse(fs.readFileSync("dictionary.json"))
const vectors = JSON.parse(fs.readFileSync("vectors.json")).data

const checkWordSimilarity = (word1, word2) => {
	return similarity(vectors[word1].slice(0), vectors[word2].slice(0))
}

const findSimilarWords = (word) => {
	let similarities = []

	for (const dw of Object.keys(dictionary)) {
		similarities.push([dw, checkWordSimilarity(word, dw)])
	}

	return similarities.sort((a, b) => {
		return a[1] - b[1]
	}).reverse()
}

console.log(checkWordSimilarity("france", "software"))
console.log(checkWordSimilarity("computer", "poland"))
console.log(findSimilarWords("computer"))