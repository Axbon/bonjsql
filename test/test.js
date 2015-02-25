/*jshint node: true */
'use strict';

var QUnit = require('qunit-cli');
var bonjsql = require('..');


QUnit.test('Loading queries from folder', function(assert){
	var dbAdapterStub = {
		query:function(){ return null; }
	};
	var queries = bonjsql.getQueries(dbAdapterStub, __dirname + '/' + 'fixtures');
	assert.equal(queries.hasOwnProperty('getUserByID'), true, 'getUserByID loaded successfully');
	assert.equal(queries.hasOwnProperty('getUserByName'), true, 'getUserByName loaded successfully');
});




QUnit.test('Successful query', function(assert){
	var done = assert.async();
	var dbAdapterStub = {
		query:function(strSql, params, fn){
			//This query takes 200ms.
			setTimeout(function(){
				fn(null, [{id: 1}, {id: 2}]);
			}, 200);
		}
	};

	var queries = bonjsql.getQueries(dbAdapterStub, __dirname + '/' + 'fixtures');

	queries.getUserByID()
		 .then(function(rows){
		 		assert.deepEqual(rows, [{id: 1}, {id: 2}], 'Correct result in promise');
		 		done();
		 });
});



QUnit.test('Failed query', function(assert){
	var done = assert.async();
	var dbAdapterStub = {
		query:function(strSql, params, fn){
			//This query takes 500ms.
			setTimeout(function(){
				fn('No connection to database', []);
			}, 500);
		}
	};

	var queries = bonjsql.getQueries(dbAdapterStub, __dirname + '/' + 'fixtures');

	queries.getUserByName()
		 .then(function(){
		 		assert.ok(false, 'This callback should not be executed');
		 })
		 .catch(function(err){
		 		assert.equal(err, 'No connection to database', 'Query should fail.');
		 		done();
		 });
});




QUnit.test('Multiple queries sequence - success', function(assert){
	assert.expect(3);
	var doneSpread = assert.async();
	var doneThen = assert.async();

	var dbAdapterStub = {
		query:function(strSql, params, fn){
			//This query takes 500ms.
			var res = /name/g.test(strSql) ? [{name: 'John Doe', id: 1}] : [{name: 'Foo Bar', id: 2}];
			setTimeout(function(){
				fn(null, res);
				//Each time the queries can take anywhere between 0 - 300 ms
			}, Math.floor( Math.random() * 300 ));
		}
	};
	var queries = bonjsql.getQueries(dbAdapterStub, __dirname + '/' + 'fixtures');

	bonjsql.run(
		queries.getUserByName(),
		queries.getUserByID()
	)
	.spread(function(nameRow, idRow){
		assert.deepEqual(nameRow, [{id: 1, name: 'John Doe'}], 'Result received using spread() First param matches (getUserByName) query row result');
		assert.deepEqual(idRow, [{id: 2, name: 'Foo Bar'}], 'Result received using spread() Second param matches (getUserByID) query row result');
		doneSpread();
	});

	bonjsql.run(
		queries.getUserByName(),
		queries.getUserByID()
	)
	.then(function(result){
		assert.deepEqual(result, [
			[{id: 1, name: 'John Doe'}],
			[{id: 2, name: 'Foo Bar'}]
		], 'Result received using then() Array of Arrays.');
		doneThen();
	});
});





