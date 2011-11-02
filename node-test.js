var https = require('https');
var PDFDocument = require('pdfkit');
var completeData = new String();

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
		parseCategories(completeData);
	});
});

req.on('response',function(response) {
	response.on('data',function(chunk) {
		if (!!chunk) {
			completeData = completeData + chunk.toString('ascii');
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
		console.log('ERROR CAT' + e);
	});
	
	catReq.on('end', function(e) {
	});
	
	catReq.end();

};

var parseQuestion = function(data) {
	var parsedQuestion = JSON.parse(data);
	for (var i in parsedQuestion.rows) {
		if (!!parsedQuestion.rows[i].value.question && !!parsedQuestion.rows[i].value.answer) {
			parsedQuestion.rows[i].value.question.replace('/','SL');
			console.log(parsedQuestion.rows[i].value.question);
			doc.text(parsedQuestion.rows[i].value.question);
			//doc.text(parsedQuestion.rows[i].value.answer, {align:'justify', width: 412});
			doc.write('crapper.pdf');
		};
	};
};
