var https = require('https');
var PDFDocument = require('pdfkit');

var categoriesList = new String(); //hold the
var categoryCount = 0;
var questionArray = new Array();
var currentCat = new String();

var doc = new PDFDocument;

var options = {
  host: 'www.ninjafaq.com',
  port: 443,
  path: '/faq/_design/FAQcouch/_view/categories?reduce=false',
  method: 'GET',
  headers: {
  	'Authorization': 'Basic YWRtaW46SGFwcFkxMjNDbG91ZGluRzEyMw==',
  	'Host': 'www.ninja.com'
  }
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

req.end();

var parseCategories = function(data) {
	var dataAsString = JSON.parse(data);
	for (var i in dataAsString.rows) {
		ourCat = dataAsString.rows[i].key;
		doc.text(dataAsString.rows[i].key);
		grabCategoryDocuments(dataAsString.rows[i].key);
	};
};

var grabCategoryDocuments = function(categoryName) {
	var catReturn = new String();
	var catOptions = {
	  host: 'www.ninjafaq.com',
	  port: 443,
	  path: '/faq/_design/' + categoryName.toLowerCase()+ '/_view/listmembers?reduce=false',
	  method: 'GET',
	  headers: {
		'Authorization': 'Basic YWRtaW46SGFwcFkxMjNDbG91ZGluRzEyMw==',
		'Host': 'www.ninja.com'
	  }
	};
		
	var catReq = https.request(catOptions, function(res) {
		res.on('end',function(x) {
			parseQuestion(catReturn);
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
		console.log('ERROR CAT '+ ourCat + e);
	});
	
	catReq.on('end', function(e) {
	});
	
	catReq.end();

};

var parseQuestion = function(data) {
	var parsedQuestion = JSON.parse(data);
	for (var i in parsedQuestion.rows) {
		if (!!parsedQuestion.rows[i].value.question && !!parsedQuestion.rows[i].value.answer) {
			doc.text(parsedQuestion.rows[i].value.question);
			doc.text(parsedQuestion.rows[i].value.answer, {align:'justify', width: 412});
			doc.write('crapper.pdf');
		};
	};
};

function Question(category,question,answer,pdfDoc) {
	if (!!category && !!question && !!answer) {
		this.category = category;
		this.question = question;
		this.answer = answer;
		this.pdfDoc = pdfDoc;
	};
};

Question.prototype = {
	addToDocument: function() {
		//add question to the document
		this.pdfDoc.text(this.question);
		this.pdfDoc.text(this.answer);
	};
};