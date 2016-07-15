
"use strict";

var angular = require ('angular');

var settings = require ('settings');
require ('debug').enable (settings.debug);
var debug = require ('debug')('wyliodrin:lacy:FileExplorerController');

var fs = require ('fs');
var path = require ('path');

var mixpanel = require ('mixpanel');

debug ('Loading');

module.exports = function ()
{

	var app = angular.module ('wyliodrinApp');

	app.controller('FileExplorerController', function($scope, $timeout, $mdDialog, $wydevice){
		debug ('Registering');
		$scope.files = [];
		$scope.cwd = "";
		$scope.treeData = [];
		/*mixpanel.track ('Task Manager', {
			category: $wydevice.device.category
		});*/
		var that = this;


		var message = function (t, p)
		{
			//change dir
			if (t === 'fe1')
			{
				$timeout (function ()
				{
					if (p[0] == "ERROR")
					{
						console.log("NU E BINE UNDE AI INTRAT");
						//poate un mesaj de eroare
						//ne ducem inapoi
						$scope.cwd = $scope.cwd.slice(0,$scope.cwd.lastIndexOf("/"));
						if ($scope.cwd === "")
							//inseamna ca am ajuns la root
						{
							$scope.cwd = "/"; 
						}
					}
					else
					{
						$scope.files = p;
					}	
				});
			}
			//get home
			if (t === 'fe2')
			{
				$timeout (function ()
				{
					$scope.cwd = p;
					//am primit homeul, continui
					$wydevice.send ('fe', {a:'ls',b:$scope.cwd});
					////mai e de facut
				});
			}
			//download
			if (t === 'fe3')
			{
				$timeout (function ()
				{
					//p.n = 
					//p.f = 
					//am primit homeul, continui
					chrome.fileSystem.chooseEntry(
					{
						type: 'saveFile',
						suggestedName: p.n,
					}, 
					function(fileEntry) 
					{
						fs.writeFile(fileEntry, p.f, function(err) {
						    if(err) {
						        return console.log(err);
						    }

						    console.log("The file was saved!");
						}); 
					});
				});
			}
			if (t === 'fe4')
			{
				$timeout (function ()
				{
					if (p[0] == "ERROR"){
						console.log("GRESIT GRESIT GRESIT");
					}


					function search_tree (loc)
					{
						var list_loc=[];
						//unshift is oposite of push
						while (loc != "/")
						{
							list_loc.unshift(path.basename(loc));
							loc = path.dirname(loc);
						}
						return search_tree_aux(list_loc,$scope.treeData);
					}

					function search_tree_aux (list_loc,tree)
					{

						var current = list_loc.shift();
						var result = tree.find(function (child)
						{
							return (child.name == current && child.d == 1);
						});

						if (list_loc.length === 0){
							return result;
						}
						else{
							return search_tree_aux(list_loc,result.children);
						}

					}

					function check_children (lista)
					{
						var final=[];
						lista.forEach (function (child)
						{
							child.visited = 0;
							child.name = path.basename(child.p);
							if (child.d === false)
							{
								child.children=[];
							}
							else
							{
								child.children=[{'visited':0,'name':'Loading . . .','children':[] }]; //fara d si p
							}
							final.push(child);
						});
						return final;
					}



					p.a = check_children(p.a);

					if (p.p == "/")
					{
						$scope.treeData=p.a; //put it directly
					}
					else
					{
						var place = search_tree(p.p);
						place.children = p.a;
					}
				});
			}
		};

		
		this.getChildren = function(node, expanded)
		{
			if (node.visited === 0)
			{
				$wydevice.send ('fe', {a:'tree',b:node.p});
				node.visited=1;
			}
		};


////////////////////////////////////////////////
		$scope.treeOptions = {
    nodeChildren: "children",
    dirSelectable: true,
    injectClasses: {
        ul: "a1",
        li: "a2",
        liSelected: "a7",
        iExpanded: "a3",
        iCollapsed: "a4",
        iLeaf: "a5",
        label: "a6",
        labelSelected: "a8"
    }
};
/*$scope.treeData =
[
    { "name" : "Joe", "age" : "21", "children" : [
        { "name" : "Smith", "age" : "42", "children" : [] },
        { "name" : "Gary", "age" : "21", "children" : [
            { "name" : "Jenifer", "age" : "23", "children" : [
                { "name" : "Dani", "age" : "32", "children" : [] },
                { "name" : "Max", "age" : "34", "children" : [] }
            ]}
        ]}
    ]},
    { "name" : "Albert", "age" : "33", "children" : [] },
    { "name" : "Ron", "age" : "29", "children" : [] }
];*/
///////////////////////////////////////////////////

		$wydevice.on ('message', message);

		$wydevice.send ('fe', {a:'phd'});
		$wydevice.send ('fe', {a:'tree',b:'/'});

		function human_readable(number)
		{
			if (number>1000000000)
			{
				return (Math.round(number/10000000)/100).toString() + " GB";
			}
			else
			{
				if (number>1000000)
				{
					return (Math.round(number/10000)/100).toString() + " MB";
				}
				else
				{
					if (number>1000)
					{
						return (Math.round(number/10)/100).toString() + " KB";
					}
					else
					{
						return (Math.round(number*100)/100).toString() + " B";
					}
				}
			}
		}


		$scope.$watchCollection("files", function(){
			for (var i=0; i<$scope.files.length; i++)
			{
				$scope.files[i].size = human_readable($scope.files[i].size);
			}
		});



		this.cd = function(folder)
		{
			debug ('Changing to folder');
			if ($scope.cwd != "/")
			{
				$scope.cwd=$scope.cwd+"/"+folder;
			}
			else
			{
				$scope.cwd=$scope.cwd+folder;
			}
			$wydevice.send ('fe', {a:'ls',b:$scope.cwd});
		};

		this.up = function ()
		{
			if ($scope.dataForTheTree[0].children[0].children.length ===0){
			$scope.dataForTheTree[0].children[0].children = 
			[{ "name" : "Vasile", "age" : "99", "children" : [] }];}
			else{
				$scope.dataForTheTree[0].children[0].children = [];
			}
			/*if ($scope.cwd != "/"){

				debug ('Going up');
				//get rid of last folder entered
				$scope.cwd = $scope.cwd.slice(0,$scope.cwd.lastIndexOf("/"));
				if ($scope.cwd === "")
					//inseamna ca am ajuns la root
				{
					$scope.cwd = "/"; 
				}
				$wydevice.send ('fe', {a:'ls',b:$scope.cwd});
			}*/
		};

		this.download = function(file)
		{
			$wydevice.send ('fe', {a:'down',b:$scope.cwd,c:file});
		};

		this.doubleclick = function(file)
		{
			if (file.isdir)
			{
				this.cd(file.name);
			}
			if (file.isfile || file.islink)
			{
				this.download(file.name);
			}
		};

		this.exit = function ()
		{
			debug ('Exiting');
			$mdDialog.hide ();
			$wydevice.removeListener ('message', message);
		};
	});
};