'use strict';

var glob  = require('glob');
var chalk = require('chalk');
var path  = require('path');
var fs    = require('fs');


function handelbars () {}


handelbars.ext = '.hbs';

handelbars.bundle_ext = '.bundle.json';


/**
 *
 */
handelbars.build = function (options) {

	options = this.__parse_options(options);

	glob(path.join(options.src, '**/*' + handelbars.ext), null, function (err, files) {

		if (err) {
			return error(err, options);
		}

		files.forEach(function (file) {
			var name = file.substr(0, file.length - 4).replace(options.root, '');
			var dest = name + handelbars.bundle_ext;
			fs.writeFileSync(path.join(options.root, dest), JSON.stringify(put_together_template(options.root, name)));
		});

		console.log(chalk.green('Combiner Build: Done without errors,', files.length, 'files processed'));

	});

	if (options.watch) {
		handelbars.watch(options);
	}

};


handelbars.watch = function (options) {

	var ext = new RegExp('\\'+ handelbars.ext +'$');

	options = this.__parse_options(options);
	options.watch = false;

	this.__get_folders(path.join(options.src, '**/*' + handelbars.ext), function (folders) {

		if (!folders.length) return;

		folders.forEach(function (folder) {
			fs.watch(folder, {}, function (eventType, filename) {

				if (filename.search(ext) > -1) {
					handelbars.build(options);
				}

			});
		});

		if (folders.length) {
			console.log(chalk.green('Combiner Watching start'));
		}

	});

};


handelbars.__get_folders = function (src, cb) {

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


handelbars.__parse_options = function (options = {}) {

	options.root = options.root || options.src;

	return options;

};


function put_together_template (path_prefix, template_name, seen = {}) {

	let content   = fs.readFileSync( path_prefix + template_name + handelbars.ext, {encoding: 'utf8'});
	let partials  = getPartialsByContent(content);
	let res = {
		template: {
			name: template_name,
			content: content.replace(/(\r\n|\n|\r)/gm, '').replace(/\s+/g, ' '),
			mtime: fs.statSync( path_prefix + template_name + handelbars.ext).mtime.getTime()
		},
		partials: {}
	};


	partials.forEach(function (path) {

		var sub_template_name = path;

		if (seen[sub_template_name]) {
			return;
		} else {
			seen[sub_template_name] = 1;
		}

		var sub_template = put_together_template(path_prefix, sub_template_name, seen);
		res.partials[sub_template.template.name] = sub_template.template;

		for (var partial in sub_template.partials) {
			if (sub_template.partials.hasOwnProperty(partial)) {
				res.partials[partial] = sub_template.partials[partial];
				seen[partial] = 1;
			}
		}

	});

	return res;

}


function getPartialsByContent (content) {

	let result;
	let partials = [];
	let regexp = /{{(>|extend)\s?"?(.+?)"?\s?}}/g;

	while (result = regexp.exec(content)) {
		partials.push(result[2]);
	}


	return partials;
}


function readFile(file) {
	try {
		return JSON.parse(fs.readFileSync(file, {encoding: "utf8"}));
	} catch (err) {
		throw "Failed to read json from '" + file + "': " + err;
	}
}


function error (err, options) {

	console.log(chalk.red('Combiner Build: Error:'));
	console.log(err);

	if (!options.ignore_errors){
		process.exit(88);
	}

}


module.exports = handelbars;
