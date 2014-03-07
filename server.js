var express = require('express'),
app = express();

var mongo = require('mongoskin');

app.use(express.logger());
app.use('/frontend', express.static('public'));


// ****************TODO: How do you process a request and wait for a response without blocking the thread?  Do I need to spin a worker thread?

//TODO: Add support for XML
app.use(express.bodyParser());

var conn = mongo.db('rmitra:rmitra@linus.mongohq.com:10091/apiprototypedb');    

app.get('/', function(req, res){
    res.send('Hello World');
});

var relsUrl = '/rels'

	// WHat is this?
app.put(relsUrl, function(req, res) {
    
    var source = req.body.rel.source;
    var target = req.body.rel.target;
    var method = req.body.rel.method;
    
    conn.collection('tasks').updateById(conn.ObjectID.createFromHexString(source), {'$push':{links: { link: { targetID: target, method: method } } } });
    
    res.send('done');
})

app.get('/tasks/:id', function(req, res) {
    
   conn.collection('tasks').findOne({_id: conn.ObjectID.createFromHexString(req.params.id)}, function (err, task) {
       //TODO: Translate this object into a canonical form appropriate for our API
       if( task == null ) {
           res.status(404);
           res.send('nope');
       }else {
            res.send(task);
       }
    });
    
});


app.get('/tasks', function(req, res) {
  
   conn.collection('tasks').find().toArray(function (err, tasks) {
       //TODO: Translate this object into a canonical form appropriate for our API
       formatCollection( tasks, function (error, formattedResponse) {
       	res.send(formattedResponse);
       });       
    });
   
});

app.put('/tasks/:id', function(req, res) {
	// replace an existing task object
	
	console.log(req.body);
	console.log(req.params.id);
	
	var task = req.body.task;
    var title = task.title;
    var description = task.description;    
    var responseData = task.response;
    var links = task.links;
    var url = task.url;    
    var id = req.params.id;
	
	console.log(title);
	
	conn.collection('tasks').updateById(conn.ObjectID.createFromHexString(id), task, function (err, post) {
            console.log('Error: ' + err);
        	console.log('Post:' + post);
        
        	res.send(post);        
    });
	
});

app.post('/tasks', function(req, res){
    // Store a newly created task object
        
    console.log(req.body);
    var task = req.body.task;
    var title = task.title;
    var description = task.description;
    var requestData = task.request;
    var responseData = task.response;
    var links = task.links;
    var url = task.url;
    var id = task.nodeId;
    
    console.log(id);
    // Store object in database
    if( id === undefined) {
        conn.collection('tasks').insert(task, function (err, post) {
        console.log('Error: ' + err);
        console.log('Post:' + post);
        
        // TODO: return the new node id
        res.send(post);        
        });    
    }else {
        conn.collection('tasks').updateById(conn.ObjectID.createFromHexString(id), task, function (err, post) {
            console.log('Error: ' + err);
        console.log('Post:' + post);
        
        // TODO: return the updated node id
        res.send(post);        
        });    
    }
    
    
    
       
});

app.patch('/tasks', function(req, res) {
    res.send('you sent a PATCH request - this is not supported yet.');
});

app.delete('/tasks/:id', function(req,res) {
	var id = req.params.id;
	
	conn.collection('tasks').remove({_id: conn.ObjectID.createFromHexString(req.params.id)}, function (err, task) {
       res.send('gone.');       
    });	   
})

// get a list of ALPS profiles
app.get('/ALPS/profiles', function(req, res) {
	conn.collection('alps').find().toArray(function (err, profiles) {
	       	res.send(profiles);	       
	 });
});
	
// create a new ALPS profile	
app.post('/ALPS/profiles', function(req, res) {
	var profile = req.body.profile;
	var name = profile.name;
	var doc = profile.doc;
	
	conn.collection('alps').insert(profile, function (err, post) {
        console.log('Error: ' + err);
        console.log('Post:' + post);
        
        // TODO: return the new profile id
        if( err === null ) {
        	var id = post._id;
        	res.send(id);       
        } else {
        	res.status(500);
        	res.send(err);
        }
        
         
        });    
});


function formatCollection(collection, callback) {
	//console.log(collection);
	// for now I'm not doing anything - in the future I may format this appropriately
	var formattedResponse = collection;
	var err = null;
	callback(err, formattedResponse);
}

var port = 8080;
app.listen(port);
console.log('Express server started on port %s', port);