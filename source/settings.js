"use strict";

const bookmarksStr = 'bookmarks'
const bookmarkListId = "bookmark-list"

const channelsListId = "channel-list"

async function getData() {
  const bookmarkItem = await getItem(bookmarksStr)
  if (bookmarkItem) {
    const bookmarkObj = JSON.parse(bookmarkItem)
    const bookEle = document.getElementById(bookmarkListId)
    for (let i = 0; i < bookmarkObj?.length; i++) {
      let div = document.createElement('div');
      div.setAttribute('class', 'video-container');

      let link = document.createElement('a')
      link.href = bookmarkObj[i]['url']
      link.innerText = bookmarkObj[i]['title']
      link.setAttribute('class', 'video-title')

      let delButton = document.createElement('button')
      delButton.innerHTML = 'Delete'
      delButton.setAttribute('class', 'delete-btn')
      delButton.onclick = async function () {
        const obj = removeElementFromArray(i, bookmarkObj)
        await setItem(bookmarksStr, JSON.stringify(obj))
        location.reload()
      }
      div.append(link)
      div.append(delButton)

      bookEle.append(div)
    }
  }

  const channelsItem = await getItem(channelsStr)
  if (channelsItem) {
    const channelObj = JSON.parse(channelsItem)
    const channelEle = document.getElementById(channelsListId)
    for (let i = 0; i < channelObj?.length; i++) {
      let div = document.createElement('div');
      div.setAttribute('class', 'video-container');

      let link = document.createElement('a')
      link.href = channelObj[i]['channelURL']
      link.innerText = channelObj[i]['channelTitle']

      link.setAttribute('class', 'video-title')

      let delButton = document.createElement('button')
      delButton.innerHTML = 'Delete'
      delButton.setAttribute('class', 'delete-btn')
      delButton.onclick = async function () {
        const obj = removeElementFromArray(i, channelObj)
        await setItem(channelsStr, JSON.stringify(obj))
        location.reload()
      }
      div.append(link)
      div.append(delButton)
      channelEle.append(div)
    }
  }

}

async function exportData() {
  try {
    let data = {}
    let channels = await getItem(channelsStr);
    if(channels) {
      data[channelsStr] = JSON.parse(channels);
    }
    let bookmarks = await getItem(bookmarksStr);
    if(bookmarks) {
      data[bookmarksStr] = JSON.parse(bookmarks);
    }
    if (data) {
      const fileLink = createFile(JSON.stringify(data))
      const ele = document.createElement('a')
      ele.href = fileLink
      ele.download = 'export.json'
      ele.click()
      alert('exported successfully')
    } else {
      alert('data not available to export')
    }
  } catch (err) {
    console.log(err)
    alert('error while exporting data')
  }
  return null
}

function createFile(text) {
  const data = new Blob([text], { type: 'application/json' });
  return window.URL.createObjectURL(data);
}

function loadFile() {
  const input = document.getElementById('file-input');
  input.type = 'file'
  input.onchange = function (event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');

    reader.onload = function (event) {
      const content = event.target.result;
      importData(content)
    }
  }
}

async function importData(data) {
  const obj = JSON.parse(data)
  let imBookmarksArray = obj[bookmarksStr]

  let imChannelsArray = obj[channelsStr]
  let oldBookmarksStr = await getItem(bookmarksStr);
  let bookmarksArray = []
  if (oldBookmarksStr) {
    bookmarksArray = JSON.parse(oldBookmarksStr);
  }
  bookmarksArray = bookmarksArray.concat(imBookmarksArray);

  let oldChannelsStr = await getItem(channelsStr);
  let channelsArray = []
  if (oldChannelsStr) {
    channelsArray = JSON.parse(oldChannelsStr)
  }
  channelsArray = channelsArray.concat(imChannelsArray)

  bookmarksArray = dedupBookmarksArray(bookmarksArray);
  channelsArray = dedupChannelsArray(channelsArray);

  await clearBrowserStorage();

  await setItem(bookmarksStr, JSON.stringify(bookmarksArray))
  await setItem(channelsStr, JSON.stringify(channelsArray))
  location.reload()
}

function startApplication() {
  getData()
  const ele = document.getElementById('export-btn')
  ele.onclick = exportData
  loadFile()
}

startApplication()

