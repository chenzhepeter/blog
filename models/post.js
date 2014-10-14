var markdown = require('markdown').markdown;
var mongoose = require('./database');

var postSchema = new mongoose.Schema({
  name: String,
  head: String,
  title: String,
  tags: [],
  comments: [],
  post: String,
  pv: Number,
  time: {}
}, {
  collection: 'posts'
});

var postModel = mongoose.model('Post', postSchema);

function Post(name, head, title, tags, post) {
  this.name = name;
  this.head = head;
  this.title = title;
  this.tags = tags;
  this.post = post;
}

//存储一篇文章及其相关信息
Post.prototype.save = function (callback) {
  var date = new Date();
  //存储各种时间格式，方便以后扩展
  var time = {
    date: date,
    year: date.getFullYear(),
    month: date.getFullYear() + "-" + (date.getMonth() + 1),
    day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
    minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
      date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
  };
  //要存入数据库的文档
  var post = {
    name: this.name,
    head: this.head,
    time: time,
    title: this.title,
    tags: this.tags,
    post: this.post,
    comments: [],
    pv: 0
  };
  var newPost = new postModel(post);

  newPost.save(function (err, post) {
    if (err) {
      return callback(err);
    }
    callback(null, post);
  });
};

//一次获取十篇文章
Post.getTen = function (page, callback) {
  postModel.find({}).sort({
    time: -1
  }).exec(function (err, docs) {
    if (err) {
      return callback(err);
    }
    var total = docs.length;
    docs = docs.slice((page - 1) * 10, page * 10);
    //解析 markdown 为 html
    docs.forEach(function (doc) {
      doc.post = markdown.toHTML(doc.post);
    });
    callback(null, docs, total);
  });
};

//获取一篇文章
Post.getOne = function (name, day, title, callback) {
  postModel.findOne({
    "name": name,
    "time.day": day,
    "title": title
  }, function (err, doc) {
    if (err) {
      return callback(err);
    }

    doc.pv = doc.pv + 1;
    doc.save(function (err) {
      if (err) {
        return callback(err);
      }
      //解析 markdown 为 html
      doc.post = markdown.toHTML(doc.post);
      doc.comments.forEach(function (comment) {
        comment.content = markdown.toHTML(comment.content);
      });
      callback(null, doc); //返回查询的一篇文章
    });
  });
};

//返回原始发表的内容（markdown 格式）
Post.edit = function (name, day, title, callback) {
  postModel.findOne({
    "name": name,
    "time.day": day,
    "title": title
  }, function (err, post) {
    if (err) {
      return callback(err);
    }
    callback(null, post); //（markdown 格式）
  });
};

//更新一篇文章及其相关信息
Post.update = function (name, day, title, post, callback) {
  postModel.findOne({
    "name": name,
    "time.day": day,
    "title": title
  }, function (err, doc) {
    if (err) {
      return callback(err);
    }
    doc.post = post;
    doc.save(function (err) {
      if (err) {
        return callback(err);
      }
      callback(null);
    });
  });
};

Post.updateComment = function (name, day, title, comment, callback) {
  postModel.findOne({
    "name": name,
    "time.day": day,
    "title": title
  }, function (err, doc) {
    if (err) {
      return callback(err);
    }
    doc.comments.push(comment);
    doc.save(function (err) {
      if (err) {
        return callback(err);
      }
      callback(null);
    });
  });
};

//删除一篇文章
Post.remove = function (name, day, title, callback) {
  postModel.findOne({
    "name": name,
    "time.day": day,
    "title": title
  }, function (err, doc) {
    if (err) {
      return callback(err);
    }
    doc.remove(function (err) {
      if (err) {
        return callback(err);
      }
      callback(null);
    });
  });
};

//返回所有文章存档信息
Post.getArchive = function (callback) {
  postModel.find({}).sort({
    time: -1
  }).exec(function (err, docs) {
    if (err) {
      return callback(err);
    }
    callback(null, docs);
  });
};

//返回所有标签
Post.getTags = function (callback) {
  postModel.distinct("tags").exec(function (err, docs) {
    if (err) {
      return callback(err);
    }
    callback(null, docs);
  });
};

//返回含有特定标签的所有文章
Post.getTag = function (tag, callback) {
  postModel.find({
    "tags": tag
  }).sort({
    time: -1
  }).exec(function (err, docs) {
    if (err) {
      return callback(err);
    }
    callback(null, docs);
  });
};

//返回通过标题关键字查询的所有文章信息
Post.search = function (keyword, callback) {
  var pattern = new RegExp("^.*" + keyword + ".*$", "i");
  postModel.find({
    "title": pattern
  }).sort({
    time: -1
  }).exec(function (err, docs) {
    if (err) {
      return callback(err);
    }
    callback(null, docs);
  });
};

module.exports = Post;
