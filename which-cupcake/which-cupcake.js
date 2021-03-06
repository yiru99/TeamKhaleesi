// This is bad long term design, since client can easily access our database
// from the console... But works for show now! 
polls = new Mongo.Collection("polls");
votes = new Mongo.Collection("votes");
var imageStore = new FS.Store.GridFS("images");

Images = new FS.Collection("images", {
    stores: [imageStore]
});

Images.deny({
    update: function(){
        return false;
    }
});

Images.allow({
    insert: function(){
        return true;
    },
    remove: function(){
        return true;
    },
    download: function(){
        return true;
    }
});


if (Meteor.isClient) {
    Template.body.helpers({
        polls:function(){
            return polls.find({},{sort: {createdAt: -1}});
        },
        isOpen: function(status){
            return status == "open"
        }
    });

    Template.poll.events({

        'click .question': function(event, template){
            template.$(".content").toggle();
        },
        'click .vote1': function(event, template) {
            var visited = Meteor.cookie.get("which-cupcake"+this._id);
            console.log(visited);
            if (visited != null) {
                alert("You have voted already!"); 
                return false;
            }

            var votesByPollId = polls.find(this._id);
            if (isNaN(this.vote1)) this.vote1 = 0;
            polls.update(this._id, {$set: {vote1: this.vote1+1}});
            Meteor.cookie.set("which-cupcake"+this._id, 1);
            event.stopImmediatePropagation(); 
        },
        'click .vote2': function(event, template) {
            var visited = Meteor.cookie.get("which-cupcake"+this._id);
            console.log(visited);
            if (visited != null) {
                alert("You have voted already!"); 
                return false;
            }

            var votesByPollId = polls.find(this._id);
            if (isNaN(this.vote2)) this.vote2 = 0;
            polls.update(this._id, {$set: {vote2: this.vote2+1}});
            Meteor.cookie.set("which-cupcake"+this._id, 1);
            event.stopImmediatePropagation(); 
        }
    });

    ReactiveTabs.createInterface({
        template: 'basicTabs',
        onChange: function (slug, template) {
            // This callback runs every time a tab changes.
            // The `template` instance is unique per {{#basicTabs}} block.
            console.log('[tabs] Tab has changed! Current tab:', slug);
            console.log('[tabs] Template instance calling onChange:', template);
        }
    });

    Template.body.events({  
        'click button.ask': function(event, template) {
            Session.set('activeModal', true);
        }
    });

    Template.askModal.events({
        'change .imageUpload1': function(event, template) {
            FS.Utility.eachFile(event, function(file) {
                Images.insert(file, function (err, fileObj) {
                    if (err){
                        // handle error
                    } else {
                        // handle success depending what you need to do
                        var imagesURL =  "http://localhost:3000/cfs/files/images/" + fileObj._id;
                        Session.set('option1',imagesURL);
                    }
                });
            });
        },

        'change .imageUpload2': function(event, template) {
            FS.Utility.eachFile(event, function(file) {
                Images.insert(file, function (err, fileObj) {
                    if (err){
                        // handle error
                    } else {
                        // handle success depending what you need to do
                        var imagesURL ="http://localhost:3000/cfs/files/images/" + fileObj._id;
                        Session.set('option2',imagesURL);
                    }
                });
            });
        },

        "submit .addPoll": function (event) {
            // This function is called when the new task form is submitted

            var text = event.target.text.value;
            var duration = event.target.duration.value;
            var askedBy = event.target.askedBy.value;
            var option1 = Session.get('option1');
            var option2 = Session.get('option2');

            polls.insert({
                text: text,
                duration: duration,
                askedBy: askedBy,
                createdAt: new Date(),
                option1: option1,
                option2: option2,
                status: "open"
            });

            // Clear form
            event.target.text.value = "";
            event.target.askedBy.value = "";
            event.target.duration.value = 0;

            // Prevent default form submit
            return false;
        }
    });


    Template.askModal.helpers({  
        activeModal: function() {
            return Session.get('activeModal');
        },
        option1: function(){
            return Session.get('option1'); 
        },
        option2: function(){
            return Session.get('option2'); 
        }
    });

    Template.body.helpers({
        tabs: function () {
            // Every tab object MUST have a name and a slug!
            return [
                { name: 'Open polls', slug: 'openpolls', onRender: function(template){
                    $(".content").hide();
                } },
                { name: 'Closed polls', slug: 'closedpolls' },
                // { name: 'My polls', slug: 'mypolls', onRender: function(template) {
                //   // This callback runs every time this specific tab's content renders.
                //   // As with `onChange`, the `template` instance is unique per block helper.
                //   alert("[tabs] Things has been rendered!");
                // }}
            ];
        },
        activeTab: function () {
            // Use this optional helper to reactively set the active tab.
            // All you have to do is return the slug of the tab.

            // You can set this using an Iron Router param if you want--
            // or a Session variable, or any reactive value from anywhere.

            // If you don't provide an active tab, the first one is selected by default.
            // See the `advanced use` section below to learn about dynamic tabs.
            return Session.get('activeTab'); // Returns "people", "places", or "things".
        }
    });

    Template.poll.helpers({
        //timeLeft :  Math.floor((this.endTime - new Date())/60000)
        timeLeft : function() {  
	    return Math.floor((this.endTime - new Date())/60000)
        }
    });
}

if (Meteor.isServer) {
    Meteor.startup(function () {
        // code to run on server at startup
    });
}

// server methods
Meteor.methods({
    vote: function (answer) {
        
        // // Make sure the poll is logged in before inserting a task
        // if (! Meteor.pollId()) {
        //   throw new Meteor.Error("not-authorized");
        // }
        
        // Tasks.insert({
        //   text: text,
        //   createdAt: new Date(),
        //   owner: Meteor.pollId(),
        //   pollname: Meteor.poll().pollname
        // });
    }
});

