import minimatch from '../../node_modules/minimatch'

const originalServices = {
  '1_all': {
    whiteList:[],
    blackList: [],
    items: [],
    default: true
  },
  'airtable.com': {
    whiteList: [],
    blackList: [
      '/invite/', '/account/', '/workspace/billing/', '/universe/'
    ],
    items: [],
    default: true
  },
  'analytics.amplitude.com' : {
    whiteList: [
      "/workspace/", "/activity/", "/releases/project/", "/dashboard/", "/share/", "/cohorts/"
    ],
    blackList: [],
    items: [],
    default: true
  },
  'asana.com': {
    whiteList: [
      "/inbox/", "/portfolios/", "/list/"
    ],
    blackList: [],
    items: [],
    default: true
  },
  'atlassian.net': {
    icon: 'https://seeklogo.com/images/J/jira-logo-FD39F795A7-seeklogo.com.png',
    whiteList: [
      "/browse/", "/queues/", "/RapidBoard.jspa"
    ],
    blackList: [],
    items: [],
    default: true
  },
  'atlassian.net/wiki': {
    icon: 'https://seeklogo.com/images/C/confluence-logo-D9B07137C2-seeklogo.com.png',
    whiteList: [
      "/blog/", "/pages/"
    ],
    blackList: [
      "/pages/edit-v2/"
    ],
    items: [],
    default: true
  },
  'behance.net': {
    whiteList: [
      "https://www.behance.net/gallery/*/"
    ],
    blackList: [],
    items: [],
    default: true
  },
  'box.com': {
    whiteList: [
      "/s/", "/file/", "/services/box_for_office_online/", "/notes/", "/integrations/googledss/openGoogleEditor/"
    ],
    blackList: [],
    items: [],
    default: true
  },
  'bitbucket.org': {
    whiteList: [
      "/branches",
      "/commits",
      "/src/master",
      "/pull-requests/",
      "/snippets/"
    ],
    blackList: [
      '/account/', '/dashboard/', '/repo/', '/socialauth/', '/pull-requests/new'
    ],
    items: [],
    default: true
  },
  'calendar.google': {
    icon: 'https://image.flaticon.com/icons/svg/281/281770.svg',
    whiteList: [],
    blackList: [],
    items: [],
    default: true
  },
  'drive.google.com': {
    icon: 'https://image.flaticon.com/icons/svg/281/281771.svg',
    whiteList: [],
    blackList: [],
    items: [],
    default: true
  },
  'docs.google.com/spreadsheets': {
    icon: 'https://image.flaticon.com/icons/svg/281/281761.svg',
    whiteList: [],
    blackList: [],
    items: [],
    default: true
  },
  'docs.google.com/document': {
    icon: 'https://image.flaticon.com/icons/svg/281/281760.svg',
    whiteList: [],
    blackList: [],
    items: [],
    default: true
  },
  'docs.google.com/presentation': {
    icon: 'https://image.flaticon.com/icons/svg/281/281762.svg',
    whiteList: [],
    blackList: [],
    items: [],
    default: true
  },
  'dropbox.com': {
    whiteList: [
      "/home/",
      "/home?preview=*",
      "/scl/fi/"
    ],
    blackList: [],
    items: [],
    default: true
  },
  'dribbble.com': {
    whiteList: [
      "/shots/",
    ],
    blackList: [
      '/shots/new/', '/shots/goods/', '/shots/following/'
    ],
    items: [],
    default: true
  },
  'figma.com': {
    whiteList: [
      "/file/",
      "/project/",
      "/proto/"
    ],
    blackList: [],
    items: [],
    default: true
  },
  'notion.so': {
    whiteList: [],
    blackList: [
      "/login", "/onboarding", "/desktop", "/mobile", "/work", "/student", "/educators", "/join-us", "/pricing", "/about", "/hiring", "/why", "/investors", "/googlepopupcallback"
    ],
    items: [],
    default: true
  },
  'linkedin.com': {
    whiteList: [
      "/in/", "/jobs/view/", "/company/"
    ],
    blackList: [],
    items: [],
    default: true
  },
  'github.com': {
    icon: 'https://image.flaticon.com/icons/svg/2111/2111425.svg',
    whiteList: [],
    blackList: [
      '/features/', '/settings/'
    ],
    items: [],
    default: true
  },
  'paper.dropbox.com': {
    whiteList: [
      "/doc/"
    ],
    blackList: [],
    items: [],
    default: true
  },
  'mail.google.com': {
    icon: 'https://image.flaticon.com/icons/svg/281/281769.svg',
    whiteList: [],
    blackList: [
      'settings/', 'search/'
    ],
    items: [],
    default: true
  },
  'stackoverflow.com': {
    icon: 'https://image.flaticon.com/icons/svg/2111/2111628.svg',
    whiteList: [],
    blackList: [],
    items: [],
    default: true
  },
}

