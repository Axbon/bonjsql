'use strict';
var fs = require('fs');
var Q = require('q');


/**
 * Generate callback that rejects or resolve the promise based on the
 * outcome of the query.
 *
 * @param {Object} deferred Q-deferred
 * @private
 * @return {Function}
 */
function handlePromise(deferred){
	return function(err, rows){
		if(err){
			deferred.reject(err);
		} else {
			deferred.resolve(rows);
		}
	};
}

/**
 * Create a function that runs a query and returns
 * a promise.
 *
 * @param {Object} dbAdapter Compatible DBAdapter w/Connection see pg-db
 * @param {String} path Directory containing .sql file
 * @param {String} file Filename
 * @private
 * @return {Function}
 */
function getQueryFn(dbAdapter, path, file){
	var strSql = fs.readFileSync(path + '/' + file, 'utf8');
	var deferred = Q.defer();
	return function(params){
		if(params){
			dbAdapter.query(strSql, params, handlePromise(deferred));
		} else {
			dbAdapter.query(strSql, handlePromise(deferred));
		}
		return deferred.promise;
	};
}

/**
 * Returns a list of all .sql files in a directory given a path
 *
 * @param {String} path
 * @private
 * @return {Array}
 */
function getSQLFiles(path){
	var files;
	try{
		files = fs.readdirSync(path);
	} catch(e){
		console.log('[BONJSQL] Directory ' + path + ' does not exist');
		files = [];
	}
	return files;
}

/**
 * Returns an object with functions that can be executed
 * to run queries and generate promises. The names of the
 * loaded sql files are mapped to the property names of this object
 *
 * @param {Object} dbAdapter
 * @param {Array} files
 * @param {String} path
 * @private
 * @return {Object}
 */
function getSQLQueries(dbAdapter, files, path){
	return files.reduce(function(queries, file){
		queries[file.slice(0, -4)] = getQueryFn(dbAdapter, path, file);
		return queries;
	}, {});
}




module.exports = {

	/**
	 * Returns an object with query-functions, ready to run.
	 *
	 * @param {Object} dbAdapter
	 * @param {String} path
	 * @private
	 * @return {Object}
	 */
	getQueries:function(dbAdapter, path){
		return getSQLQueries( dbAdapter, getSQLFiles(path), path );
	},

	/**
	 * Run several queries, returns a promise.
	 *
	 * @private
	 * @return {Object}
	 */
	run:function(){
		return Q.all(Array.prototype.slice.call(arguments));
	}
};
