console.log('content_script');

var getSelectedText = function() {
  // Function: finds selected text on document d.
  // @return the selected text or null
  function f(d) {
    var t;
    //Check for a regular selection.
    if (d.getSelection) t = d.getSelection();
    //Check for a range selection.
    else if (d.selection) t = d.selection.createRange();
    if (t.text != undefined) t = t.text;
    //Check text areas for selection.
    if (!t || t == '') {
      var a = d.getElementsByTagName('textarea');
      for (var i = 0; i < a.length; ++i) {
        if (a[i].selectionStart != undefined && a[i].selectionStart != a[i].selectionEnd) {
          t = a[i].value.substring(a[i].selectionStart, a[i].selectionEnd);
          break;
        }
      }
    }
    return t;
  }
  // Function: finds selected text in document d and frames and subframes of d
  // @return the selected text or null
  function g(d) {
    var t = '';
    try {
      t = f(d);
    } catch (e) {
      console.log('ERROR: ', e);
    }
    if ((!t || t == '') && d) {
      var docs = [];
      //Add all frames to the doc list.
      var fs = d.getElementsByTagName('frame');
      for (var i = 0; i < fs.length; ++i) {
        docs.push(fs[i]);
      }
      //Add all the iframes to the doc list.
      fs = d.getElementsByTagName('iframe');
      for (var j = 0; j < fs.length; ++j) {
        docs.push(fs[j]);
      }
      //Iterate through all the docs looking for selected text.
      for (var k = 0; k < docs.length; ++k) {
        t = g(docs[k].contentDocument);
        if (t && t.toString() != '') break;
      }
    }
    return t;
  }
  //Initiate the search using the top document.
  var t = g(document);
  //Return the results.
  if (!t || t == '') return ''; //Nothing found.
  else return t.toString(); //Returns selected text.
};

