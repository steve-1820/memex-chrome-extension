/*global chrome*/
import React from 'react'
import InlineToolBar from './Components/InlineToolBar/InlineToolBar'



export default  class Main extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <div
        id={'application-root'}
      >
        <InlineToolBar/>

      </div>
    );
  }
}

// const app = document.createElement('div');
// document.body.appendChild(app);
// ReactDOM.render(<Main />, app)

// app.style.display = "none";
// chrome.runtime.onMessage.addListener(
//   function(request, sender, sendResponse) {
//     if( request.message === "clicked_browser_action") {
//       toggle();
//     }
//   }
// );
// function toggle(){
//   if(app.style.display === "none"){
//     app.style.display = "block";
//   }else{
//     app.style.display = "none";
//   }
// }
