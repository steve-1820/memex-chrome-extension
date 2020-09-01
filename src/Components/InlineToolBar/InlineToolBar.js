/*global chrome*/
import React from 'react'
import rangy from 'rangy'
import 'rangy/lib/rangy-highlighter'
import 'rangy/lib/rangy-classapplier'
import 'rangy/lib/rangy-serializer'
import 'rangy/lib/rangy-selectionsaverestore.js'
import './InlineToolBar.css'
import Popover from "react-text-selection-popover"
import {Elements} from "./XPath";
import Readability from 'readability'

export default class InlineToolBar extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      snippets: {},
      newCommentBoxPosition: {
        right: 0,
        top: 0
      },
      newComment: '',
      activeCommentIndex: null,
    }
  }

  componentDidMount() {
    rangy.init()
    this.highlighter = rangy.createHighlighter()
    this.classApplierModule = rangy.modules.ClassApplier

    const highlightPurple = rangy.createClassApplier('inline-tool-bar--highlight-purple')
    const highlightBlue = rangy.createClassApplier('inline-tool-bar--highlight-blue')
    const highlightGreen = rangy.createClassApplier('inline-tool-bar--highlight-green')
    const highlightOrange = rangy.createClassApplier('inline-tool-bar--highlight-orange')
    const highlightRed = rangy.createClassApplier('inline-tool-bar--highlight-red')

    this.highlighter.addClassApplier(highlightPurple)
    this.highlighter.addClassApplier(highlightBlue)
    this.highlighter.addClassApplier(highlightGreen)
    this.highlighter.addClassApplier(highlightOrange)
    this.highlighter.addClassApplier(highlightRed)

    this._getSnippets()

    this.hasDelta = false

    this.totalScrollLength = 0
    this.loadedTime = new Date().getTime()
    this.timeOnPage = 0
    this.isTabActive = true
    this.lastScrollPos = window.scrollY

    window.onfocus = () => {
      this.isTabActive = true
      this.loadedTime = new Date().getTime()
    }

    window.onblur = () => {
      this.isTabActive = false
    }

    document.body.addEventListener('click', (event) => {
      this.handleUserEvent('click', event)
    })

    document.body.addEventListener('mouseover', (event) => {
      this.handleUserEvent('mouseover', event)
    })

    window.addEventListener('scroll', (event) => {
      const currentScrollPos = window.scrollY
      this.totalScrollLength = this.totalScrollLength + Math.abs(currentScrollPos - this.lastScrollPos)
      this.lastScrollPos = currentScrollPos
      this.hasDelta = true
    }, {passive: true})

    window.setInterval(() => {
      const {snippets} = this.state
      if (this.hasDelta) {
        chrome.storage.local.set({snippets: snippets}, () => {
          console.log('snippets is set to ', snippets)
          this.syncDesktop()
        })
        this.hasDelta = false
      }
    }, 1000)
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { snippets } = this.state

    if (snippets !== prevState.snippets) {
      this._findExistingSnippets()
    }
  }

  syncDesktop() {
    const {snippets} = this.state
    fetch('http://localhost:3000/documents', {
      method: 'POST', // or 'PUT'
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(snippets),
    })
  }

  handleUserEvent(type, event) {
    if (event && event.path && event.path.length > 0) {

      let focusNode = event.path[0]
      // console.log('mouseover', event, focusNode.nodeName)
      if (focusNode.textContent
        && (
          focusNode.nodeName.toLowerCase() === 'li'
          || focusNode.nodeName.toLowerCase() === 'p'
          || focusNode.nodeName.toLowerCase() === 'span'
          || focusNode.nodeName.toLowerCase() === 'h1'
          || focusNode.nodeName.toLowerCase() === 'h2'
          || focusNode.nodeName.toLowerCase() === 'h3'
          || focusNode.nodeName.toLowerCase() === 'h4'
          || focusNode.nodeName.toLowerCase() === 'h5'
        )
      ) {
        const xPath = Elements.DOMPath.xPath(focusNode, false)
        console.log(type, focusNode.textContent, xPath)
        this.addUserBehaviour(xPath, type, focusNode)
      }

      if (type === 'click') {
        let from = this.findParent('a',focusNode)
        if (from) {
          let destUrl = from.getAttribute('href')
          // console.log('destUrl', destUrl)
          this.addChildren(destUrl)
        }
      }
    }
  }

  findParent(tagname, el) {
    while (el){
      if ((el.nodeName || el.tagName).toLowerCase()===tagname.toLowerCase()){
        return el;
      }
      el = el.parentNode;
    }
    return null;
  }

  async addChildren(destUrl) {
    let snippets = Object.assign({}, this.state.snippets)
    const url = window.location.href

    let hashUrl = await this.getHashFromString(url)
    let childHashUrl = await this.getHashFromString(destUrl)

    snippets[hashUrl].children.push({
      id: childHashUrl,
      url: destUrl
    })

    chrome.storage.local.set({snippets: snippets}, () => {
      console.log('snippets is set to ', snippets)
    })
  }

  async addUserBehaviour(identifier, type, node) {
    // const { snippets } = this.state
    let snippets = Object.assign({}, this.state.snippets)
    const url = window.location.href

    let hashUrl = await this.getHashFromString(url)

    if (!snippets[hashUrl]) {
      const documentClone = document.cloneNode(true)
      const article = new Readability(documentClone).parse()
      snippets[hashUrl] = {
        ...article,
        url: url,
        behaviour: {
          elements: {},
          page: {}
        },
        highlights: [],
        tags: [],
        children: [],
        committed: false,
        createdTime: new Date().getTime()
      }
    }

    if (!snippets[hashUrl].behaviour.elements[identifier]) {
      snippets[hashUrl].behaviour.elements[identifier] = {}
      snippets[hashUrl].behaviour.elements[identifier].stats = {}
      snippets[hashUrl].behaviour.elements[identifier].textContent = node.textContent
    }

    if (!snippets[hashUrl].behaviour.elements[identifier].stats[type]) {
      snippets[hashUrl].behaviour.elements[identifier].stats[type] = 0
    }

    snippets[hashUrl].behaviour.elements[identifier].stats[type] ++

    snippets[hashUrl].behaviour.page.scrollLength = this.totalScrollLength

    const timeNow = new Date().getTime()
    this.timeOnPage = this.timeOnPage + (timeNow - this.loadedTime)
    this.loadedTime = timeNow

    // divide by 1000 to get to seconds
    snippets[hashUrl].behaviour.page.timeOnPage = this.timeOnPage / 10000

    snippets[hashUrl].updatedTime = new Date().getTime()

    this.setState({
      snippets: snippets
    }, () => {
      this.hasDelta = true
    })
  }

  _getSnippets () {
    chrome.storage.local.get(['snippets'], (result) => {
      if (result.snippets) {
        this.setState({
          snippets: result.snippets
        })
      }
    })
  }

  async _findExistingSnippets() {
    const { snippets } = this.state
    const url = window.location.href

    let hashUrl = await this.getHashFromString(url)

    snippets[hashUrl] && snippets[hashUrl].highlights && snippets[hashUrl].highlights.forEach((snippet) => {
      if (snippet.type === 'highlight' && snippet.url === window.location.href) {
        console.log('deserialize')
        this.highlighter.deserialize(snippet.serializedHighlight)
      }
    })
  }

  _getCommentBoxPositionFromSelection(selection) {
    let offsetTop = selection.focusNode.parentNode.getBoundingClientRect().top + window.scrollY
    let offsetLeft = selection.focusNode.parentNode.getBoundingClientRect().left + window.scrollX
    let newX = offsetLeft + Math.floor(selection.focusNode.parentNode.offsetWidth / 2);
    let newY = offsetTop + 5 + selection.focusNode.parentNode.offsetHeight
    return {
      right: 16,
      top: offsetTop -34
    }
  }

  _getCommentBoxPositionFromRange(range) {
    if (range.length === 0) {
      return {
        right: 0,
        top: 0
      }
    }

    let offsetTop = range[0].endContainer.parentNode.getBoundingClientRect().top + window.scrollY
    let offsetLeft = range[0].endContainer.parentNode.getBoundingClientRect().left + window.scrollX
    return {
      right: 16,
      top: offsetTop
    }
  }


  _addComment() {
    const { snippets } = this.state
    const selection = rangy.getSelection()
    const url = window.location.href
    const time = new Date().getTime()

    let serializedSelection = rangy.serializeSelection(selection, true)
    let newSnippets = [...snippets]

    // this.selectedSelection = rangy.saveSelection()

    let snippet = {
      comments: [],
      serializedSelection: serializedSelection,
      selectedHtml: selection.toHtml(),
      selectedText: selection.toString(),
      url: url,
      type: 'comments',
      id: 'snippet_' + time
    }
    newSnippets.push(snippet)

    this.setState({
      snippets: newSnippets,
      activeCommentIndex: newSnippets.length - 1
    })
  }

  _cancelNewComment() {
    this.setState({
      newComment: '',
      showNewCommentBox: 'hidden'
    })
  }

  _addToExistingComment(index) {
    console.log('_addToExistingComment')
    const { snippets, newComment } = this.state
    let newSnippets = [...snippets]
    let snippet = snippets[index]

    snippet.comments.push({
      text: newComment,
      author: 'Steve Liu',
      image: 'https://images.squarespace-cdn.com/content/v1/5d649f9517b79d0001af66ae/1566885565865-420GZRYVR1NTY2KLF1DM/ke17ZwdGBToddI8pDm48kMsqkWliX6W_6ekv_6jy-OdZw-zPPgdn4jUwVcJE1ZvWEtT5uBSRWt4vQZAgTJucoTqqXjS3CfNDSuuf31e0tVGY2cY-hRQYGx12NgfETIpVY56Ec50ctUDnauqPlspIoSb8BodarTVrzIWCp72ioWw/profilepic2_circle.png?format=500w',
      time: new Date().toDateString()
    })

    this.setState({
      snippets: newSnippets
    }, () => {
      this._cancelNewComment()
    })

    chrome.storage.local.set({snippets: newSnippets}, () => {
      console.log('snippets is set to ', newSnippets)
    })
  }

  _showComment(index) {
    this.setState({
      activeCommentIndex: index
    })
  }

  cleanUrl = (url) => {
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

  async getHashFromString(url) {
    const cleanedUrl = this.cleanUrl(url)
    const msgUint8 = new TextEncoder().encode(cleanedUrl);                           // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);           // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
    return hashHex;
  }

  async _highlight(className) {
    const { snippets } = this.state
    const selection = rangy.getSelection()
    this.highlighter.highlightSelection(className)
    const url = window.location.href
    const time = new Date().getTime()

    // Serialize highlight
    let serializedHighlight = this.highlighter.serialize()
    let hashUrl = await this.getHashFromString(url)

    let newSnippets = snippets[hashUrl] && snippets[hashUrl].highlights  && snippets[hashUrl].highlights.map((snippet) => {
      if (snippet.type === 'highlight' && snippet.url === url) {
        let existingSerialization = snippet.serializedHighlight.replace('type:textContent', '')
        serializedHighlight.replace(existingSerialization, '')
      }
      return snippet
    })

    if (!newSnippets) {
      newSnippets = []
    }

    let snippet = {
      serializedHighlight: serializedHighlight,
      selectedHtml: selection.toHtml(),
      selectedText: selection.toString(),
      className: className,
      createdTime: new Date().getTime(),
      url: url,
      type: 'highlight',
      id: 'snippet_' + time
    }

    newSnippets.push(snippet)

    if (!snippets[hashUrl]) {
      snippets[hashUrl] = {}
    }

    snippets[hashUrl].highlights = newSnippets
    snippets[hashUrl].updatedTime = new Date().getTime()

    this.setState({
      snippets: snippets
    })

    // User action just immediately save event
    chrome.storage.local.set({snippets: snippets}, () => {
      console.log('snippets is set to ', snippets)
    })
  }

  _deserializeSelection(serialized, rootNode, win) {
    win = window;
    rootNode = document.documentElement;
    let serializedRanges = serialized.split("|");
    // let sel = rangy.getSelection(win);
    let ranges = [];

    for (let i = 0, len = serializedRanges.length; i < len; ++i) {
      try {
        ranges[i] = rangy.deserializeRange(serializedRanges[i], rootNode, win.document);
      } catch (e) {
        console.log(e)
      }
    }

    return ranges;
  }


  render () {
    return (
      <div>
        <Popover>
          <div id={'inline-toolbar'} className={'inline-toolbar'}>
            <div
              onMouseDown={(e) => {
                this._highlight('inline-tool-bar--highlight-purple')
              }}
              className={'inline-tool-bar--highlight-purple inline-tool-bar--highlight-options'}
            />
            <div
              onMouseDown={(e) => {
                this._highlight('inline-tool-bar--highlight-blue')
              }}
              className={'inline-tool-bar--highlight-blue inline-tool-bar--highlight-options'}
            />
            <div
              onMouseDown={(e) => {
                this._highlight('inline-tool-bar--highlight-green')
              }}
              className={'inline-tool-bar--highlight-green inline-tool-bar--highlight-options'}
            />
            <div
              onMouseDown={(e) => {
                this._highlight('inline-tool-bar--highlight-orange')
              }}
              className={'inline-tool-bar--highlight-orange inline-tool-bar--highlight-options'}
            />
            <div
              onMouseDown={(e) => {
                this._highlight('inline-tool-bar--highlight-red')
              }}
              className={'inline-tool-bar--highlight-red inline-tool-bar--highlight-options'}
            />
          </div>
        </Popover>
      </div>
    )
  }
}