const sendMessageToActiveTab = (message) => {
  chrome.tabs.query({active: true, currentWindow:true}, (tabs) => {
    let activeTab = tabs[0];
    console.log('tabs', tabs, activeTab)
    chrome.tabs.sendMessage(activeTab.id, {message: message});
  });
}


let oldTabId = null
chrome.tabs.query({active: true, currentWindow:true}, (tabs) => {
  let activeTab = tabs[0]
  oldTabId = activeTab.id
})

chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log('activeInfo', activeInfo)
  console.log('oldTabId', oldTabId)
  if (oldTabId) {
    chrome.tabs.sendMessage(oldTabId, {message: 'forceClose'})
    oldTabId = activeInfo.tabId
  }
})


// Called when the user clicks on the browser action
chrome.browserAction.onClicked.addListener(function(tab) {
  // Send a message to the active tab
  sendMessageToActiveTab("clickedBrowserAction")
  // chrome.tabs.query({active: true, currentWindow:true}, (tabs) => {
  //     var activeTab = tabs[0];
  //     chrome.tabs.sendMessage(activeTab.id, {type: });
  // });
});

chrome.runtime.onMessage.addListener(function(request, sender) {
  if (request.type === "getHistory") {
    // console.log('updating history')
    getHistory(false)
  } else if (request.type === 'startAuthFlow') {
    startAuthFlow()
  } else if (request.type === 'removeAccount') {
    removeAccount()
  } else if (request.type === 'openLink') {
    openLink(request.stripUrl)
  }
});


const cleanUrl = (url) => {
  let tabUrl = url
  let indexParam = tabUrl.indexOf('?')
  let indexFrag = tabUrl.indexOf('#')

  if(indexParam !== -1 && indexParam < indexFrag){
    tabUrl = tabUrl.substring(0, indexParam);
  } else if (indexFrag !== -1 && indexFrag < indexParam) {

  }

  if (indexParam === -1 && indexFrag === -1) {
    tabUrl = url
  } else if (indexParam === -1 && indexFrag !== -1) {
    tabUrl = tabUrl.substring(0, indexFrag)
  } else if (indexFrag === -1 && indexParam !== -1) {
    tabUrl = tabUrl.substring(0, indexParam)
  } else if (indexParam !== -1 && indexFrag !== -1) {
    if (indexParam < indexFrag) {
      tabUrl = tabUrl.substring(0, indexParam)
    } else {
      tabUrl = tabUrl.substring(0, indexFrag)
    }
  }

  return tabUrl
}


openLink = (stripUrl) => {
  let cleanedUrl = cleanUrl(stripUrl)
  chrome.tabs.query({}, (tabs) => {
    let found = false
    for (let tab of tabs) {
      // let index = 0
      // let newURL = oldURL
      let tabUrl = cleanUrl(tab.url)
      if (cleanedUrl === tabUrl) {
        chrome.tabs.update(tab.id, { active: true })
        found = true
        break
      }
    }
    if (!found) {
      window.open(stripUrl, '_blank')
    }
  })
}

