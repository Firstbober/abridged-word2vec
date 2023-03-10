const fs = require('fs')
const mathjs = require('mathjs')
const similarity = require('compute-cosine-similarity');
const libAW2V = require('./libAW2V');

const dictionary = JSON.parse(fs.readFileSync("dictionary.json"))
const vectors = JSON.parse(fs.readFileSync("vectors.json"))

const validationTokens = libAW2V.generateTokens(`
Homarus gammarus is a large <unk> , with a body length up to 60 centimetres ( 24 in ) and weighing up to 5 – 6 kilograms ( 11 – 13 lb ) , although the lobsters caught in lobster pots are usually 23 – 38 cm ( 9 – 15 in ) long and weigh 0 @.@ 7 – 2 @.@ 2 kg ( 1 @.@ 5 – 4 @.@ 9 lb ) . Like other crustaceans , lobsters have a hard <unk> which they must shed in order to grow , in a process called <unk> ( <unk> ) . This may occur several times a year for young lobsters , but decreases to once every 1 – 2 years for larger animals . 
 The first pair of <unk> is armed with a large , asymmetrical pair of claws . The larger one is the " <unk> " , and has rounded <unk> used for crushing prey ; the other is the " cutter " , which has sharp inner edges , and is used for holding or tearing the prey . Usually , the left claw is the <unk> , and the right is the cutter . 
 The <unk> is generally blue above , with spots that <unk> , and yellow below . The red colour associated with lobsters only appears after cooking . This occurs because , in life , the red pigment <unk> is bound to a protein complex , but the complex is broken up by the heat of cooking , releasing the red pigment . 
 The closest relative of H. gammarus is the American lobster , Homarus americanus . The two species are very similar , and can be crossed artificially , although hybrids are unlikely to occur in the wild since their ranges do not overlap . The two species can be distinguished by a number of characteristics : 
 The <unk> of H. americanus bears one or more spines on the underside , which are lacking in H. gammarus . 
 The spines on the claws of H. americanus are red or red @-@ tipped , while those of H. gammarus are white or white @-@ tipped . 
 The underside of the claw of H. americanus is orange or red , while that of H. gammarus is creamy white or very pale red . 
`);

function randFromArray(array) {
	return array[array.length * Math.random() | 0]
}

const getPostprocessedVector = (idx, sentenceLength, tokens, dictionary) => {
	let v = libAW2V.genereteVectorFromIndexRaw(idx, sentenceLength, tokens, dictionary)
	v[0] /= vectors.metadata.maxSentenceLength
	return v
}

const getNextVectorFromTokens = (tokens, dictionary) => {
	const vector = getPostprocessedVector(tokens.length, tokens.length + 1, tokens, dictionary)
	return vector
}

const findSimilarVectors = (vector, minimalFrequency) => {
	let similarities = []

	for (const dw of Object.keys(dictionary)) {
		const sim = similarity(vector, vectors.data[dw])
		if (sim > minimalFrequency)
			similarities.push([dw, sim])
	}

	return similarities.sort((a, b) => {
		return a[1] - b[1]
	}).reverse()
}

const ReLU = (x) => x > 0 ? x : 0.0
const Sigmoid = (x) => 1 / (1 + Math.exp(-x))

const trainUsingTokens = (vectors, trainTokens, dictionary) => {
	let tokens = [trainTokens[0]]

	const isInSimilarities = (sims, token) => {
		for (let i = 0; i < sims.length; i++) {
			const element = sims[i];

			if (element[0] == token) {
				return i
			}
		}

		return -1
	}

	// Iterate over training tokens

	for (let i = 1; i < trainTokens.length; i++) {
		const validToken = trainTokens[i].toLowerCase();

		let similarVectors = []
		let breakLoop = false

		let lastLoss = 1
		let lastMultiplier = 1
		let lastRandom = 1
		let avgTendency = 1

		let amountOfLessLost = 1
		let amountOfMoreLost = 1
		let iteration = 0

		do {
			if (iteration > 25) breakLoop = true;

			const nextVector = getNextVectorFromTokens(tokens, dictionary)
			similarVectors = findSimilarVectors(nextVector, 0.3)
			const simBetweenNextAndReal = similarity(vectors[validToken], nextVector)
			const loss = 0.3 - simBetweenNextAndReal
			let multiplier = 1 + (simBetweenNextAndReal > 0.3 ? (simBetweenNextAndReal - 1) / 2 : (simBetweenNextAndReal) / 2)
			let random = Math.random()

			if (loss < lastLoss) {
				// console.log("loss is less than last")
				// multiplier *= random
				amountOfLessLost += 1
				multiplier = (lastMultiplier * random) > 2 ? multiplier * lastLoss : lastMultiplier * random
			}
			if (loss > lastLoss) {
				// console.log("loss is larger than last")
				// multiplier = lastMultiplier - 1
				amountOfMoreLost += 1
				// multiplier -= lastMultiplier
				multiplier *= random
			}
			if (loss == lastLoss) {
				// console.log(Object.values(vectors)[0])
				console.log("loss is same as last", multiplier - 1)
				multiplier *= random
				// multiplier -= 1
			}
			// console.log(multiplier)

			for (const [vK, vV] of Object.entries(vectors)) {
				vectors[vK] = [vV[0], ...[...(mathjs.multiply(vV.slice(1), multiplier))].map((v) => {

					return Sigmoid(v)
				})]
			}

			avgTendency = mathjs.mean(avgTendency, amountOfLessLost / amountOfMoreLost)
			console.log(`Current tokens: "${tokens}"; training for "${validToken}"; it ${iteration}; loss ${loss}; tendency ${amountOfLessLost / amountOfMoreLost}; avgTendency ${avgTendency}`)

			iteration += 1
			lastLoss = loss
			lastMultiplier = multiplier
			lastRandom = random

			// console.log(similarVectors)
		} while (isInSimilarities(similarVectors, validToken) == -1 && !breakLoop);

		tokens.push(validToken)
	}
	// 
	// const nextVector = getNextVectorFromTokens(tokens, dictionary)
	// const similarVectors = findSimilarVectors(nextVector, 0.6)
	// 
	// console.log(tokens)
	// console.log(similarVectors)


	console.log(isInSimilarities([["aa", 5]], "bb"))
}

trainUsingTokens(vectors.data, validationTokens, dictionary)

// console.log(validationTokens, validationTokens[0], getPostprocessedVector(0, 1, validationTokens, dictionary))
/*
let startingTokens = libAW2V.generateTokens(`Hey!`)

for(const _ of new Array(50)) {
const nextVector = getNextVectorFromTokens(startingTokens, dictionary)

let similarVectors = []
let minimalFrequency = 0.9;

do {
	similarVectors = findSimilarVectors(nextVector, minimalFrequency)
	minimalFrequency -= 0.1;
} while (similarVectors.length == 0);

startingTokens.push(randFromArray(similarVectors)[0])
console.log(startingTokens.join(' '))
}
*/
// console.log(getPostprocessedVector(12, 2, validationTokens, dictionary))

fs.writeFileSync("vectors_tuned.json", JSON.stringify(vectors))