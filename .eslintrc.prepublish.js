module.exports = {
	...require('./.eslintrc.js'),
	rules: {
		...require('./.eslintrc.js').rules,
		// Stricter rules for publishing
		'@typescript-eslint/no-explicit-any': 'error',
		'@typescript-eslint/no-unused-vars': 'error',
	},
};