var getAuthor = function() {

  var stringAuthors = function(a) {
    //console.log('stringAuthors ',a);
    var authors = '';
    for (var i = 0; i < a.length; i++) {
      console.log('author', i, ': ', a[i]);
      authors += $(a[i]).text();
      authors += (i < (a.length - 1) ? '; ' : '');
    }
    console.log('authors: ', authors);
    return authors;
  };

  var parseAuthor = function(author) {
    if (author) {
      console.log('parse',author);
      //Parses out just the author's name. Perhaps including the date of publishing and the authors official title would be good.
      var re6 = '(?:(?!and)\\b[a-z]+\\s|[0-9])'; // First lower case word that isn't 'and' and is followed by a space or number
      var p = new RegExp(re6, ["g"]);
      var m = p.exec(author);

      var re4 = '(?:\\bBy\\b)'; //Non-case senstitive word 'by'
      var q = new RegExp(re4, ["i"]);

      var re7 = '(?:\\s+)';
      var r = new RegExp(re7, ["g"]);

      //console.log(author.search("\\bBy\\b","i"),(m?author.indexOf(m):author.length),author);
      //console.log(author.search(q),(m?author.indexOf(m):author.length),author);
      var loc = author.search(q); //Location of 'by'.
      //console.log(author,loc,author.indexOf(m));
      if ((loc < (m ? author.indexOf(m) : author.length) && loc != -1) || (loc == 0)) {
        console.log('split');
        author = author.slice(loc + 2);
      } //If location of 'by' is the first word or is before the first lowercase word or the end, trim off everything before by.
      //console.log(author,author.indexOf(m));
      //author = author.slice(0,(m?author.indexOf(m):author.length));
      //console.log(author);
      author = (author != '' ? $.trim(author) : '');
      //var r = author.search("\\n");
      //author = author.slice(0,(r!=-1?r:author.length)); //Clear any lines after the first line.
      author = author.replace(r, ' ').replace(/\,{2,}/g, ',');

      return author.toString();
    }
    return '';
  };

  function toArray(nodeList){
    return [].slice.call(nodeList);
  }

  function distanceToH1(element) {
    let parent = element;
    let relatives = [];
    //Get closest H1 relative.
    while(parent != document.body && relatives.length <= 0) {
      parent = parent.parentNode;
      relatives = parent.querySelectorAll('h1');
    }
    //Return the vertical distance to it.
    return {
      distance: Math.abs(element.getBoundingClientRect().top - relatives[0].getBoundingClientRect().top + relatives[0].getBoundingClientRect().height),
      relative: relatives[0],
      parent: parent
    };
  }

  function getRelatedAuthors(element,selector,visibility){
    let parent = element; //should walk up from the selection...instead of the element.
    let relatives = [];
    let siblings = [];

    while(parent != document.body && relatives.length <= 0 && siblings.length <= 1) {
      // console.log('parent:',parent);
      parent = parent.parentNode; //Move up one level.
      relatives = parent.querySelectorAll('h1'); //Is there a related H1?
      siblings = [].slice.call(parent.querySelectorAll(selector))
        .filter(element=>{
          return (visibility ? element.getBoundingClientRect().height > 1 : true) && element.innerText; //Element must be visible and not blank.
        }); //Will always at least contain the element.
    }
    console.log(selector,element,parent,relatives,siblings);
    return {
      parent: parent,
      relatives: relatives,
      siblings: siblings
    };
    //for element(with selector) in Array
      //find related H1
      //find elements (with selector) from common parent with H1
      //for found elements remove from original Array
      //save found elements as group
      //save the distance to for the group to the h1
      //next elements
    //for found groups, sort by distance to h1, or just take first?
  }

  filterDescendants = function(array) {
    return array.filter((element,i) => {
      let leaf = true;
      for (var j = i+1; j < array.length; j++) { //Compare with all following elements.
        leaf =
        array[j].compareDocumentPosition(array[i]) & Node.DOCUMENT_POSITION_CONTAINS
        || array[j] === array[i]
        ? false
        : leaf; //OR use array[i].contains(array[j])
      }
      return leaf;
    });
  }

  function findAuthors(selector, selectionElement) {
    //if selection elements
    //return getRelatedAuthors(selectionElement,selector) try various

    //else
    //For each found element, turn it into an array of it's visible sibling authors, filter out null arrays, return the first
    let authors = [].slice.call(document.querySelectorAll(selector))
      .map(element => getRelatedAuthors(element,selector,(element.getBoundingClientRect().height > 1 ? true : false)).siblings)
      .filter(element => element.length) //filter out empty arrays
      .map(array => filterDescendants(array)); //filter out parents from arrays
    console.log('authors',authors);
    //TODO move to function StringifyAuthors()
    authors = authors[0] //take first non-empty array of authors
    .map(element => element
      .innerText
      .split("\n")[0]
      .split(/\b(?:and)\b/gi) //non-capture group to find 'and' surrounded by breaks and discard them
      .map(element => element.trim())
      .join(', ')
      .replace(/\s{1,}\,/g, ',') //remove whitespace before commas
      .replace(/\,{2,}/g, ',') //remove repreating commas
      .replace(/\s{2,}/g, '') //remove repeating whitespace
      .trim()
      .replace(/,+$/, "")) //map them to text and only take the text before the return character
    .filter(element => element) //filter out blank text
    .join(', ');
    console.log('authors text',authors);
    return authors;
  }

  var authors = [];

  //Get the .author element that are related to the first h1.
  //Bloomberg
  // try {
  //   authors.push([].slice.call(document.getElementsByTagName('h1')[0].parentNode.querySelectorAll('.author')).map(element => element.innerText,'').join(', '));
  // } catch (e) {
  //   console.log('h1.parent .author',e);
  // }
  selectors = [
    'cite', //Fast Company
    '[rel*="author"]',
    '[itemprop*="author"]',
    '.author', //Bloomberg
    '.byline',
    '.author-wrapper',
    '[data-trackable="author"]',
    '.EnArticleName',
    '.top-authors [data-ga-track*="byline"]' //Forbes
  ];

  try {
    authors.push(findAuthors(selectors.join()));
  } catch (e) {
    authors.push("");
    console.log('findAuthors combined',e);
  }
  // try {
  //   authors.push(findAuthors('[rel*="author"]'));
  // } catch (e) {
  //   authors.push("");
  //   console.log('findAuthors [rel*="author"]',e);
  // }
  // //Atlantic, not(NYT)
  // try {
  //   authors.push(findAuthors('[itemprop*="author"]'));
  // } catch (e) {
  //   authors.push("");
  //   console.log('findAuthors [itemprop*="author"]',e);
  // }
  // //NYT, not(Atlantic)
  // try {
  //   authors.push(findAuthors('[itemprop="name"]'));
  // } catch (e) {
  //   authors.push("");
  //   console.log('findAuthors [itemprop="name"]',e);
  // }
  // //NPR
  // try {
  //   authors.push(findAuthors('.byline'));
  // } catch (e) {
  //   authors.push("");
  //   console.log('findAuthors .byline',e);
  // }

  //Huffington, Discover Mag, Wired, WSJ, LA TImes
  //Need to trim everything before " by " regex.
  //:not(aria-hidden="true")
  // try {
  //   authors.push([].slice.call(document.querySelectorAll('[rel*="author"]')).map(element => {
  //     // console.log('siblings:',getRelatedAuthors(element,'[rel*="author"]').siblings);
  //     return element.innerText
  //   },'').filter(element => element).join(', '));
  // } catch (e) {
  //   console.log('[rel="author"]',e);
  // }
  // //NYT, Chicago Tribune, The Atlantic
  // try {
  //   authors.push([].slice.call(document.querySelectorAll('[itemprop*="author"]')).map(element => element.innerText,'').join(', '));
  // } catch (e) {
  //   console.log('[itemprop="author"]',e);
  // }
  // //Businessweek, ACM
  // try {
  //   authors.push([].slice.call(document.querySelectorAll('meta[name*="author"]')).map(element => element.getAttribute("content"),'').join(', '));
  // } catch (e) {
  //   console.log('meta[name*="author"]',e);
  // }
  // //SF Chronicle
  // try {
  //   authors.push(document.querySelector('.author').innerText); //Only first since .author is pretty general.
  // } catch (e) {
  //   console.log('.author',e);
  // }
  // //WSJ, NYT, Tribune, New Yorker, NPR
  // try {
  //   authors.push([].slice.call(document.querySelectorAll('.byline')).map(element => element.innerText,'').join(', '));
  // } catch (e) {
  //   console.log('.byline',e);
  // }
  //Google Books
  try {
    authors.push(document.querySelector('.addmd').innerText);
  } catch (e) {
    authors.push("");
    console.log('.addmd',e);
  }
  //Washington Post
  // try {
  //   authors.push([].slice.call(document.querySelectorAll('.author-wrapper')).map(element => element.innerText,'').join(', '));
  // } catch (e) {
  //   authors.push("");
  //   console.log('.author-wrapper',e);
  // }
  //Financial Times
  // try {
  //   authors.push([].slice.call(document.querySelectorAll('[data-trackable="author"]')).map(element => element.innerText,'').join(', '));
  // } catch (e) {
  //   authors.push("");
  //   console.log('[data-trackable="author"]',e);
  // }
  //Medium
  try {
    authors.push([].slice.call(document.querySelectorAll('.elevateCover .postMetaInline--author, .js-postMetaLockup a:not(.avatar)')).map(element => element.innerText,'').join(', '));
  } catch (e) {
    authors.push("");
    console.log('.elevateCover .postMetaInline--author, .js-postMetaLockup a:not(.avatar)',e);
  }

  //Get smarter about selecting which one.
  //Filter out empty entries in the array created by joining an empty array.
  var author = authors.filter(element => element)[0];
  console.log(author, authors);

  return parseAuthor(author); //Buggy but works 80% of the time.

  //return author.replace(r,' ').trim();
};