chrome.commands.onCommand.addListener(function(command) {
  if (command === 'open_search') {
    sendMessageToActiveTab("clickedBrowserAction")
  }
});

let lastOnVisitItem  = {
  id: 0,
  lastVisitTime: 0
}

chrome.history.onVisited.addListener((item) => {
  if (item) {
    if (((item.lastVisitTime - lastOnVisitItem.lastVisitTime) > 6000) || (lastOnVisitItem.id !== item.id) ) {
      chrome.storage.local.get(['services'], (result) => {
        console.log('visited new item', item)
        if (result.services) {
          lastOnVisitItem = item
          // let data = [item, ..._result.history]
          // this.updateServices(result.services, data, true)
          // console.log('originalServices', originalServices)
          // for (let service in originalServices) {
          //   console.log('evaluating', service, !result.services[service])
          //   if (!result.services[service]) {
          //     result.services[service] = originalServices[service]
          //     console.log('adding back', service, result.services[service])
          //   }
          // }
          console.log('after adding back in OG services', result.services)

          // if multiple refresh of the same page (i.e. google docs always refreshs), ignore
          if (result.services['1_all'].items.length > 0 && result.services['1_all'].items[0].id !== item.id) {
            this.updateServices(result.services, [item], true)
          } else {
            console.log('reject duplicate item')
          }
        }
      })
    }
  }
})

const getHistory = (init) => {
  let mutateServices = Object.assign({}, originalServices)
  let searchText = ''
  let maxResults = 3000
  chrome.storage.local.get(['services'], (result) => {
    if (result.services && init) {
      return
    }
    if (result.services && !init) {
      // not init but an update
      console.log('not init but an update')
      // console.log('originalServices', originalServices)
      // for (let service in originalServices) {
      //   if (!result.services[service]) {
      //     result.services[service] = originalServices[service]
      //   }
      // }
      mutateServices = result.services

      // Code here is to add in a specific service however as we do a complete replace of history, it doesnt work well at the moment
      // maxResults = 1000
      // let latestCreatedAt = 0
      // for (let service in result.services) {
      //   if (result.services[service].createdAt) {
      //     if (result.services[service].createdAt > latestCreatedAt) {
      //       searchText = service
      //       latestCreatedAt = result.services[service].createdAt
      //     }
      //   }
      // }
    }

    chrome.history.search({text: searchText, maxResults: maxResults, startTime: 0}, function(data) {
      // let distinctHistory = this.getDistinctHistory(data)
      console.log('services', mutateServices)
      this.updateServices(mutateServices, data, false)
    });
  });

}

// getDistinctHistory = (data) => {
//   let historyTitles = {}
//   let distinctHistory = data.filter((item) => {
//     if (!historyTitles[item.title]) {
//       historyTitles[item.title] = true
//       return true
//     }
//     return false
//   })
//   console.log('distinctHistory', distinctHistory);
//   return distinctHistory
// }

const isDistinct = (data, item) => {
  let index = data.findIndex((record) => {
    // console.log(item.title, record.title, (new URL(item.url)).hostname, (new URL(record.url)).hostname)
    return (item.title === record.title) && ((new URL(item.url)).hostname === (new URL(record.url)).hostname)
  })
  return index
}

