var https = require('https');
var url = require('url');

var PDFDocument = require('pdfkit');
https.Agent.maxSockets = 1000;

var categoriesList = new String(); //hold the
var categoryCount = 0;
var totalCategories = 0;
var questionArray = new Array();
var currentCat = new String();

var doc = new PDFDocument;
var targetHost = 'www.ninjafaq.com';
var targetPort = 443;
var targetHeaders =  {
    'Authorization': 'Basic YWRtaW46SGFwcFkxMjNDbG91ZGluRzEyMw==',
    'Host': 'www.ninja.com'
};

var options = {
  host: targetHost,
  port: targetPort,
  path: '/faq/_design/FAQcouch/_view/categories?reduce=false',
  method: 'GET',
  headers: targetHeaders
};

var req = https.request(options, function(res) {
	res.on('end',function(x) {
		parseCategories(categoriesList);
	});
});

req.on('response',function(response) {
	response.on('data',function(chunk) {
		if (!!chunk) {
			categoriesList = categoriesList + chunk.toString('ascii');
		};
	});
});

req.on('error', function(e) {
	console.log('ERROR ' + e);
});

req.on('end', function(e) {
	
});

req.end();

var parseCategories = function(data) {
	var dataAsString = JSON.parse(data);
	totalCategories = dataAsString.total_rows;
	console.log('Total Categories ' + totalCategories);
	for (var i in dataAsString.rows) {
		currentCat = dataAsString.rows[i].key;
		grabCategoryDocuments(dataAsString.rows[i].key);
	};
};

var grabCategoryDocuments = function(categoryName) {
	var catReturn = new String();
	
	var catOptions = {
	  host: targetHost,
	  port: targetPort,
	  path: url.format('/faq/_design/' + categoryName.toLowerCase() + '/_view/listmembers'),
	  method: 'GET',
	  headers: targetHeaders
	};
		
	var catReq = https.request(catOptions, function(res) {
		res.on('end',function(x) {
			//create the question object, add it to the array
			parseQuestion(catReturn,categoryName);
			categoryCount++;
			
			if (categoryCount == totalCategories) {
				//rollup the pdf
				console.log('done');
				for (var i in questionArray) {
					questionArray[i].addToDocument();
				};
				doc.write('crapper.pdf');
			};
		});
	});
	
	catReq.on('response',function(response) {
		response.on('data',function(chunk) {
			if (!!chunk) {
				catReturn = catReturn + chunk.toString('ascii');
			};
		});
	});
	
	catReq.on('error', function(e) {
		console.log('ERROR CAT '+ currentCat + ' ' + e);
		console.log(e);
	});
	
	catReq.on('end', function(e) {
	});
	
	catReq.end();

};

//helper functions

var parseQuestion = function(data,categoryName) {
	var parsedQuestion = JSON.parse(data);
	for (var i in parsedQuestion.rows) {
		if (!!parsedQuestion.rows[i].value.question && !!parsedQuestion.rows[i].value.answer) {
			var question = new Question(categoryName,parsedQuestion.rows[i].value.question,parsedQuestion.rows[i].value.answer);
			questionArray.push(question);
		};
	};
};

//object models

function Question(category,question,answer,pdfDoc) {
	if (!!category && !!question && !!answer) {
		this.category = category;
		this.question = question;
		this.answer = answer;
		this.pdfDoc = pdfDoc;
	};
};

Question.prototype = {
	addToDocument: function(currentCategory) {
		//add question to the document
		doc.fontSize('20').text(this.category);
		doc.fontSize('9').text(this.question,{width: 400,align:'justify'}).moveDown(0.5);
		doc.fontSize('9').text(this.answer,{width: 375, align: 'justify'}).moveDown(0.5);
	}
};