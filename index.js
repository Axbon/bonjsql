'use strict';
var fs = require('fs');
var rx = require('rx');
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
 * @param {String} strSql SQL Query in plain text
 * @param {Object} options
 * @private
 * @return {Function}
 */
function getQueryFn(dbAdapter, strSql, options){
	var deferred = Q.defer();
	return function(params){
		if(params){
			dbAdapter.query(strSql, params, handlePromise(deferred));
		} else {
			dbAdapter.query(strSql, handlePromise(deferred));
		}
		return options.rx ? rx.Observable.fromPromise(deferred.promise) : deferred.promise;
	};
}

/**
 * Returns a list of all .sql files in a directory given a path
 *
 * @param {String} path
 * @private
 * @return {Array}
 */
function getSQLFilesData(path){
	var files = [];
		files = fs.readdirSync(path).map(function(file){
			return {
				name: [file.slice(0, -4)],
				data: fs.readFileSync([path, file].join('/'), 'utf8')
			};
		});
	return files;
}

/**
 * Returns an object with functions that can be executed
 * to run queries and generate promises. The names of the
 * loaded sql files are mapped to the property names of this object
 *
 * @param {Object} dbAdapter
 * @param {Array} files
 * @param {Object} options
 * @private
 * @return {Object}
 */
function getSQLQueries(dbAdapter, files, options){
	options = (options || {});
	return files.reduce(function(queries, file){
		queries[file.name] = getQueryFn(dbAdapter, file.data, options);
		return queries;
	}, {});

}




module.exports = {

	/**
	 * Creates an object with query-functions that generate promises.
	 *
	 * @param {Object} dbAdapter
	 * @param {String} path
	 * @private
	 * @return {Object}
	 */
	getQueries:function(dbAdapter, path){
		return getSQLQueries( dbAdapter, getSQLFilesData(path) );
	},

	/**
	 * Creates an object with query-functions, but instead of being based
	 * on promises these query-functions returns RXJS observables.
	 *
	 * @param {Object} dbAdapter
	 * @param {String} path
	 * @private
	 * @return {Object}
	 */
	getRXQueries:function(dbAdapter, path){
		return getSQLQueries( dbAdapter, getSQLFilesData(path), {rx: true} );
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
