

MembersList = new Mongo.Collection('members');
GroupsList = new Mongo.Collection('groups');

Router.configure({
    loadingTemplate: 'Loading',
    notFoundTemplate: 'notFound'
});

Router.route('/home', {
    name: 'Home',
    template: 'Home',
    onBeforeAction: function () {
        if (!Meteor.user() && !Meteor.loggingIn()) {
            Router.go('/');
        } else {
            this.next();
        }
    }
});

Router.route('/', function () {
    this.render('Landing')
});

Router.route('/checkin/:_id/:_gid/:_gn', {
    name: 'checkinPage',
    template: 'checkInMember',
    onBeforeAction: async function () {
        var id = this.params._id;
        var gid = this.params._gid;
        var gn = this.params._gn;
        var valid = await new Promise((resolve, reject) =>
            Meteor.call('validateURL', id, gid, gn, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            })
        );
        console.log(valid);
        if (valid) {
            this.render('checkInMember');
        } else {
            this.render('notFound');
        }
    }
});


if (Meteor.isClient) {
    Meteor.subscribe('theMembers');
    Meteor.subscribe('theGroups');
    $.validator.setDefaults({
        rules: {
            memberName: {
                required: true
            },
            memberYear: {
                required: true,
                digits: true,
                min: 1,
                max: 4
            },
            memberEmail: {
                required: true,
                email: true
            }
        }
    });
    Template.groupSelection.helpers({
        'group': function () {
            var currentUserId = Meteor.userId();
            return GroupsList.find({ createdBy: currentUserId });
        },
        'selectedGroup': function () {
            var selectedGroup = Session.get('selectedGroup');
            return GroupsList.findOne({ _id: selectedGroup });
        },
        'selectedClass': function () {
            var groupId = this._id;
            var selectedGroup = Session.get('selectedGroup');
            if (groupId == selectedGroup)
                return "selected";
        },
        'maxGroups': function () {
            var currentUserId = Meteor.userId();
            return (GroupsList.find({ createdBy: currentUserId }).count() > 2);
        }
    });
    Template.groupSelection.events({
        'click .createGroup': function () {
            var groupName = prompt('Group Name');
            var currentUserId = Meteor.userId();
            check(groupName, String);
            Meteor.call('createGroup', groupName, currentUserId);
        },
        'click .group': function () {
            var groupId = this._id;
            console.log(groupId);
            if (Session.get('selectedGroup') === groupId)
                Session.setPersistent('selectedGroup')
            else
                Session.setPersistent('selectedGroup', groupId);
        },
        'touchstart .group': function () {
            var groupId = this._id;
            console.log(groupId);
            if (Session.get('selectedGroup') === groupId)
                Session.setPersistent('selectedGroup')
            else
                Session.setPersistent('selectedGroup', groupId);
        },
        'click .useGroup': function () {
            var selectedGroup = Session.get('selectedGroup');
            Session.setPersistent('chosenGroup', true);
            Session.setPersistent('curGroup', selectedGroup);
            console.log(Session.get('curGroup'));
            console.log(GroupsList.findOne({ _id: selectedGroup }).name);
        },
        'click .removeGroup': function () {
            var selectedGroup = Session.get('selectedGroup');
            Meteor.call('removeGroup', selectedGroup);
        }
    });
    Template.Home.helpers({
        'startup': function () {
            Session.set('allTable', true);
            Session.set('freshTable', false);
            Session.set('sophTable', false);
            Session.set('junTable', false);
            Session.set('senTable', false);
        },
        'member': function () {
            var currentUserId = Meteor.userId();
            return MembersList.find({ createdBy: currentUserId, groupId: Session.get('curGroup') }, { sort: { year: 1, name: -1 } });
        },
        'freshman': function () {
            var currentUserId = Meteor.userId();
            return MembersList.find({ createdBy: currentUserId, groupId: Session.get('curGroup'), year: 1 }, { sort: { name: -1 } });
        },
        'sophomore': function () {
            var currentUserId = Meteor.userId();
            return MembersList.find({ createdBy: currentUserId, groupId: Session.get('curGroup'), year: 2 }, { sort: { name: -1 } });
        },
        'junior': function () {
            var currentUserId = Meteor.userId();
            return MembersList.find({ createdBy: currentUserId, groupId: Session.get('curGroup'), year: 3 }, { sort: { name: -1 } });
        },
        'senior': function () {
            var currentUserId = Meteor.userId();
            return MembersList.find({ createdBy: currentUserId, groupId: Session.get('curGroup'), year: 4 }, { sort: { name: -1 } });
        },
        'selectedClass': function () {
            var userId = this._id;
            var selectedMember = Session.get('selectedMember');
            if (userId == selectedMember)
                return "selected";
        },
        'selectedMember': function () {
            var selectedMember = Session.get('selectedMember');
            return MembersList.findOne({ _id: selectedMember });
        },
        'checkedInMember': function () {
            var currentUserId = Meteor.userId();
            var userId = this._id;
            if (MembersList.findOne({ createdBy: currentUserId, _id: userId }).checkedIn === "Yes") {
                return true;
            }
            else {
                return false;
            }
        },
        'emailSent': function() {
            var currentUserId = Meteor.userId();
            var userId = this._id;
            if (MembersList.findOne({ createdBy: currentUserId, _id: userId}).checkedIn === 'Email sent') {
                return true;
            }
            else {
                return false;
            }
        },
        'chosenGroup': function () {
            return Session.get('chosenGroup');
        },
        'curGroup': function () {
            var curGroup = Session.get('selectedGroup');
            return GroupsList.findOne({ _id: curGroup });
        },
        'rollInProgress': function () {
            return Session.get('rollInProgress');
        },
        'freshmanTable': function () {
            return Session.get('freshTable');
        },
        'sophomoreTable': function () {
            return Session.get('sophTable');
        },
        'juniorTable': function () {
            return Session.get('junTable');
        },
        'seniorTable': function () {
            return Session.get('senTable');
        },
        'allTable': function () {
            return Session.get('allTable');
        }
    });
    Template.Landing.helpers({
        'showRegister': function () {
            Session.setPersistent('invalidLogin', false)
            return Session.get('showRegister');
        }
    });
    Template.login.helpers({
        'invalidLogin': function () {
            return Session.get('invalidLogin');
        }
    });
    Template.Home.events({
        'click .member': function () {
            var userId = this._id;
            if (Session.get('selectedMember') === userId)
                Session.setPersistent('selectedMember')
            else
                Session.setPersistent('selectedMember', userId);
        },
        'touchstart .member': function () {
            var userId = this._id;
            if (Session.get('selectedMember') === userId)
                Session.setPersistent('selectedMember')
            else
                Session.setPersistent('selectedMember', userId);
        },
        'click .remove': function () {
            var selectedMember = Session.get('selectedMember');
            Meteor.call('removeUser', selectedMember);
        },
        'click .manualCheck': function () {
            var selectedMember = Session.get('selectedMember');
            Meteor.call('manualCheckIn', selectedMember, Session.get('curGroup'));
        },
        'click .exportData': function () {
            var data = MembersList.find({ groupId: Session.get('curGroup'), tableSelected: true }, { 'fields': { _id: 0, name: 1, email: 1, checkedIn: 1, checkInLog: 1} }).fetch();
            var csv = Papa.unparse(data);
            var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
            var groupId = Session.get('curGroup');
            var groupName = GroupsList.findOne({ _id: groupId }).name;
            var date = new Date();
            var formattedDate = `${date.getFullYear()}${(date.getMonth() + 1)}${date.getDate()}`;
            if (Session.get('event') === undefined) {
                saveAs(blob, `${formattedDate}${groupName}.csv`);
            }
            else {
                saveAs(blob, `${formattedDate}${Session.get('event')}.csv`);
            }
        },
        'submit .memberForm': function (event) {
            event.preventDefault();
            var memberName = event.target.memberName.value;
            var memberYear = Number(event.target.memberYear.value);
            var memberEmail = event.target.memberEmail.value;
            Meteor.call('createMember', memberName, memberYear, memberEmail, Session.get('curGroup'));
            event.target.memberName.value = "";
            event.target.memberYear.value = "";
            event.target.memberEmail.value = "";
            document.getElementById("memberName").focus();
        },
        'click .takeRoll': function () {
            Session.set('event', undefined);
            var eventName = prompt('What are you taking roll for?');
            Session.set('event', eventName);
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(success, error);
                function success(location) {
                    Session.setPersistent('rollInProgress', true);
                    var lat = (location.coords.latitude);
                    var long = (location.coords.longitude);
                    var acc = (location.coords.accuracy);
                    var currentUserId = Meteor.userId();
                    var groupId = Session.get('curGroup');
                    var groupName = GroupsList.findOne({ _id: groupId }).name;
                    Meteor.call('takeRoll', lat, long, acc, currentUserId, groupId, groupName, eventName);
                }
                function error() {
                    alert('Location services must be enabled to take roll.')
                }
            }
        },
        'click .tablinks': function (event) {
            Session.setPersistent('selectedMember');
            var sessionYears = ['freshTable', 'sophTable', 'junTable', 'senTable'];
            var yearSelected = event.target.id;
            document.getElementById(event.target.id).style.display = "block";
            console.log(event.target.className);
            var currentUserId = Meteor.userId();
            var groupId = Session.get('curGroup');
            if (event.target.className === "tablinks active") {
                event.target.className = "tablinks";
                Session.set(`${yearSelected}`, false);
                if (Session.get('freshTable') === false && Session.get('sophTable') === false
                    && Session.get('junTable') === false && Session.get('senTable') === false
                    && Session.get('allTable') === false) {
                    Session.set('allTable', true);
                    Meteor.call('addTable', 'allTable', currentUserId, groupId);
                }
            } else {
                event.target.className += " active";
                Session.set(`${yearSelected}`, true);
                if (yearSelected !== "allTable") {
                    Session.set('allTable', false);
                }
            }
            for (var i = 0; i < 4; i++) {
                if (Session.get('allTable')) {
                    Meteor.call('addTable', `${sessionYears[i]}`, currentUserId, groupId);
                } else {
                    if (Session.get(sessionYears[i])) {
                        Meteor.call('addTable', `${sessionYears[i]}`, currentUserId, groupId);
                    } else {
                        Meteor.call('removeTable', `${sessionYears[i]}`, currentUserId, groupId);
                    }
                }
            }
        },
        'click .stopRoll': function () {
            Session.setPersistent('rollInProgress', false);
            Meteor.call('stopRoll', Session.get('curGroup'));
        },
        'click .resetCheck': function () {
            var currentUserId = Meteor.userId();
            var groupId = Session.get('curGroup');
            var sessionYears = ['freshTable', 'sophTable', 'junTable', 'senTable'];
            for (var i = 0; i < 4; i++) {
                document.getElementById(sessionYears[i]).className = "tablinks";
                Session.set(`${sessionYears[i]}`, false);
            }
            Session.set('allTable', true);
            Meteor.call('addTable', 'allTable', currentUserId, groupId);
            Meteor.call('resetCheckVal', currentUserId, Session.get('curGroup'));
        }
    });
    Template.addMemberForm.onRendered(function () {
        $('.memberForm').validate();
    });
    Template.checkInMember.helpers({
        'successfulCheck': function () {
            return Session.get('successfulCheck');
        },
        'failedCheck1': function () {
            return Session.get('failedCheck1');
        },
        'failedCheck2': function () {
            return Session.get('failedCheck2');
        },
        'failedCheck3': function () {
            return Session.get('failedCheck3');
        }
    });
    Template.checkInMember.events({
        'click .checkIn': function () {
            var fullUrl = window.location.pathname;
            var splitArray = fullUrl.split('/');
            var memberCode = splitArray[2]
            var groupCode = splitArray[3];
            var groupName = splitArray[4];
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(success, error);
                async function success(location) {
                    var lat = (location.coords.latitude);
                    var long = (location.coords.longitude);
                    var acc = (location.coords.accuracy);
                    var valid = await new Promise((resolve, reject) =>
                        Meteor.call('checkIn', lat, long, acc, memberCode, groupCode, groupName, (error, result) => {
                            if (error) return reject(error);
                            resolve(result);
                        })
                    );
                    console.log(valid);
                    if (valid === 0) {
                        Session.set('successfulCheck', true); Session.set('failedCheck2', false);
                        Session.set('failedCheck1', false); Session.set('failedCheck3', false);
                        alert('You have successfully checked in.');
                    }
                    if (valid === 2) {
                        Session.set('failedCheck2', true); Session.set('successfulCheck', false);
                        Session.set('failedCheck1', false); Session.set('failedCheck3', false);
                        alert('You are not within range of check-in.');
                    }
                    if (valid === 3) {
                        Session.set('failedCheck3', true); Session.set('failedCheck2', false);
                        Session.set('successfulCheck', false); Session.set('failedCheck1', false);
                        alert('The group is not accepting check-ins at this time.');
                    }
                }
                function error() {
                    alert('Location services must be enabled to take roll.')
                }
            }
        }
    });
    Template.register.events({
        'submit form': async function (event) {
            event.preventDefault();
            var emailVar = event.target.registerEmail.value;
            var passwordVar = event.target.registerPassword.value;
            var repeat = await new Promise((resolve, reject) =>
                Meteor.call('checkEmail', emailVar, (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                })
            );
            if (repeat) {
                Session.set('repeatRegister', true);
            } else {
                Accounts.createUser({
                    email: emailVar,
                    password: passwordVar
                });
                Meteor.loginWithPassword(emailVar, passwordVar, (err) => {
                    if (!err) {
                        Session.clear();
                        Router.go('/home');
                    }
                });
            }
        },
        'click .showLogin': function (event) {
            event.preventDefault();
            Session.setPersistent('showRegister', false);
        }
    });
    Template.register.helpers({
        'takingNewUsers': function () {
            console.log(Meteor.users.find().count());
            return (Meteor.call('takingNewUsers'));
        },
        'repeatRegister': function () {
            return Session.get('repeatRegister');
        }
    });
    Template.login.events({
        'submit form': function (event) {
            event.preventDefault();
            var emailVar = event.target.loginEmail.value;
            var passwordVar = event.target.loginPassword.value;
            Meteor.loginWithPassword(emailVar, passwordVar, (err) => {
                if (err) {
                    event.target.loginEmail.value = "";
                    event.target.loginPassword.value = "";
                    Session.setPersistent('invalidLogin', true);
                } else {
                    Session.clear();
                    Session.setPersistent('invalidLogin', false);
                    Router.go('/home');
                }
            });
        },
        'click .showRegister': function (event) {
            event.preventDefault();
            Session.setPersistent('showRegister', true);
        }
    });
    Template.dashboard.events({
        'click .logout': function (event) {
            event.preventDefault();
            var currentUserId = Meteor.userId();
            Meteor.logout(() => {
                Session.setPersistent('rollInProgress', false);
                Session.clearPersistent();
                Meteor.call('stopRoll', Session.get('curGroup'));
                Meteor.call('resetCheckVal', currentUserId, Session.get('curGroup'));
                Session.clear();
                Router.go('/')
            });
        },
        'click .changeGroup': function (event) {
            event.preventDefault();
            Session.clear();
        }
    });
    Template.dashboard.helpers({
        'chosenGroup': function () {
            return Session.get('chosenGroup');
        }
    })
}

