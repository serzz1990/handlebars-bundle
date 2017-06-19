'use strict';

var glob   = require('glob');
var chalk  = require('chalk');
var path   = require('path');
var fs     = require('fs');
var mkpath = require('mkpath');
var Promise = require('es6-promise').Promise;

var EXT = '.hbs';
var BUNDLE_EXT = '.bundle.json';


function build (options) {

	let start = Date.now();
	options = parse_options(options);

	console.log('[HANDLEBARS-BUNDLE] Start build');

	return new Promise(function (resolve, reject) {

        glob(path.join(options.src, '**/*' + EXT), null, function (err, files) {

            if (err) {
                reject(err);
                return error(err, options);
            }

            files.forEach(function (file) {
                var name = file.substr(0, file.length - 4).replace(options.root, '');
                var path_template = name.split('/');

                var template_name = path_template.pop();
                path_template = path_template.join('/');

                var dest = path.join(options.dest, path_template + '/');
                var bundle = JSON.stringify(put_together_template(options.root, name, options));

                mkpath.sync(dest);
                fs.writeFileSync(path.join(dest, template_name +  BUNDLE_EXT), bundle);
            });

            console.log('[HANDLEBARS-BUNDLE] Finished build', ((Date.now()- start)/ 1000) + 's' );
            resolve();

        })

	});

}

function watch (options) {

	var ext = new RegExp('\\'+ EXT +'$');

	options = parse_options(options);
	options.watch = false;

	get_folders(path.join(options.src, '**/*' + EXT), function (folders) {

		if (!folders.length) return;

		folders.forEach(function (folder) {
			fs.watch(folder, {}, function (eventType, filename) {

				if (filename.search(ext) > -1) {
					build(options);
				}

			});
		});

		if (folders.length) {
			console.log('[HANDLEBARS-BUNDLE] Start watch');
		}

	});

}

function get_folders (src, cb) {

	var folders = [];

	glob(src, null, function (err, files) {

		files.forEach(function (file) {

			var folder = file.split('/');
			folder.pop();
			folder = folder.join('/') + '/';

			if (folders.indexOf(folder) < 0) {
				folders.push(folder);
			}

		});

		cb(folders);

	});

};

function parse_options (options = {}) {

	options.root = options.root || options.src;
	options.dest = options.dest || options.root;
	options.ignore_errors = options.watch || options.ignore_errors;

	return options;

}

function put_together_template (path_prefix, template_name, options, seen = {}) {

	let template_path   = path.join(path_prefix, template_name + EXT);
	let content         = getFileContent(template_path, template_name);

	let res = {
		template: {},
		partials: {}
	};

	if (content === null) {
		return;
	}

	res.template.name = template_name;
		res.template.content = content.replace(/(\r\n|\n|\r)/gm, '').replace(/\s+/g, ' ');
		res.template.mtime = fs.statSync(template_path).mtime.getTime();

		getPartialsByContent(content).forEach(function (path) {

			var sub_template_name = path;

			if (seen[sub_template_name]) {
				return;
			} else {
				seen[sub_template_name] = 1;
			}

			var sub_template = put_together_template(path_prefix, sub_template_name, options, seen);

			if (sub_template) {
				res.partials[sub_template.template.name] = sub_template.template;

				for (var partial in sub_template.partials) {
					if (sub_template.partials.hasOwnProperty(partial)) {
						res.partials[partial] = sub_template.partials[partial];
						seen[partial] = 1;
					}
				}
			}


		});


	return res;

}

function getFileContent (path, partial_name) {

	try {

		return fs.readFileSync( path, {encoding: 'utf8'});

	}
	catch (e) {

		if (partial_name.search('/') > -1) {
            console.error(e.message);
		}

		return null;
	}

}

function getPartialsByContent (content) {

	let result;
	let partials = [];
	let regexp = /{{(>|extend\s)\s?"?(.+?)("|'|\s|})/g;

	//Еще одно решение
	//{{(>|extend)(\s)*["]{0,1}([^"(\s)]*)?(["]{0,1})(\s)*}}

	while (result = regexp.exec(content)) {
		partials.push(result[2]);
	}


	return partials;
}

function error (err, options) {

	console.log(chalk.red('Combiner Build: Error:'));
	console.log(chalk.red(err));

	if (!options.ignore_errors){
		process.exit(88);
	}

}


module.exports = function (options) {

    if (options.watch) {
        watch(options);
    }

    return build(options);

};
