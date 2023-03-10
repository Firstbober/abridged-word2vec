const mathjs = require('mathjs')
const natural = require('natural');

const tokenizer = new natural.TreebankWordTokenizer();

const vectorConfig = {
	tokensIntoFuture: 10,
	tokensIntoPast: 10
}

module.exports = {
	genereteVectorFromIndex(idx, sentenceLength, tokens, dictionary) {
		const vector = [sentenceLength, ...new Array(vectorConfig.tokensIntoPast).fill(0),
			...new Array(vectorConfig.tokensIntoFuture).fill(0)]

		{
			let intoPast = idx - vectorConfig.tokensIntoPast;
			intoPast = (intoPast < 0) ? 0 : intoPast

			for (let i = idx - 1; i >= intoPast; i--) {
				const t = tokens[i].toLowerCase();
				vector[1 + (vectorConfig.tokensIntoPast) - (idx - i)] = mathjs.mean(vector[1 + (vectorConfig.tokensIntoPast) - (idx - i)], dictionary.get(t))
			}
		}
		{
			let intoFuture = idx + 1 + vectorConfig.tokensIntoFuture;
			intoFuture = (intoFuture > tokens.length) ? tokens.length : intoFuture;

			for (let i = idx + 1; i < intoFuture; i++) {
				const t = tokens[i].toLowerCase();
				vector[vectorConfig.tokensIntoPast + (i - idx)] = mathjs.mean(vector[vectorConfig.tokensIntoPast + (i - idx)], dictionary.get(t))
			}
		}

		return vector
	},

	genereteVectorFromIndexRaw(idx, sentenceLength, tokens, dictionary) {
		const vector = [sentenceLength, ...new Array(vectorConfig.tokensIntoPast).fill(0),
			...new Array(vectorConfig.tokensIntoFuture).fill(0)]

		{
			let intoPast = idx - vectorConfig.tokensIntoPast;
			intoPast = (intoPast < 0) ? 0 : intoPast

			for (let i = idx - 1; i >= intoPast; i--) {
				const t = tokens[i].toLowerCase();
				vector[1 + (vectorConfig.tokensIntoPast) - (idx - i)] = mathjs.mean(vector[1 + (vectorConfig.tokensIntoPast) - (idx - i)], dictionary[t])
			}
		}
		{
			let intoFuture = idx + 1 + vectorConfig.tokensIntoFuture;
			intoFuture = (intoFuture > tokens.length) ? tokens.length : intoFuture;

			for (let i = idx + 1; i < intoFuture; i++) {
				const t = tokens[i].toLowerCase();
				vector[vectorConfig.tokensIntoPast + (i - idx)] = mathjs.mean(vector[vectorConfig.tokensIntoPast + (i - idx)], dictionary[t])
			}
		}

		return vector
	},

	generateTokens(text) {
		return tokenizer.tokenize(text)
	}
}