if (Meteor.isServer) {
    process.env.HTTP_FORWARDED_COUNT = 1;
    Meteor.onConnection(function () {
        console.log(this.connection);
    });
    Meteor.publish('theMembers', function () {
        var currentUserId = this.userId;
        return MembersList.find({ createdBy: currentUserId });
    });
    Meteor.publish('theGroups', function () {
        var currentUserId = this.userId;
        return GroupsList.find({ createdBy: currentUserId });
    })
    const TempCollection = new Mongo.Collection('temp');
    Meteor.methods({
        'createGroup': function (groupName, currentUserId) {
            GroupsList.insert({
                name: groupName,
                createdBy: currentUserId
            });
        },
        'createMember': function (memberName, year, memberEmail, groupName) {
            console.log(groupName);
            check(memberName, String);
            check(year, Number);
            check(memberEmail, String);
            var wordYear = "";
            switch (year) {
                case 1: wordYear = 'Freshman';
                    break;
                case 2: wordYear = 'Sophomore';
                    break;
                case 3: wordYear = 'Junior';
                    break;
                case 4: wordYear = 'Senior';
            }
            var currentUserId = Meteor.userId();
            if (currentUserId) {
                MembersList.insert({
                    groupId: groupName,
                    name: memberName,
                    year: year,
                    wordY: wordYear,
                    email: memberEmail,
                    tableSelected: 'true',
                    checkedIn: 'No',
                    memberId: '',
                    checkInLog: '',
                    createdBy: currentUserId
                });
            }
        },
        'removeGroup': function (selectedGroup) {
            check(selectedGroup, String);
            var currentUserId = Meteor.userId();
            if (currentUserId) {
                GroupsList.remove({ _id: selectedGroup, createdBy: currentUserId });
            }
        },
        'removeUser': function (selectedMember) {
            check(selectedMember, String);
            var currentUserId = Meteor.userId();
            if (currentUserId) {
                MembersList.remove({ _id: selectedMember, createdBy: currentUserId });
            }
        },
        'manualCheckIn': function (selectedMember, groupId) {
            check(selectedMember, String);
            var currentUserId = Meteor.userId();
            if (currentUserId) {
                MembersList.update({ _id: selectedMember, createdBy: currentUserId, groupId: groupId }, { $set: { checkedIn: 'Yes' } });
            }
        },
        'resetCheckVal': function (currentUserId, groupId) {
            MembersList.update({ createdBy: currentUserId, groupId: groupId }, { $set: { checkedIn: 'No', checkInLog: '', tableSelected: true } }, { multi: true });
        },
        'validateURL': function (id, gid, gn) {
            console.log(id + gid + gn);
            if (MembersList.findOne({ memberId: id }) != undefined) {
                if (MembersList.findOne({ createdBy: gid }) != undefined) {
                    if (MembersList.findOne({ groupId: gn }) != undefined) {
                        console.log('success');
                        return true;
                    }
                }
            } else {
                return false;
            }
        },
        'checkEmail': function (emailVar) {
            return Accounts.findUserByEmail(emailVar) != undefined;
        },
        'takingNewUsers': function () {
            return Meteor.users.find().count() > 0;
        },
        'addTable': function (tableName, userId, groupId) {
            var year = 0;
            switch (tableName) {
                case 'freshTable':
                    year = 1;
                    break;
                case 'sophTable':
                    year = 2;
                    break;
                case 'junTable':
                    year = 3;
                    break;
                case 'senTable':
                    year = 4;
                    break;
            }
            console.log(year);
            if (year === 0) {
                MembersList.update({ createdBy: userId, groupId: groupId }, { $set: { tableSelected: true } }, { multi: true });
            } else {
                MembersList.update({ createdBy: userId, groupId: groupId, year: year }, { $set: { tableSelected: true } }, { multi: true });
            }
        },
        'removeTable': function (tableName, userId, groupId) {
            var year;
            switch (tableName) {
                case 'freshTable':
                    year = 1;
                    break;
                case 'sophTable':
                    year = 2;
                    break;
                case 'junTable':
                    year = 3;
                    break;
                case 'senTable':
                    year = 4;
                    break;
            }
            MembersList.update({ createdBy: userId, groupId: groupId, year: year }, { $set: { tableSelected: false } }, { multi: true });
        },
        'checkIn': function (lat, long, acc, memberCode, groupCode, groupName) {
            var coords = TempCollection.findOne({ createdBy: groupCode, groupId: groupName });
            var lat1 = coords.lat;
            var long1 = coords.long;
            var lat2 = lat;
            var long2 = long;
            console.log(lat1 + " " + lat2 + " " + long1 + " " + long2);
            function getDistance(lat, lon, lat2, long2) {
                var R = 6371;
                var dLat = (lat2 - lat) * Math.PI / 180;
                var dLon = (long2 - lon) * Math.PI / 180;
                var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat * Math.PI / 180) *
                    Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
                var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                var d = R * c;
                return d;
            }
            var distanceKM = getDistance(lat1, long1, lat2, long2);
            console.log(distanceKM)
            var distanceM = distanceKM * 1000;
            console.log(distanceM);
            var takingRoll = coords.takingRoll;
            if (takingRoll) {
                if (distanceM < 100) {
                    var checkInTime = new Date();
                    MembersList.update({ memberId: memberCode }, { $set: { checkedIn: 'Yes', checkInLog: checkInTime } });
                    return 0;
                } else {
                    MembersList.update({ memberId: memberCode }, { $set: { checkedIn: 'Attempted - out of range' } });
                    return 2;
                }
            } else {
                MembersList.update({ memberId: memberCode }, { $set: { checkedIn: 'Attempted - after roll stopped' } });
                return 3;
            }
        },
        'stopRoll': function (group) {
            var currentUserId = Meteor.userId();
            groupId = group;
            TempCollection.update({ createdBy: currentUserId, groupId: groupId }, { $set: { takingRoll: false } });
        },
        'takeRoll': function (lat, long, acc, currentUserId, groupId, groupName, eventName) {
            TempCollection.remove({ createdBy: currentUserId });
            TempCollection.insert({
                lat: lat,
                long: long,
                acc: acc,
                createdBy: currentUserId,
                groupId: groupId,
                takingRoll: true
            });
            var API_KEY = "4f8044649650c625253c6a76e60e9e11-73ae490d-336f36fa";
            var DOMAIN = "mg.takeroll.net";
            var mailgun = require("mailgun-js")({ apiKey: API_KEY, domain: DOMAIN });
            MembersList.find({ createdBy: currentUserId, groupId: groupId, tableSelected: true }).forEach(function (myDoc) {
                var crypto = require('crypto');
                var memberId = crypto.randomBytes(10).toString('hex');
                MembersList.update({ _id: myDoc._id }, { $set: { memberId: memberId } });
                var groupI = myDoc.groupId;
                var memberE = myDoc.email;
                var currentUserId = myDoc.createdBy;
                var data = {
                    from: groupName + " <noreply@easycheckin.net>",
                    to: memberE,
                    subject: "Check-in to " + eventName,
                    text: "To check in you must: \n 1. Have location services enabled for Safari (or whatever browser you are using) \n 2. Use a non-private browsing session \n" + 
                    "Check-in Link: \n https://easycheckin.net/checkin/" + memberId + "/" + currentUserId + "/" + groupI
                };
                console.log(data.text);
                console.log(data.to);
                mailgun.messages().send(data, function (error, body) {
                    console.log(body);
                });
                MembersList.update({ _id: myDoc._id}, {$set: {checkedIn: 'Email sent'}});
            });
        }
    });
}