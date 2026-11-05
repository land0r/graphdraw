const defaultConfig = require( '@wordpress/scripts/config/eslint.config.cjs' );

// The types JSDoc may name, as WordPress's config lists them, and JSX, the type React components return.
const definedTypes = defaultConfig
	.map( ( config ) => config.rules?.[ 'jsdoc/no-undefined-types' ]?.[ 1 ]?.definedTypes )
	.find( Boolean );

module.exports = [
	...defaultConfig,
	{
		settings: {
			// WordPress's packages are scripts the page loads, not dependencies of the plugin: wp-scripts maps them to globals.
			'import/internal-regex': '^@wordpress/',
		},
		rules: {
			'@wordpress/i18n-text-domain': [
				'error',
				{ allowedTextDomain: 'graphdraw-flowcharts-for-mermaid' },
			],
			'import/no-unresolved': [ 'error', { ignore: [ '^@wordpress/' ] } ],
			'jsdoc/no-undefined-types': [
				'error',
				{ definedTypes: [ ...definedTypes, 'JSX' ] },
			],
		},
	},
];
