var http =require("http");
var fs = require("fs");

var cheerio =require("cheerio");
var request =require("request");

var i=0;
var url ="http://www.ss.pku.edu.cn/index.php/newscenter/news/3211";
function fetchPage(x) {     //封装了一层函数
    startRequest(x); 
}
function startRequest(x){
	//http模块向服务器发起一次get请求
	http.get(x, function(res){
			var html ="";  //用来储存网页
			var titles =[];
			res.setEncoding('utf-8');
			//监听data事件,每一次去一次数据
			res.on('data',function(chunk){
				html+=chunk;
			})
		///监听end事件，如果整个网页内容的html都获取完毕，就执行回调函数
		res.on('end',function(){
			var $ =cheerio.load(html);
			var time =$(".time").text();
			
			var news_item ={
					//获取文章的标题
				title:$(".article-title a").text().trim(),
				Time: time,
				//获取当前文章URL
				link:"http://www.ss.pku.edu.cn"+$(".article-title a").attr('href'),
				author:$("[title=供稿]").text().trim(),
				// i用来判断获取多少片文章
				i: i= i+1,
			}
			console.log(news_item);
			 var news_title = $('div.article-title a').text().trim();//获取文章标题

			 saveContent($,news_title);//储存每篇文章的内容与标题

			 savedImg($,news_title);   //储存每篇文章的图片与图片标题

			 var nextLink ="http://www.ss.pku.edu.cn"+$("li.next a").attr('href');   //***
			 var str1 = nextLink.split("-");   //去掉URL后面的中文
			 var str = encodeURI(str1[0]);
			 //控制爬取文章的数量
			 if(i <=10){
			 	fetchPage(str);
			 }

		}).on('error',function(err){
			console.log(err);
		});
	})
}
//该函数的作用：在本地存储所爬取的新闻内容资源
function saveContent($,news_title){
	$('.article-content p').each(function(index,item){
		var x =$(this).text();
		var y =x.substring(0,2).trim();

		if(y==''){
		   x = x + '\n';   
//将新闻文本内容一段一段添加到/data文件夹下，并用新闻的标题来命名文件
        fs.appendFile('./data/' + news_title + '.txt', x, 'utf-8', function (err) {
            if (err) {
               		 console.log(err);
            		}
       		 });
   		 }
	})
}

function savedImg($,news_title){
	$('article-content img').each(function(index,item){
		var img_title =$(this).parent().next().trim(); //获取图片的标题
		if(img_title.length>35||img_title==""){
			img_title ="null"
		}
		var img_filename = img_title + '.jpg';

		var img_src = 'http://www.ss.pku.edu.cn' + $(this).attr('src'); //获取图片的url

		//采用request模块，向服务器发起一次请求，获取图片资源
		request.head(img_src,function(err,res,body){
			if(err){
				console.log(err);
			}
		});
		 request(img_src).pipe(fs.createWriteStream('./image/'+news_title + '---' + img_filename));     //通过流的方式，把图片写到本地/image目录下，并用新闻的标题和图片的标题作为图片的名称。
	})
}
fetchPage(url);