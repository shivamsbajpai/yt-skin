const bookmarkBtnId = 'fe-bookmark-btn-id'

const subscribeBtnId = 'fe-subscribe-btn-id'

const activeBtnText = 'Save'
const inactiveBtnText = 'Saved'

const activeSubscribeBtnText = 'Subscribe'
const loadBtnText = 'Loading'
const unavailableText = 'Unavailable'
const inactiveSubscribeBtnText = 'Subscribed'


function getYouTubeVideoId(url) {
  var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  var match = url.match(regExp);
  return (match && match[7].length == 11) ? match[7] : false;
}

function displayButtonInYouTube(button) {
  info_div = document.getElementById('end');
  info_div.appendChild(button);
}

class Button_Factory {
  constructor(id, text, isDisabled, onClick, onClickBindParams) {
    this.id = id;
    this.text = text;
    this.onClick = onClick;
    this.isDisabled = isDisabled;
    this.onClickBindParams = onClickBindParams;
    this.css_class = 'btn'
  }
  getBtn() {
    let element = document.getElementById(this.id)
    if (typeof (element) !== 'undefined' && element !== null) {
      element.innerText = this.text
      element.disabled = this.isDisabled;
      if (this.onClick != null && this.onClickBindParams?.length) {
        element.onclick = this.onClick.bind(this.onClick, ...this.onClickBindParams);
      } else {
        element.onclick = this.onClick
      }
      element.className = this.css_class
      return element;
    }
    let button = document.createElement('button');
    button.setAttribute("id", this.id);
    button.innerText = this.text;
    button.disabled = this.isDisabled;
    if (this.onClick != null && this.onClickBindParams?.length) {
      button.onclick = this.onClick.bind(this.onClick, ...this.onClickBindParams);
    } else {
      button.onclick = this.onClick
    }
    button.className = this.css_class
    return button;
  }

}

async function getChannelInfoFromAPI(video_id) {
  url = `https://yt.lemnoslife.com/noKey/videos?part=snippet&id=${video_id}`
  const response = await fetch(url);
  const respJson = await response.json();
  return new Promise(function (resolve, reject) {
    if (respJson["items"]?.length > 0) {
      resolve({
        "channelId": respJson["items"][0]["snippet"]["channelId"],
        "channelTitle": respJson["items"][0]["snippet"]["channelTitle"],
        "channelURL": `https://youtube.com/channel/${respJson["items"][0]["snippet"]["channelId"]}`
      })
    } else {
      const err = new Error("could not fetch data")
      reject(err)
    }
  })
}

async function bookmarkCurrentUrl(videoId, currentUrl, bookmarks) {
  storeBookmark(videoId, currentUrl, bookmarks);
  ele = document.getElementById(bookmarkBtnId)
  ele.innerText = inactiveBtnText
  ele.disabled = true;
}

async function storeBookmark(video_id, new_bookmark, bookmarks) {
  const baseUrl = 'https://yt.lemnoslife.com/noKey/videos?part=snippet&id=';
  const url = baseUrl + video_id
  const response = await fetch(url)
  const respJson = await response.json()
  const title = respJson['items'][0]['snippet']['title']
  bookmarks.push({
    "videoId": video_id,
    "url": new_bookmark,
    "title": title
  });
  setItem('bookmarks', JSON.stringify(bookmarks));
}

async function subscribeChannel(channelInfo, channels) {
  storeChannel(channelInfo, channels)
  ele = document.getElementById(subscribeBtnId)
  ele.innerText = inactiveSubscribeBtnText
  ele.disabled = true;
}

async function storeChannel(channelInfo, channels) {
  channels.push(channelInfo);
  setItem('channels', JSON.stringify(channels))
  return true;
}

async function getExistingBookmarksObj() {
  let bookmarkStr = await getItem('bookmarks')
  if (bookmarkStr) {
    return JSON.parse(bookmarkStr)
  }
  return [];
}

async function bookmarkExists(new_bookmark) {
  let bookmarks = await getExistingBookmarksObj()
  for (let i = 0; i < bookmarks.length; i++) {
    if (bookmarks[i]["url"] === new_bookmark) {
      return [true, bookmarks];
    }
  }
  return [false, bookmarks];
}

async function channelExists(info) {
  const channels = await getExistingChannelsObj()
  for (let i = 0; i < channels.length; i++) {
    if (channels[i]['channelURL'] === info['channelURL']) {
      return [true, channels];
    }
  }
  return [false, channels];
}

function loadButton(btnId, loadBtnText) {
  const ele = document.getElementById(btnId)
  if (ele === null) {
    const loadBtn = new Button_Factory(btnId, loadBtnText, true, null, null)
    displayButtonInYouTube(loadBtn.getBtn())
  } else {
    ele.innerText = loadBtnText
    ele.disabled = true;
  }
}

async function bookmarkButton(videoId, currentUrl) {
  const bookmarkBtn = document.getElementById(bookmarkBtnId)
  try {
    const [exists, bookmarks] = await bookmarkExists(currentUrl)
    if (exists) {
      bookmarkBtn.innerText = inactiveBtnText
      bookmarkBtn.disabled = true;
    } else {
      bookmarkBtn.innerText = activeBtnText
      bookmarkBtn.onclick = bookmarkCurrentUrl.bind(this, videoId, currentUrl, bookmarks)
      bookmarkBtn.disabled = false
    }
  } catch(err) {
    console.log(err)
    bookmarkBtn.innerText = unavailableText
    bookmarkBtn.disabled = true;
  }

}

async function subscribeButton(videoId) {
  const subscribeBtn = document.getElementById(subscribeBtnId)
  try {
    const channelInfo = await getChannelInfoFromAPI(videoId)
    const [check, channels] = await channelExists(channelInfo)
    if (check) {
      subscribeBtn.innerText = inactiveSubscribeBtnText
      subscribeBtn.disabled = true;
    } else {
      subscribeBtn.innerText = activeSubscribeBtnText
      subscribeBtn.onclick = subscribeChannel.bind(this, channelInfo, channels)
      subscribeBtn.disabled = false
    }
  } catch (err) {
    console.log(err)
    subscribeBtn.innerText = unavailableText
    subscribeBtn.disabled = true;
  }
}

async function startApplication() {
  const currentUrl = window.location.href;
  loadButton(bookmarkBtnId, loadBtnText);
  loadButton(subscribeBtnId, loadBtnText);
  const videoId = getYouTubeVideoId(currentUrl)
  if(!videoId) {
    loadButton(bookmarkBtnId, unavailableText)
    loadButton(subscribeBtnId, unavailableText)
    return
  }
  
  bookmarkButton(videoId, currentUrl)
  subscribeButton(videoId)

}


let previousUrl = '';
let observer = new MutationObserver(function (mutations) {
  if (location.href !== previousUrl) {
    previousUrl = location.href;
    startApplication()
  }
});

const config = { attributes: true, childList: true, subtree: true };
observer.observe(document, config);