const updateServices = (services, data, unshift) => {
  console.log('history is', data)
  console.log('services to change is', services)
  // let allItems = [...services['1_all'].items]
  let serviceKeys = Object.keys(services)
  let allItems = []
  serviceKeys.forEach((service) => {
    if (!unshift) {
      services[service].items = []
    }
    data.forEach((item) => {
      if (item.title === '' || item.url === '') {
        return
      }

      if (service === 'drive.google.com') {
        return
      }

      if (service === '1_all') {
        return
      }

      // removes parameters and fragments
      item.url = cleanUrl(item.url)

      let distinctIndex = this.isDistinct(services[service].items, item)

      // findIndex returns -1
      if (distinctIndex > -1) {
        services[service].items.splice(distinctIndex, 1)
      }

      // let distinctIndexFromAll = this.isDistinct(services['1_all'].items, item)
      //
      // if (distinctIndexFromAll > -1) {
      //   services['1_all'].items.splice(distinctIndexFromAll, 1)
      // }

      // if (service === '1_all') {
      //   if (unshift) {
      //     services[service].items.unshift(item)
      //   } else {
      //     services[service].items.push(item)
      //   }
      // }
      if ((service && item.url.includes(service))) {
        // if whitelist is empty, allow all urls
        const whiteList = services[service].whiteList
        const blackList = services[service].blackList
        if (blackList.length > 0) {
          for (let value of blackList) {
            if (item.url.includes(value)) {
              return false
            }
          }
        }

        if (whiteList.length > 0) {
          for (let value of whiteList) {
            if (item.url.includes(value)) {
              if (unshift) {
                services[service].items.unshift(item)
                // services['1_all'].items.unshift(item)
              } else {
                services[service].items.push(item)
                // services['1_all'].items.push(item)
              }
            }
          }
          // if reach end of whitelist with no return then nothing matches whitelist
          return false
        }

        if (unshift) {
          services[service].items.unshift(item)
          // services['1_all'].items.unshift(item)
        } else {
          services[service].items.push(item)
          // services['1_all'].items.push(item)
        }
      }
    })
    // console.log(service, services[service].items.length)
    if (service !== '1_all') {
      allItems.push(...services[service].items)
    }
    console.log('at end service', service, services[service])
  })

  // for (let service in services) {
  //   // if we're not inserting at top, we are pushing. if we push it means we need to replace old data
  //   if (!unshift) {
  //     services[service].items = []
  //   }
  //   data.forEach((item) => {
  //     if (item.title === '') {
  //       return
  //     }
  //
  //     if (service === 'drive.google.com') {
  //       return
  //     }
  //
  //     if (service === '1_all') {
  //       return
  //     }
  //
  //     let distinctIndex = this.isDistinct(services[service].items, item)
  //
  //     // findIndex returns -1
  //     if (distinctIndex > -1) {
  //       services[service].items.splice(distinctIndex, 1)
  //     }
  //
  //     // let distinctIndexFromAll = this.isDistinct(allItems, item)
  //     //
  //     // if (distinctIndexFromAll > -1) {
  //     //   allItems.splice(distinctIndexFromAll, 1)
  //     // }
  //
  //     // if (service === '1_all') {
  //     //   if (unshift) {
  //     //     services[service].items.unshift(item)
  //     //   } else {
  //     //     services[service].items.push(item)
  //     //   }
  //     // }
  //     if ((service && item.url.includes(service))) {
  //       // if whitelist is empty, allow all urls
  //       const whiteList = services[service].whiteList
  //       const blackList = services[service].blackList
  //       if (blackList.length > 0) {
  //         for (let value of blackList) {
  //           if (item.url.includes(value)) {
  //             return false
  //           }
  //         }
  //       }
  //
  //       if (whiteList.length > 0) {
  //         for (let value of whiteList) {
  //           if (item.url.includes(value)) {
  //             if (unshift) {
  //               services[service].items.unshift(item)
  //               // allItems = [item, ...allItems]
  //             } else {
  //               services[service].items.push(item)
  //               // allItems = [...allItems, item]
  //             }
  //           }
  //         }
  //         // if reach end of whitelist with no return then nothing matches whitelist
  //         return false
  //       }
  //
  //       if (unshift) {
  //         services[service].items.unshift(item)
  //         // allItems = [item, ...allItems]
  //       } else {
  //         services[service].items.push(item)
  //         // allItems = [...allItems, item]
  //       }
  //     }
  //   })
  //   console.log('at end service', service, services[service])
  // }

  console.log('allItems', allItems)
  // let test = []
  // serviceKeys.forEach((service) => {
  //   console.log(service, services[service].items.length)
  //   test.push(...services[service].items)
  // })
  // console.log('test items', test)
  services['1_all'].items = [...allItems]

  console.log('before authtoken services', services['1_all'].items, allItems)

  chrome.identity.getAuthToken({ 'interactive': false }, (authToken) => {
    if (authToken) {
      console.log('mergeDriveAndHistorical services', services)
      this.mergeDriveAndHistorical(authToken, services)
      // chrome.storage.local.set({services: services}, () => {
      //   console.log('services is set to ', services);
      //   console.log('merging drive and historical data')
      //   this.mergeDriveAndHistorical(authToken)
      // });
    } else {

      services['1_all'].items = services['1_all'].items.sort((a, b) => {
        if (!a.lastVisitTime) {
          return 1
        }
        if (!b.lastVisitTime) {
          return -1
        }
        if (a.lastVisitTime > b.lastVisitTime) {
          return -1
        }
        return 1
      })

      for (let service in services) {
        if (services[service].items.length === 0 && services[service].default && (service !== 'calendar.google' && service !== 'drive.google.com' && service !== '1_all')) {
          delete services[service]
        }
      }
      chrome.storage.local.set({services: services}, () => {
        console.log('services is set to ', services);
        sendMessageToActiveTab("updateData")
      });
    }
  })


}

