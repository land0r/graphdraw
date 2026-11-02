/**
 * The default configuration of `wp-scripts test-unit-js`, and Pele (an ES
 * module package) run through Babel, to draw with the real one.
 */
const config = require( '@wordpress/scripts/config/jest-unit.config' );

module.exports = {
	...config,
	setupFiles: [ ...( config.setupFiles || [] ), '<rootDir>/jest.setup.js' ],
	transformIgnorePatterns: [ '/node_modules/(?!pele/)' ],
};
