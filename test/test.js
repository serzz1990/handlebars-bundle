const HandlebarsBundleBuild = require('../index');

HandlebarsBundleBuild({
	src : process.cwd() + '/test/source/',
	root: process.cwd() + '/test/source/',
	dest: process.cwd() + '/test/public/',
	watch: process.argv.indexOf('--watch') !== -1
});