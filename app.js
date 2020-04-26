const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

/*---------------------------- Database --------------------------------------*/

//Database - Connection:----------->
// const databaseUrl = 'mongodb://localhost:27017';
const databaseUrl = "mongodb+srv://admin-amin:admin123@cluster0-74vdq.mongodb.net/";
mongoose.connect(databaseUrl + "toDoListDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

//Database - Collection: Tasks: ------------------>

//Database - Create a Schema:
const tasksSchema = new mongoose.Schema({name: String});

//Database - Create a Collection "Model":
const Task = mongoose.model("Task", tasksSchema);

//Database - Create a documents:
const task1 = new Task({name: "Hit + button to add tasks."});
const task2 = new Task({name: "<--- Hit here to remove a task."});
const defaultTasks = [task1, task2];

//Database - Collection: Lists: ------------------>

//Database - Create A Schema:
const listsSchema = new mongoose.Schema({
  name: String,
  tasks: [tasksSchema]
});

//Database - Create a Collection:
const List = mongoose.model("List", listsSchema);

/*---------------------------- Home-page--------------------------------------*/

//Route handler:
app.get("/", function(req, res) {

  List.find({}, function(err, foundInfo) {
    if (!err) {

      //Database - Read / Query Documents:------------------------------->
      Task.find({}, function(err, data) {

        //Only if the Database is empty, will add a default data:
        if (data.length === 0) {

          //Database - save documents:
          Task.insertMany(defaultTasks, function(err) {

            if (err) {
              console.log(err);
            } else {
              console.log("Successfully Added");
            }
          });

          res.redirect("/");

        } else {
          res.render("list", {
            listButton: foundInfo,
            listTitle: "Today",
            newListItems: data
          });
        }
      });
      //---------------------------------------------------------------->
    }
  });
});

//POSTed data handler:
app.post("/", function(req, res) {

  const item = req.body.newItem;
  const listName = req.body.list;
  // Database - Create a document:
  const task = new Task({name: item});

  if (listName === "Today") {
    //Database - Save document:
    task.save();
    res.redirect("/");

  } else {

    List.findOne({name: listName}, function(err, data){
      data.tasks.push(task);
      data.save();
      res.redirect("/" + listName);
    });

  }
});

//Removing task checkbox:
//POSTed data handler:
app.post("/delete", function(req, res) {

  const taskToBeRemovedID = req.body.checkbox;
  const taskToBeRemovedName = req.body.listName;

  if (taskToBeRemovedName == "Today") {

    // Database - Delete a document: ---- >
    Task.deleteOne({_id: taskToBeRemovedID}, function(err) {
      if (!err) {
        res.redirect("/");
      };
    });
    //----------------------------------- >
  } else {
    // Database - Delete a document from array using $pull: ---- >
    List.updateOne({name: taskToBeRemovedName}, {$pull: {tasks: {_id: taskToBeRemovedID}}} , function(err, info) {
      if (!err) {
        res.redirect("/" + taskToBeRemovedName);
      }
    });
    //---------------------------------------------------------- >
  }
});

//Adding new list button:
//POSTed data handler:
app.post("/newList", function(req, res) {
  res.redirect("/" + req.body.newList);
});

//Removeing list button:
//POSTed data handler:
app.post("/removeList", function(req, res) {
  const removedListName = req.body.removedListName;

  List.deleteOne({name: removedListName}, function(err) {});

  res.redirect("/");
});

/*----------------------------- List-page ------------------------------------*/

//Route handler:
app.get("/:id", function(req, res) {

  List.find({}, function(err, foundInfo) {
    if (!err) {

      //Capitalize the provided listName:
      customeListName = _.capitalize(req.params.id);

      List.findOne({name: customeListName}, function(err, data) {

        if (!err) {

          if (!data) {
            //Database - Create document - default tasks:----->
            const list = new List({
              name: customeListName,
              tasks: defaultTasks
            });

            list.save();
            //------------------------------------------------>
            res.redirect("/" + customeListName);

          } else {

            res.render("list.ejs", {
              listButton: foundInfo,
              listTitle: data.name,
              newListItems: data.tasks
            });
          }
        }
      });
    }
  });
});
/*----------------------------- Launch the Server ----------------------------*/

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
};

app.listen(port, function() {
  console.log("Server has started successfully");
});
