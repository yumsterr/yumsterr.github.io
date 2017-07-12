/**
 * Created by Yumster on 7/10/17.
 */

fetch('https://api.myjson.com/bins/152f9j')
    .then(function (response) {
        return response.json();
    })
    .then(function (responseData) {
        let articles = Object.assign(responseData.data);
        feedBuilder(articles);
    })
    .catch(alert);

const newsParentNode = document.querySelector('.news-feed');

let rebuildFeed = new Event('rebuild');
let deletedItems = [];

let feedBuilder = (articles) => {
    // let reservedArticles = Object.assign({},articles);
    let reservedArticles = articles.slice(0);
    let startInd = 0;
    articles = sortItems(articles);
    getAllTags(articles);
    buildItems(10, startInd, articles);
    checkActiveTags();
    loader('hide');
    newsParentNode.addEventListener('rebuild', function (e) {
        loader('show');
        newsParentNode.innerHTML = "";
        startInd = 0;
        articles = sortItems(articles);
        buildItems(10, startInd, articles);
        checkActiveTags();
        loader('hide');
    });

    window.addEventListener('scroll', function (e) {
        let currentScrollPos = window.scrollY + window.innerHeight + 50;
        let newsHeight = newsParentNode.scrollHeight + newsParentNode.offsetTop;
        if (currentScrollPos > newsHeight) {
            startInd += 10;
            if (startInd <= articles.length) {
                buildItems(10, startInd, articles);
                checkActiveTags();
            }
        }
    });
    let searchInput = document.querySelector('.search input[type=text]');
    searchInput.addEventListener('keyup', function (e) {
        let searchContent = searchInput.value.toLowerCase();
        articles = reservedArticles.filter(function (item) {

            if ((item.title.toLowerCase().indexOf(searchContent) !== -1)&& (deletedItems.indexOf(item.title) === -1)) {
                console.log(item);
                return true;
            } else {
                return false;
            }
        });
        newsParentNode.innerHTML = "";
        if (articles.length > 0) {
            document.querySelector('.nothingFound').classList.remove('active');
            getAllTags(articles);
            startInd = 0;
            articles = sortItems(articles);
            buildItems(10, startInd, articles);
            checkActiveTags();
        } else {
            document.querySelector('.nothingFound').classList.add('active');
        }
    });

};

let buildItems = (count, start, articles) => {
    let cellProto = document.querySelector('.news-item.proto').innerHTML;
    // const newsParentNode = document.querySelector('.news-feed');
    let endInd = start + count;
    for (let i = start; i < endInd; i++) {
        let newChild = document.createElement('div');
        const currentArticle = articles[i];
        if (currentArticle && (deletedItems.indexOf(currentArticle.title) === -1)) {
            newChild.innerHTML = cellProto;
            newChild.classList.add('news-item');
            newsParentNode.appendChild(newChild);

            let imgNode = newChild.querySelector('img');
            let nameNode = newChild.querySelector('.name');
            let dateNode = newChild.querySelector('.date');
            let tagsNode = newChild.querySelector('.tags');
            let descriptionNode = newChild.querySelector('.description');

            if (currentArticle.image.length)
                imgNode.setAttribute('src', currentArticle.image);

            if (currentArticle.title.length)
                nameNode.innerHTML = currentArticle.title;

            if (currentArticle.createdAt.length) {
                let dateFormat = new Date(currentArticle.createdAt);
                dateNode.innerHTML = dateFormat.toLocaleDateString() + ' ' + dateFormat.toLocaleTimeString();
            }

            if (currentArticle.tags.length)
                tagsBuilder(currentArticle.tags, tagsNode);

            if (currentArticle.description.length)
                descriptionNode.innerHTML = currentArticle.description;
        }
    }
};

let getAllTags = (articles) => {
    let tags = articles.map(function (a) {
        return a.tags;
    });
    let merged = [].concat.apply([], tags);
    let unique = Array.from(new Set(merged))
    let tagListBlock = document.getElementById('tagBlock');
    tagListBlock.innerHTML = "";
    tagsBuilder(unique, tagListBlock);
};

let tagsBuilder = (tagList, parent) => {
    if (tagList.length) {
        for (let i = 0; i < tagList.length; i++) {
            let tag = tagList[i];
            let newTag = document.createElement('a');
            newTag.setAttribute('data-tag', tag);
            newTag.setAttribute('href', '#');
            newTag.innerHTML = '#' + tag;
            parent.appendChild(newTag);
            newTag.addEventListener('click', function (e) {
                tagSort(this.getAttribute('data-tag'));
            })
        }
    }
    return true;
};

let tagSort = (tag) => {
    let savedTags = JSON.parse(localStorage.getItem('tags'));
    if (savedTags === null) {
        savedTags = [];
    }
    let tagInd = savedTags.indexOf(tag);
    if (tagInd === -1) {
        savedTags.push(tag);
    } else {
        savedTags.splice(tagInd, 1);
        let allTagNodes = document.querySelectorAll('a[data-tag=' + tag + ']');
        for (let i = 0; i < allTagNodes.length; i++) {
            allTagNodes[i].classList.remove("active");

        }
    }
    localStorage.setItem('tags', JSON.stringify(savedTags));
    checkActiveTags();
    newsParentNode.dispatchEvent(rebuildFeed);
};

let checkActiveTags = () => {
    let savedTags = JSON.parse(localStorage.getItem('tags'));
    if (savedTags !== null) {
        savedTags.forEach(function (item, i, arr) {
            let allTagNodes = document.querySelectorAll('a[data-tag=' + item + ']');
            for (let i = 0; i < allTagNodes.length; i++) {
                if (!allTagNodes[i].classList.contains("active")) {
                    allTagNodes[i].classList.add("active");
                }

            }
        });
    }
};

let sortItems = (articles) => {
    let savedTags = JSON.parse(localStorage.getItem('tags'));
    let sortedArticles = articles.sort(function (a, b) {
        let aDeleted = deletedItems.indexOf(a.title);
        let bDeleted = deletedItems.indexOf(b.title);
        if (savedTags !== null) {
            let equalTagsA = getEqualItemsCount(a.tags, savedTags);
            let equalTagsB = getEqualItemsCount(b.tags, savedTags);
            if (equalTagsA > equalTagsB) {
                return -1;
            }
            if (equalTagsA < equalTagsB) {
                return 1;
            }
        }
        if (aDeleted > bDeleted) {
            return 1;
        }
        if (aDeleted < bDeleted) {
            return -1;
        }
        if (a.createdAt > b.createdAt) {
            return -1;
        }
        if (a.createdAt < b.createdAt) {
            return 1;
        }
        return 0;
    });

    return sortedArticles;
};


let getEqualItemsCount = (array1, array2) => {
    let iterableArray = array1;
    let searchInArray = array2;
    let equalCount = 0;
    if (array2.length < array1.length) {
        iterableArray = array2;
        searchInArray = array1;
    }
    for (let i = 0; i < iterableArray.length; i++) {
        let currentTag = iterableArray[i];
        if (searchInArray.indexOf(currentTag) !== -1) {
            equalCount++;
        }
    }
    return equalCount;
};

let loader = (state) => {
    let loaderNode = document.querySelector('.loader');
    if (state === 'show') {
        loaderNode.classList.add('active');
    } else if (state === 'hide') {
        loaderNode.classList.remove('active');
    }
};
let removeItem = (el) => {

   let item = el.closest('.news-item');
   deletedItems.push(item.querySelector('.name').innerHTML);
   item.remove();
};