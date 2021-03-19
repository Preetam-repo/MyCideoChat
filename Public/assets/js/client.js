const socket = io();

socket.on("connect", () => console.log("connected", socket.id));

socket.on("disconnect", (reason) => {
  console.log("disconnected :", reason);
});

let userStream;
//local video
let local_video = document.getElementById("local-video");

//connected username //Loged In user
let url_string = window.location.href;
let url = new URL(url_string);
let username = url.searchParams.get("username");

//user to call
let call_to;
let call_to_username = document.getElementById("call-to");
let call_btn = document.getElementById("call-btn");
let remote_video = document.getElementById("remote-video");
let online_users_list = document.getElementById("online_users_list");
let user;
// call_btn.addEventListener("click", () => {
//   socket.emit("my_socket_id");
// });

var answersFrom = {},
  offer;
var peerConnection =
  window.RTCPeerConnection ||
  window.mozRTCPeerConnection ||
  window.webkitRTCPeerConnection ||
  window.msRTCPeerConnection;

var sessionDescription =
  window.RTCSessionDescription ||
  window.mozRTCSessionDescription ||
  window.webkitRTCSessionDescription ||
  window.msRTCSessionDescription;

navigator.getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia ||
  navigator.msGetUserMedia;

var pc = new peerConnection({
  iceServers: [
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun.l.google.com:19302" },
  ],
});

//add users
socket.emit("add_user", username);

//show users list
socket.on("user_list", (users) => {
  let html = "";
  let online_users = users.filter((u) => u != username);
  if (online_users != "") {
    online_users.forEach((user) => {
      html += "<li onclick='createOffer(this)'><p>" + user + "</p><li>"; //have to implement a click function on each user to send offer
    });
    online_users_list.innerHTML = html;
  }

  // user = document.getElementById("user");
  // user.addEventListener("click", () => {
  //   console.log("clicked");
  // });
});

pc.ontrack = function (event) {
  console.log(event.streams[0].getTracks());
  remote_video.srcObject = event.streams[0];
};

navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  .then((stream) => {
    userStream = stream;
    local_video.srcObject = userStream;
    userStream.getTracks().forEach(function (track) {
      console.log(track);
      pc.addTrack(track, userStream);
      // pc.onicecandidate = OnIceCandidateFunction;
    });
    console.log(userStream.getTracks());
    // pc.ontrack = function (event) {
    //   console.log(event.streams[0]);
    //   remote_video.srcObject = event.streams[0];
    //   // document.getElementById("hangup-button").disabled = false;
    // };
  })
  .catch((error) => console.log(error));

//function to create offer to the particular user
function createOffer(el) {
  call_to_username = el.innerText;
  console.log("clicked : ", call_to_username);
  pc.createOffer(function (offer) {
    pc.setLocalDescription(
      new sessionDescription(offer),
      function () {
        socket.emit("make-offer", {
          offer: offer,
          to: call_to_username,
        });
      },
      error
    );
  }, error);
}

socket.on("offer-made", function (data) {
  offer = data.offer;
  console.log("offer-made :", data);
  pc.setRemoteDescription(
    new sessionDescription(data.offer),
    function () {
      pc.createAnswer(function (answer) {
        pc.setLocalDescription(
          new sessionDescription(answer),
          function () {
            socket.emit("make-answer", {
              answer: answer,
              to: data.socket,
            });
          },
          error
        );
      }, error);
    },
    error
  );
});

socket.on("answer-made", function (data) {
  console.log("answer made", data);
  pc.setRemoteDescription(
    new sessionDescription(data.answer),
    function () {
      // document.getElementById(data.socket).setAttribute("class", "active");
      console.log(userStream.getTracks());
      if (!answersFrom[data.socket]) {
        createOffer(data.socket);
        answersFrom[data.socket] = true;
      }
    },
    error
  );
  console.log(pc.connectionState);
});

// function OnIceCandidateFunction(event) {
//   console.log("Candidate");
//   if (event.candidate) {
//     console.log(event.candidate);
//     socket.emit("candidate", event.candidate, roomName);
//   }
// }

function OnTrackFunction(event) {
  console.log(event.streams[0]);
  remote_video.srcObject = event.streams[0];
  remote_video.onloadedmetadata = function (e) {
    remote_video.play();
  };
}

function error(err) {
  console.warn("Error", err);
}

//=================Just Testing of MediaTracks================//
// let btnGetAudioTracks = document.getElementById("btnGetAudioTracks");
// let btnGetTrackById = document.getElementById("btnGetTrackById");
// let btnGetTracks = document.getElementById("btnGetTracks");
// let btnGetVideoTracks = document.getElementById("btnGetVideoTracks");
// let btnRemoveAudioTrack = document.getElementById("btnRemoveAudioTrack");
// let btnRemoveVideoTrack = document.getElementById("btnRemoveVideoTrack");

// btnGetAudioTracks.addEventListener("click", function () {
//   console.log("getAudioTracks");
//   console.log(userStream.getAudioTracks());
// });

// btnGetTrackById.addEventListener("click", function () {
//   console.log("getTrackById");
//   console.log(userStream.getTrackById(userStream.getAudioTracks()[0].id));
// });

// btnGetTracks.addEventListener("click", function () {
//   console.log("getTracks()");
//   console.log(userStream.getTracks());
// });

// btnGetVideoTracks.addEventListener("click", function () {
//   console.log("getVideoTracks()");
//   console.log(userStream.getVideoTracks());
// });

// btnRemoveAudioTrack.addEventListener("click", function () {
//   console.log("removeAudioTrack()");
//   userStream.removeTrack(userStream.getAudioTracks()[0]);
// });

// btnRemoveVideoTrack.addEventListener("click", function () {
//   console.log("removeVideoTrack()");
//   userStream.removeTrack(userStream.getVideoTracks()[0]);
// });
