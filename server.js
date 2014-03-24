var express = require('express'),
app = express();

var mongo = require('mongoskin');

app.use(express.logger());
app.use('/frontend', express.static('public'));


// ****************TODO: How do you process a request and wait for a response without blocking the thread?  Do I need to spin a worker thread?

//TODO: Add support for XML
app.use(express.bodyParser());

var connUrlString = process.env.MONGO_USERNAME + ":" + process.env.MONGO_PASSWORD + "@" + process.env.MONGO_URL;
console.log(connUrlString);
var conn = mongo.db(connUrlString);    

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


app.get('/projects/:projectId/tasks', function(req, res) {
  var projectId = req.params.projectId;
  
   conn.collection('tasks').find({project: projectId}).toArray(function (err, tasks) {
	   if( err ) {
		   res.status(500);
		   res.send("Unable to retrieve data.");
	   }else {
		   formatCollection( tasks, function (error, formattedResponse) {
			   res.send(formattedResponse);
		   });    
	   }
    });   
   
});

app.put('/projects/:projectId/tasks/:id', function(req, res) {
	// replace an existing task object
	
	console.log(req.body);
	console.log(req.params.id);
	
	var task = req.body.task;
    var title = task.title;
    var description = task.description;    
    var responseData = task.response;
    var methods = task.methods;
    var links = task.links;
    var url = task.url;    
    var id = req.params.id;
    
    var projectId = req.params.projectId;
    task["project"] = projectId;
	
	console.log(title);
	
	conn.collection('tasks').updateById(conn.ObjectID.createFromHexString(id), task, function (err, post) {
            console.log('Error: ' + err);
        	console.log('Post:' + post);
        
        	res.send(post);        
    });
	
	// Update the mock listeners
	registerMockListeners();
	
});

app.post('/projects/:projectId/tasks', function(req, res){
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
    var methods = task.methods;
    
    task["project"] = req.params.projectId;
    
    console.log(id);
    // Store object in database
    if( id === undefined) {
    	console.log(task);
        conn.collection('tasks').insert(task, function (err, post) {
        console.log('Error: ' + err);
        console.log('Post:' + post);
        
        // TODO: return the new node id
        res.send(post);        
        });    
    }else {
    	// TODO: What is this all about?
        conn.collection('tasks').updateById(conn.ObjectID.createFromHexString(id), task, function (err, post) {
            console.log('Error: ' + err);
        console.log('Post:' + post);
        
        // TODO: return the updated node id
        res.send(post);        
        });    
    }
    
    registerMockListeners();
    
       
});

app.patch('/tasks', function(req, res) {
    res.send('you sent a PATCH request - this is not supported yet.');
});

app.delete('/tasks/:id', function(req,res) {
	var id = req.params.id;
	
	conn.collection('tasks').remove({_id: conn.ObjectID.createFromHexString(req.params.id)}, function (err, task) {
       res.send('{ "status" : "deleted" }');       
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
	console.log(profile);
	var name = profile.name;
	var doc = profile.doc;
	var representation = profile.representation;
	
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

// Retrieve a list of authorized projects for this user
app.get('/projects', function(req, res) {
	
	conn.collection('projects').find().toArray(function( err, projects ) {
		res.send(projects); 
	});
	
});

// Create a new project
app.post('/projects', function(req, res) {
	var name = req.body.name;
	var description = req.body.description;
	var hostname = req.body.hostname;
	
	var project = {
			name : name,
			description : description,
			hostname : hostname
	}
			
	conn.collection('projects').insert(project, function (err, post) {
		if( err === null ) {
			res.send(200, '{ "status" : "complete" }');
		}else {
			res.send(500);
		}
	});
	
});



var mockListeners = {};

// setup the backend API based on the state and transitions that have been defined
function registerMockListeners() {
	
	console.log('loading listeners');
	mockListeners = {};
	
	conn.collection('tasks').find().toArray(function (err, tasks) {
		
		conn.collection('projects').find().toArray(function( err, projects ) {
			
			// create an object to store project data by ID key
			var projectMap = {};			
			for( projectIndex in projects ) {
				var project = projects[projectIndex];
				projectMap[project._id] = project;
			}
			
		for( taskIndex in tasks) {			
			var task = tasks[taskIndex];
			var projectId = task.project;
			var project = projectMap[projectId];	
			console.log('project: ' + project);
			
			if( task.url != null && task.url != "" && project != undefined ) {
				var key = project.hostname + "." + task.url;
				console.log(key);
				mockListeners[key] = {
						title : task.title,
						response : task.response,			
						methods : task.methods
				}
			}
		}
		
		});
		
	});
	
}

// use our mock listeners to handle any remaining requests 
app.all('*', function(req, res) {

	console.log('in listener handler.');
	var subdomain = req.host.split(".")[0];
	console.log(subdomain);
	
	var listenerKey = subdomain + "." + req.path;
	console.log(listenerKey);
	
	if( mockListeners[listenerKey] != null) {				
		var listener = mockListeners[listenerKey];
		
		console.log(listener);
		
		if( listener.methods.indexOf(req.method) < 0 ) {		
			// TODO: Allow the user to customize the error message and headers
			res.status(405);
			res.set('Allow',listener.methods);
			res.send("this method is not supported.");
		}else {
			res.send(listener.response);	
		}		
	}else {
		res.status(404);
		res.send('no listener found.');
	}
		
	
});

function formatCollection(collection, callback) {
	//console.log(collection);
	// for now I'm not doing anything - in the future I may format this appropriately
	var formattedResponse = collection;
	var err = null;
	callback(err, formattedResponse);
}

registerMockListeners();

var port = 8080;
app.listen(port);
console.log('Express server started on port %s', port);