getHistory(true)


// let bookmarkArr = []
// processBookmark = (bookmarks) => {
//   for (let i =0; i < bookmarks.length; i++) {
//     let bookmark = bookmarks[i];
//     if (bookmark.url) {
//       // console.log("bookmark: "+ bookmark.title + " ~  " + bookmark.url);
//       bookmarkArr.push(bookmark)
//       console.log(bookmarkArr)
//       chrome.storage.local.set({bookmarks: bookmarkArr}, function() {
//         console.log('Bookmarks is set to ', bookmarkArr);
//       });
//     }
//
//     if (bookmark.children) {
//       processBookmark(bookmark.children);
//     }
//   }
// }
//
// chrome.bookmarks.getTree(processBookmark);

const removeAccount = () => {
  chrome.identity.getAuthToken({ 'interactive': false },
    function(current_token) {
      if (!chrome.runtime.lastError) {

        // @corecode_begin removeAndRevokeAuthToken
        // @corecode_begin removeCachedAuthToken
        // Remove the local cached token
        chrome.identity.removeCachedAuthToken({ token: current_token },
          function() {});
        // @corecode_end removeCachedAuthToken

        // Make a request to revoke token in the server
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://accounts.google.com/o/oauth2/revoke?token=' +
          current_token);
        xhr.send();
        // @corecode_end removeAndRevokeAuthToken

        // Update the user interface accordingly
        chrome.storage.local.remove(['userInfo', 'services'], function() {
          getHistory(true)
          sendMessageToActiveTab('removeAccount')
        })

        console.log('Token revoked and removed from cache. '+
          'Check chrome://identity-internals to confirm.');
      }
    });
}

const startAuthFlow = () => {
  chrome.identity.getAuthToken({ 'interactive': true }, async function(authToken) {
    console.log('startAuthFlow', authToken)
    if (authToken) {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=' + authToken)
      let longToken = await response.json()
      console.log('longToken', longToken)
      chrome.storage.local.set({authToken: authToken}, function() {
        console.log('Value is set to ' + authToken);
      })
      chrome.identity.getProfileUserInfo(async (info) => {
        console.log(info)
        if (info.id) {
          let userInfo = await this.getUserInfo(authToken, info.id)
          userInfo['email'] = info.email
          chrome.storage.local.set({userInfo: userInfo}, function() {
            console.log('userInfo is set to ', userInfo);
            sendMessageToActiveTab('userInfoUpdated')
          })
        }
      })
      chrome.storage.local.get(['services'], (result) => {
        console.log('connecting to drive')
        if (result.services) {
          for (let service in originalServices) {
            console.log('evaluating', service, !result.services[service])
            if (!result.services[service]) {
              result.services[service] = originalServices[service]
              console.log('adding back', service, result.services[service])
            }
          }
          sendMessageToActiveTab('enableDriveLoading')
          this.mergeDriveAndHistorical(authToken, result.services)
        }
      })
    }
  });
}


