# bonjsql

Writing large applications using javascript can be a daunting task. It can be hard
to manage the infamous "callback hell". Working with databases on the backend is
usually challenging because of async management.

Here I explore different approaches that can be used to tackle this problem, in this
particular case writing sql and performing database queries efficiently.

The first problem you stumble upon is to keep javascript and sql in the same file(s).
It is not pretty, which is why we should avoid that at all costs. Inspired by other libs such
as yesql, jasql, preql, sqlt, bonjsql provides a way to generate query-functions
from simple .sql files. SQL Templating if you will.

I run this together with modules like [node-pg](https://github.com/sehrope/node-pg-db)
specifically because of [named parameter support](https://github.com/sehrope/node-pg-db#named-parameters)

It will read all .sql files in a directory and return an object where each filename -(.sql)
is a function that you can execute to run a query on a given DB Adapter.

Each of these query-functions return promises (provided by [Q](https://github.com/kriskowal/q)).

You can also use this to generate observables. Instead of using simple promises, wrap all of the promises in [RxJS](https://github.com/Reactive-Extensions/RxJS) Observables.
This opens the door to very very powerful async/event based array composition techniques. It produces really elegant code both on the server and client. Read more about [rxjs here](https://github.com/Reactive-Extensions/RxJS)

##Examples

Assuming the following SQL exists in a file named getSomething.sql in 'path/to/files'

```sql
SELECT * FROM table WHERE id = :id
```

The following example uses that query

```js
var db = require('pg-db')();
var bonjsql = require('bonjsql');

var queries = bonjsql.getQueries(db, 'path/to/sql/files');

queries.getSomething({id: 1})
 .then(function(rows){
 	//Do something with rows
 })
 .catch(function(err){
  //Handle errors
 });
```

Load the sql file "getSomething.sql", turn it into a
query, run it supplying the named parameter "id" with the value of 1,
using promises to do something with the result and catch any errors.


##Run several queries

```js
'use strict';
var queries = bonjsql.getQueries('path/to/sql/files');

bonjsql.run(
	queries.getA(),
	queries.getB(),
	queries.someOtherQuery()
)
.spread(function(a, b, c){
	//Result rows a, b, c
})
.catch(function(err){
	//Handle errors
})
```

You can also use "then" instead of "spread" when running multiple queries

```js
'use strict';
bonjsql.run(
	queries.getA(),
	queries.getB(),
	queries.someOtherQuery()
)
.then(function(arrResult){
	// arrResult[0] => [rows...]
})
.catch(function(err){
	//Handle errors
})
```

In the above example you will receive an Array of arrays instead of one argument for each result set.

##Example using observables

```js
'use strict';
var rx = require('rx');
var db = require('pg-db')();
var bonjsql = require('bonjsql');

var mapper = bonjsql.getRXQueries(db, __dirname + '/queries');

mapper
	.getSomething({id: 1})
	.flatMap(rx.Observable.from)
	.map(function(result){
		return {
			id: result.id,
			name: result.name.charAt(0).toUpperCase() + result.name.slice(1)
		};
	})
	.toArray()
	.subscribe(function(data){
		console.log(data); //Do something with result
	}, function(err){
		console.log(err); //Handle error
	}, function(){
		console.log('all done!'); //All done
	});
```

Using ES6 and arrow functions the above code becomes even more elegant:

```js

mapper
	.getSomething({id: 1})
	.flatMap(rx.Observable.from)
	.map(result => {
		return {
			id: result.id,
			name: result.name.charAt(0).toUpperCase() + result.name.slice(1)
		};
	})
	.toArray()
	.subscribe(data =>{
		console.log(data); //Do something with result
	}, err => {
		console.log(err); //Handle error
	}, () => {
		console.log('all done!'); //All done
	});

```

[A world of possibilities](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/libraries/rx.complete.md#observable-instance-methods) really does open up when using rxjs together with promises, see link for complete observable api.


##Tests
You can run the tests using the following command
```
npm test
```

##In the future
Find better ways to compose queries using promises, observables, etc. Make the world of databases manageable in JS-applications at scale.

##License
bonjsql is using the MIT license.
