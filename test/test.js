const bundle = require('../index');

bundle.build({
	src : process.cwd() + '/test/section/',
	root: process.cwd() + '/test/',
	watch: process.argv.indexOf('--watch') !== -1,
	ignore_errors: true
});