const getUserInfo = async (authToken, userId) => {
  let init = {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + authToken,
      'Content-Type': 'application/json'
    },
    'contentType': 'json'
  }

  let res = await fetch('https://people.googleapis.com/v1/people/' + userId + '?personFields=photos%2CemailAddresses%2Cnames', init)
  let data = await res.json()
  return data
}


let driveUpdatedAt = 0
const mergeDriveAndHistorical = async (authToken, services, forceDriveUpdate=false) => {
  // chrome.storage.local.get(['services'], async (result) => {
    let result = {}
    result.services = services
    if (result.services) {
      let timeNow = new Date().getTime()
      let processedFiles = [...result.services['drive.google.com'].items]
      // 300000 being 5 minutes in milliseconds
      if ((timeNow - driveUpdatedAt > 300000) || forceDriveUpdate) {
        console.log('forceDriveupdate', forceDriveUpdate)
        driveUpdatedAt = new Date().getTime()
        processedFiles = await _getDriveFiles(authToken)
      }
      console.log('processedFiles', processedFiles)
      result.services['drive.google.com'].items = [...processedFiles]
      const originalProcessedFiles = [...processedFiles]

      // Add google drive files to All tab
      result.services['1_all'].items = result.services['1_all'].items.filter((item) => {
        return !(item.kind && item.kind === 'drive#file')
      }).map((item) => {
        if (item.url && item.url.includes('docs.google.com')) {
          // "https://docs.google.com/spreadsheets/d/1DbpOKZV5ulEAMJ8a923mXltFlyquwK0LYVafVaeR2aQ/edit?usp=drivesdk"
          let docId = item.url.substring(
            item.url.lastIndexOf("/d/") + 3,
            item.url.lastIndexOf("/edit")
          )
          console.log('docId', docId)
          let driveFileIndex = processedFiles.findIndex((file) => {
            if (file.fileId) {
              return file.fileId === docId
            }
            return file.id === docId
          })
          if (driveFileIndex > -1) {
            console.log('driveFileIndex', driveFileIndex, processedFiles)
            let file = processedFiles[driveFileIndex]
            processedFiles.splice(driveFileIndex, 1)

            // Need to retain the original item id
            if (!file.fileId) {
              file.fileId = file.id
              file.id = item.id
            }
            file.lastVisitTime = item.lastVisitTime
            return file
          }
        }
        return item
      })
      console.log('post processedFiles', processedFiles)
      result.services['1_all'].items.push(...processedFiles)
      result.services['1_all'].items = result.services['1_all'].items.sort((a, b) => {
        if (!a.lastVisitTime) {
          return 1
        }
        if (!b.lastVisitTime) {
          return -1
        }
        if (a.lastVisitTime > b.lastVisitTime) {
          return -1
        }
        return 1
      })


      // Add google drive files to google doc/ sheets tab
      const googleServices = [
        'docs.google.com/document',
        'docs.google.com/spreadsheets',
        'docs.google.com/presentation'
      ]

      for (let googleService of googleServices) {
        // if (!result.services[googleService]) {
        //   result.services[googleService] = Object.assign({}, originalServices[googleService])
        // }
        if (result.services[googleService]) {
          result.services[googleService].items = result.services['1_all'].items.filter((item) => {
            return (item.url && item.url.includes(googleService))
          })
        }
      }

      for (let service in result.services) {
        if (result.services[service].items.length === 0 && services[service].default && (service !== 'calendar.google' && service !== 'drive.google.com' && service !== '1_all')) {
          delete result.services[service]
        }
      }
      sendMessageToActiveTab('disableDriveLoading');
      chrome.storage.local.set({services: result.services, googleDriveFiles: originalProcessedFiles}, function() {
        console.log('googleDriveFiles is set to ', result.services, originalProcessedFiles);
        sendMessageToActiveTab("updateData");
      });
    }
  // })
}


