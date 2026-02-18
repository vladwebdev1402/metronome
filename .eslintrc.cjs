/** @type {import('eslint').Linter.Config} */

module.exports = {
	parserOptions: {
		project: './tsconfig.app.json',
	},
	extends: [
		'airbnb',
		'airbnb-typescript',
		'plugin:@typescript-eslint/recommended',
		'prettier',
		'plugin:effector/recommended',
		'plugin:effector/future',
		'airbnb/hooks',
	],
	plugins: ['@stylistic', 'effector'],
	rules: {
		'react/react-in-jsx-scope': 0,
		'react/function-component-definition': [
			2,
			{
				namedComponents: 'arrow-function',
				unnamedComponents: 'arrow-function',
			},
		],
		'react/button-has-type': 0,
		'react/require-default-props': 0,
		'react/destructuring-assignment': [2, 'always', { destructureInSignature: 'always' }],
		'react/forward-ref-uses-ref': 2,
		'react/hook-use-state': 2,
		'react/no-multi-comp': 2,
		'react/jsx-sort-props': [
			2,
			{
				shorthandFirst: true,
				callbacksLast: true,
				reservedFirst: true,
				noSortAlphabetically: true,
			},
		],
		'react/jsx-props-no-spreading': 0,
		'react/jsx-pascal-case': 2,
		'react-hooks/exhaustive-deps': 0,
		'jsx-a11y/click-events-have-key-events': 0,
		'jsx-a11y/no-static-element-interactions': 0,
		'jsx-a11y/label-has-associated-control': 0,
		'import/no-extraneous-dependencies': 0,
		'import/no-relative-packages': 0,
		'@stylistic/padding-line-between-statements': [
			2,
			{
				blankLine: 'always',
				next: '*',
				prev: ['multiline-expression', 'multiline-const', 'multiline-let', 'import', 'export'],
			},
			{
				blankLine: 'always',
				next: ['multiline-expression', 'multiline-const', 'multiline-let', 'import', 'export'],
				prev: '*',
			},
			{
				blankLine: 'always',
				next: 'return',
				prev: '*',
			},
			{
				blankLine: 'always',
				next: 'block-like',
				prev: 'block-like',
			},
			{
				blankLine: 'never',
				next: 'import',
				prev: 'import',
			},
			{
				blankLine: 'any',
				next: 'export',
				prev: 'export',
			},
		],
		'@typescript-eslint/no-unused-expressions': [
			2,
			{
				allowShortCircuit: true,
				allowTernary: true,
			},
		],
		'@typescript-eslint/no-use-before-define': [2, { functions: false }],
		'@typescript-eslint/no-var-requires': 0,
		'import/prefer-default-export': 0,
		'no-param-reassign': [2, { props: false }],
		'no-restricted-exports': [2, { restrictDefaultExports: { namedFrom: false } }],
		'no-warning-comments': ['error', { terms: ['delete'], location: 'start' }],
	},
	overrides: [
		{
			files: ['*.test.{js,cjs,mjs,jsx,ts,tsx}'],
			rules: {
				'import/no-extraneous-dependencies': 0,
			},
		},
	],
};
