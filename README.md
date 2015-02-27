# bonjsql

Writing javascript and sql in the same file is horrible, which is why I created this
tiny lib inspired by others such as yesql, jasql, preql, sqlt, amongst others.

I run this together with modules like [node-pg](https://github.com/sehrope/node-pg-db)
specifically because of [named parameter support](https://github.com/sehrope/node-pg-db#named-parameters)

It will read all .sql files in a directory and return an object where each filename -(sql)
is a function that you can execute to run a query on a given DB Adapter.

Each of these query functions return promises (provided by [Q](https://github.com/kriskowal/q)).

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
``

In the above example you will receive an Array of arrays instead of one argument for each result set.

##Tests
You can run the tests using the following command
```
npm test
``

##Todo
Find even better ways to compose queries using promises, perhaps even yield. Better support for other but similar DB adapters.

##License
bonjsql is using the MIT license.