// Object to hold information about the current page
var author;
var summary;
var tags;

//Works for Vimeo, YouTube, HTML5 video, video.js, mediaelement.js, sublime
videoTime = function() {
  var videos = document.getElementsByTagName('video');
  var time = null;
  console.log("videos:", videos);
  for (var i = 0; i < videos.length; i++) {
    //console.log("video:",videos[i],videos[i].currentTime);
    //videos[i].addEventListener("timeupdate",updateTags,false);
    if (videos[i].currentTime > 0) {
      time = videos[i].currentTime;
    }
  }
  console.log("video time:", time);
  var totalSec = Math.round(time);
  var hours = parseInt(totalSec / 3600) % 24;
  var minutes = parseInt(totalSec / 60) % 60;
  var seconds = totalSec % 60;
  var result = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);

  return time > 0 ? result : null;
};

try {
  author = getAuthor();
} catch (e) {
  console.log('No author',e);
}

try {
  summary = getSelectedText();
} catch (e) {
  console.log(e);
}

try {
  tags = videoTime();
} catch (e) {
  console.log(e);
}

var pageInfo = {
  "title": document.title,
  "url": 'test',
  "summary": summary,
  "authorName": author,
  "tags": tags,
};

console.log('page info: ', pageInfo);

chrome.extension.connect().postMessage(pageInfo);
