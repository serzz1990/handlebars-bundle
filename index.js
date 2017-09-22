'use strict';

const glob   = require('glob');
const chalk  = require('chalk');
const path   = require('path');
const fs     = require('fs');
const mkpath = require('mkpath');
const Promise = require('es6-promise').Promise;
const RecursiveWatch = require('recursive-watch');

const EXT = '.hbs';
const BUNDLE_EXT = '.bundle.json';
const timeReBuild = 600;


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
                let name = file.substr(0, file.length - 4).replace(options.root, '');
                let path_template = name.split('/');

                let template_name = path_template.pop();
                path_template = path_template.join('/');

                let output = path.join(options.output, path_template + '/');
                let bundle = JSON.stringify(put_together_template(options.root, name, options));

                mkpath.sync(output);
                fs.writeFileSync(path.join(output, template_name +  BUNDLE_EXT), bundle);
            });

            console.log('[HANDLEBARS-BUNDLE] Finished build', ((Date.now()- start)/ 1000) + 's' );
            resolve();

        })

    });

}

function watch (options) {

    let ext = new RegExp('\\'+ EXT +'$');
    let _timeout;

    options = parse_options(options);

    console.log('[HANDLEBARS-BUNDLE] Start watch');

    RecursiveWatch(options.src + '/', function (filename) {

        if (!~filename.search(ext) || _timeout) return;

        _timeout = setTimeout(function () {
            _timeout = false;
            build(options);
        }, timeReBuild);

    });

}

function get_folders (src, cb) {

    let folders = [];

    glob(src, null, function (err, files) {

        files.forEach(function (file) {

            let folder = file.split('/');
            folder.pop();
            folder = folder.join('/') + '/';

            if (folders.indexOf(folder) < 0) {
                folders.push(folder);
            }

        });

        cb(folders);

    });

}

function parse_options (options = {}) {

    options.root = options.root || options.src;
    options.output = options.output || options.root;
    options.ignore_errors = options.watch || options.ignore_errors;

    return options;

}

function put_together_template (path_prefix, template_name, options, seen = {}) {

    let template_path   = path.join(path_prefix, template_name + EXT);
    let content         = getFileContent(template_path, template_name, options);

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

        let sub_template_name = path;

        if (seen[sub_template_name]) {
            return;
        } else {
            seen[sub_template_name] = 1;
        }

        let sub_template = put_together_template(path_prefix, sub_template_name, options, seen);

        if (sub_template) {
            res.partials[sub_template.template.name] = sub_template.template;

            for (let partial in sub_template.partials) {
                if (sub_template.partials.hasOwnProperty(partial)) {
                    res.partials[partial] = sub_template.partials[partial];
                    seen[partial] = 1;
                }
            }
        }


    });


    return res;

}

function getFileContent (path, partial_name, options) {

    try {

        return fs.readFileSync( path, {encoding: 'utf8'});

    }
    catch (e) {

        if (partial_name.search('/') > -1) {
            error(e.message, options);
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

    console.log(chalk.red('Combiner build error:'));
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