const _getDriveFiles = async(authToken) => {
  console.log('making a network call _getDriveFiles')
  let init = {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + authToken,
      'Content-Type': 'application/json'
    },
    'contentType': 'json'
  }

  // q parameter removes png/ jpeg and folders
  let res = await fetch('https://www.googleapis.com/drive/v3/files?' +
    'fields=*' +
    '&orderBy=viewedByMeTime%20desc' +
    '&q=mimeType%20!%3D%20%27image%2Fpng%27%20and%20mimeType%20!%3D%20%27image%2Fjpeg%27%20and%20mimeType%20!%3D%20%27application%2Fvnd.google-apps.folder%27'
    , init)
  let data = await res.json()
  // let sortedData = data.files.sort((a, b) => {
  //   if (!a.viewedByMeTime) {
  //     return 1
  //   }
  //   if (!b.viewedByMeTime) {
  //     return -1
  //   }
  //   if (a.viewedByMeTime > b.viewedByMeTime) {
  //     return -1
  //   }
  //   return 1
  // })
  let processedFiles = await this._processDriveFiles(data.files ? data.files : [], authToken)

  return processedFiles ? processedFiles : []
}

const _processDriveFiles = async (files, authToken) => {
  let newFiles = files.map(async (file) => {
    let revisions = await this._getRevisions(file.id, authToken)
    let processedRevisions = this._processRevisionFiles(revisions, file.viewedByMeTime)
    file['revisions'] = processedRevisions
    file['url'] = file['webViewLink']
    file['title'] = file['name']
    file['lastVisitTime'] = new Date(file['viewedByMeTime']).getTime()
    // console.log('file', file)
    return file
  })

  console.log('newFiles', newFiles)

  return Promise.all(newFiles)
}

const _processRevisionFiles = (revisions, viewedByMeTime) => {
  let revisionsNotSeen = {
    count: 0,
    userPhotoLinks: []
  }
  revisions.forEach((revision) => {
    // console.log(revision)
    if (revision.modifiedTime > viewedByMeTime) {
      if (revision.lastModifyingUser) {
        revisionsNotSeen.count += 1
        if (!revision.lastModifyingUser.photoLink) {
          revision.lastModifyingUser['photoLink'] = 'https://ui-avatars.com/api/?rounded=true&name=' + revision.lastModifyingUser.displayName
        }
        if (revisionsNotSeen.userPhotoLinks.length < 5 && !revisionsNotSeen.userPhotoLinks.includes(revision.lastModifyingUser.photoLink)) {
          console.log('pushing', revision.lastModifyingUser.photoLink)
          revisionsNotSeen.userPhotoLinks.push(revision.lastModifyingUser.photoLink)
        }
      }
    }
  })
  return revisionsNotSeen
}

const _getRevisions = async(fileId, authToken) => {
  // let init = {
  //   method: 'GET',
  //   headers: {
  //     Authorization: 'Bearer ' + authToken,
  //     'Content-Type': 'application/json'
  //   },
  //   'contentType': 'json'
  // }
  //
  // let res = await fetch('https://www.googleapis.com/drive/v3/files/' + fileId + '/revisions?fields=*', init)
  // let data = await res.json()
  //
  // return data.revisions ? data.revisions : []
  return []
}


